import { randomBytes, timingSafeEqual } from 'node:crypto';
import { db, now, getSetting, audit } from '../db.js';
import { config } from '../config.js';
import { clean, rateLimit, clientIp } from '../security.js';
import { fail, readJson, send, match } from '../http.js';
import { getGateway } from '../payments/index.js';
import { notifyOrder } from '../services/whatsapp.js';
import { validateAddress } from '../../shared/geo.js';
import { loadProduct } from './catalog.js';

/**
 * Checkout pipeline.
 *
 *   1. POST /api/checkout/intent   — server re-prices the cart, creates a
 *                                    gateway intent, stores a pending order
 *   2. POST /api/checkout/confirm  — verifies payment with the gateway, marks
 *                                    the order paid, sends WhatsApp messages
 *
 * Prices and totals are always recomputed from the database. Anything the
 * browser claims about amounts is ignored.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Upper bound on distinct cart lines accepted in a single checkout request. */
const MAX_CART_LINES = 50;

/**
 * Order identifiers are quoted by guests to retrieve their order, so they are
 * treated as a capability: unguessable, and never derived from the clock.
 */
function newOrderId() {
  // IDOR fix: replaced timestamp-derived (enumerable) order id with random token
  return `DND-${randomBytes(9).toString('base64url').toUpperCase()}`;
}

/** Constant-time compare; an empty claimed value never matches. */
function sameValue(a, b) {
  const left = Buffer.from(String(a ?? ''));
  const right = Buffer.from(String(b ?? ''));
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Who may read an order: the signed-in owner, staff, or someone who can quote
 * the exact email recorded on it (the guest confirmation page).
 */
function canAccessOrder(row, session, claimedEmail) {
  if (session) {
    if (row.user_id && row.user_id === session.user.id) return true;
    if (['admin', 'support'].includes(session.user.role)) return true;
    if (sameValue(String(session.user.email).toLowerCase(), String(row.email).toLowerCase())) {
      return true;
    }
  }
  // BOLA fix: constant-time match; a blank header can no longer satisfy the check
  return sameValue(claimedEmail, String(row.email).toLowerCase());
}

function round(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function priceCart(items, settings, promoCode, shippingMethodId) {
  const lines = [];

  for (const item of items) {
    const product = loadProduct(item.productId);
    if (!product) throw Object.assign(new Error('A product in your bag is no longer available.'), { status: 409 });

    const quantity = Math.max(1, Math.min(10, Number(item.quantity) || 1));
    const stock = product.stock?.[`${item.color}::${item.size}`] ?? 0;
    if (stock < quantity) {
      throw Object.assign(
        new Error(`${product.name} (${item.color}/${item.size}) only has ${stock} left.`),
        { status: 409 },
      );
    }

    lines.push({
      id: `${product.id}::${item.size}::${item.color}`,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      color: clean(item.color, 40),
      size: clean(item.size, 10),
      quantity,
      price: product.price, // authoritative price from the database
      image: product.colors?.find((c) => c.name === item.color)?.image ?? product.colors?.[0]?.image,
    });
  }

  const subtotal = round(lines.reduce((sum, line) => sum + line.price * line.quantity, 0));

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const bulk = settings.bulkDiscount;
  const bulkActive = Boolean(
    bulk?.active && bulk.percent > 0 && itemCount >= (Number(bulk.minQuantity) || Infinity),
  );
  const bulkDiscount = bulkActive ? round(subtotal * (bulk.percent / 100)) : 0;
  const afterBulk = Math.max(round(subtotal - bulkDiscount), 0);
  const festive = settings.festiveOffer;
  const festiveActive = Boolean(festive?.active && festive.percent > 0 && afterBulk > 0);
  const festiveDiscount = festiveActive ? round(afterBulk * (festive.percent / 100)) : 0;
  const afterFestive = Math.max(round(afterBulk - festiveDiscount), 0);

  const promos = getSetting('promos', []) ?? [];
  const promo = promoCode
    ? promos.find(
        (p) =>
          p.active !== false &&
          p.code.toUpperCase() === String(promoCode).toUpperCase() &&
          afterFestive >= (p.minSubtotal ?? 0),
      )
    : null;

  let codeDiscount = 0;
  if (promo?.type === 'percent') codeDiscount = round(afterFestive * (promo.value / 100));
  if (promo?.type === 'fixed') codeDiscount = Math.min(promo.value, afterFestive);

  const payable = Math.max(round(afterFestive - codeDiscount), 0);

  const methods = settings.shippingMethods ?? [];
  const method = methods.find((m) => m.id === shippingMethodId) ?? methods[0];
  const threshold = settings.freeShippingThreshold ?? 1999;

  let shipping = 0;
  if (promo?.type !== 'shipping' && method && payable > 0) {
    shipping = method.freeOverThreshold && payable >= threshold ? 0 : method.price;
  }

  const tax = round(payable * (settings.taxRate ?? 0.05));
  const total = round(payable + shipping + tax);

  return {
    lines,
    promo: promo ?? null,
    shippingMethod: method?.id ?? 'standard',
    totals: {
      subtotal,
      bulkDiscount,
      bulkLabel: bulkActive ? bulk.label : null,
      bulkPercent: bulkActive ? bulk.percent : 0,
      festiveDiscount,
      festiveLabel: festiveActive ? festive.label : null,
      festivePercent: festiveActive ? festive.percent : 0,
      codeDiscount,
      discount: round(bulkDiscount + festiveDiscount + codeDiscount),
      payable,
      shipping,
      tax,
      taxRate: settings.taxRate ?? 0.05,
      total,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    },
  };
}

function decrementStock(lines) {
  const read = db.prepare('SELECT data FROM products WHERE id = ?');
  const write = db.prepare('UPDATE products SET data = ?, updated_at = ? WHERE id = ?');

  for (const line of lines) {
    const row = read.get(line.productId);
    if (!row) continue;

    const product = JSON.parse(row.data);
    const key = `${line.color}::${line.size}`;
    product.stock = { ...product.stock, [key]: Math.max(0, (product.stock?.[key] ?? 0) - line.quantity) };
    product.sold = (product.sold ?? 0) + line.quantity;

    write.run(JSON.stringify(product), now(), line.productId);
  }
}

export async function handleOrders(req, res, pathname, session) {
  if (
    pathname === '/api/checkout/intent' ||
    pathname === '/api/checkout/confirm' ||
    pathname === '/api/webhooks/payment'
  ) {
    return fail(res, 410, 'Online checkout is disabled. Send a purchase enquiry through WhatsApp.');
  }

  const ip = clientIp(req);

  /* -------------------------------------------------------------- intent */

  if (pathname === '/api/checkout/intent' && req.method === 'POST') {
    const limit = rateLimit(`checkout:${ip}`, config.rateLimits.write);
    if (!limit.ok) return fail(res, 429, 'Too many attempts. Please wait a moment.');

    const body = await readJson(req);
    const settings = getSetting('store', {});

    const email = clean(body.contact?.email, 160).toLowerCase();
    const phone = clean(body.contact?.phone, 20);
    if (!EMAIL_RE.test(email)) return fail(res, 400, 'Enter a valid email address.');

    const address = {
      firstName: clean(body.shippingAddress?.firstName, 60),
      lastName: clean(body.shippingAddress?.lastName, 60),
      line1: clean(body.shippingAddress?.line1, 160),
      line2: clean(body.shippingAddress?.line2, 160),
      city: clean(body.shippingAddress?.city, 80),
      state: clean(body.shippingAddress?.state, 80),
      postalCode: clean(body.shippingAddress?.postalCode, 20),
      country: clean(body.shippingAddress?.country, 60),
      phone,
    };

    // Country, state and postcode are validated server-side as well as in the UI.
    const { errors } = validateAddress(address);
    if (!address.firstName) errors.firstName = 'First name is required.';
    if (!address.lastName) errors.lastName = 'Last name is required.';
    if (Object.keys(errors).length) {
      return send(res, 422, { error: 'Please correct the highlighted fields.', fields: errors });
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return fail(res, 400, 'Your bag is empty.');
    }
    // DoS fix: bound the number of cart lines so one request cannot force
    // thousands of product lookups.
    if (body.items.length > MAX_CART_LINES) {
      return fail(res, 400, 'Too many items in your bag.');
    }

    let priced;
    try {
      priced = priceCart(body.items, settings, body.promoCode, body.shippingMethod);
    } catch (error) {
      return fail(res, error.status ?? 400, error.message);
    }

    const gateway = getGateway();
    const orderId = newOrderId();

    let intent;
    try {
      intent = await gateway.createIntent({
        id: orderId,
        total: priced.totals.total,
        contact: { email, phone },
        returnUrl: `${req.headers.origin ?? ''}/order/${orderId}`,
      });
    } catch (error) {
      console.error('[checkout] intent failed:', error.message);
      return fail(res, error.status ?? 502, 'Could not start the payment. Please try again.');
    }

    const record = {
      id: orderId,
      status: 'pending',
      placedAt: now(),
      items: priced.lines,
      totals: priced.totals,
      promo: priced.promo,
      shippingMethod: priced.shippingMethod,
      contact: { email, phone },
      shippingAddress: address,
      payment: { provider: gateway.id, reference: intent.reference, status: 'pending' },
    };

    db.prepare(
      `INSERT INTO orders (id, user_id, email, phone, status, total, provider, data, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
    ).run(
      orderId,
      session?.user?.id ?? null,
      email,
      phone,
      priced.totals.total,
      gateway.id,
      JSON.stringify(record),
      now(),
    );

    audit('order.intent', { actor: email, ip, detail: { orderId, total: priced.totals.total } });

    return send(res, 201, {
      orderId,
      totals: priced.totals,
      items: priced.lines,
      payment: intent.clientConfig,
      redirectUrl: intent.redirectUrl ?? null,
    });
  }

  /* ------------------------------------------------------------- confirm */

  if (pathname === '/api/checkout/confirm' && req.method === 'POST') {
    const limit = rateLimit(`confirm:${ip}`, config.rateLimits.write);
    if (!limit.ok) return fail(res, 429, 'Too many attempts. Please wait a moment.');

    const body = await readJson(req);
    const orderId = clean(body.orderId, 40);

    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!row) return fail(res, 404, 'Order not found.');

    const order = JSON.parse(row.data);
    if (order.status === 'paid') return send(res, 200, { order });

    const gateway = getGateway();
    let result;
    try {
      result = await gateway.confirm({ ...body, reference: order.payment.reference, orderId });
    } catch (error) {
      console.error('[checkout] confirm failed:', error.message);
      return fail(res, 502, 'We could not verify the payment. Please contact support.');
    }

    if (!result.paid) {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('failed', orderId);
      audit('order.payment_failed', { actor: order.contact.email, ip, detail: { orderId } });
      return fail(res, 402, result.error ?? 'Payment was declined.');
    }

    const settings = getSetting('store', {});
    const eta = new Date();
    eta.setDate(eta.getDate() + ({ standard: 6, express: 3, overnight: 1 }[order.shippingMethod] ?? 6));

    const paid = {
      ...order,
      status: 'confirmed',
      estimatedDelivery: eta.toISOString(),
      payment: {
        ...order.payment,
        status: 'paid',
        method: result.method ?? 'card',
        last4: result.last4 ?? '',
        reference: result.reference ?? order.payment.reference,
        paidAt: now(),
      },
    };

    db.prepare('UPDATE orders SET status = ?, data = ? WHERE id = ?').run(
      'paid',
      JSON.stringify(paid),
      orderId,
    );

    decrementStock(paid.items);

    // Sent from the server — the customer's browser is not involved.
    const messaging = await notifyOrder(paid, settings);

    audit('order.paid', { actor: paid.contact.email, ip, detail: { orderId, total: paid.totals.total } });

    return send(res, 200, { order: paid, messaging });
  }

  /* --------------------------------------------------------------- reads */

  const orderParams = match('/api/orders/:id', pathname);
  if (orderParams && req.method === 'GET') {
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderParams.id);
    if (!row) return fail(res, 404, 'Order not found.');

    const order = JSON.parse(row.data);
    const email = String(req.headers['x-order-email'] ?? '').toLowerCase().trim();

    // BOLA fix: centralised constant-time ownership check — a null user_id can
    // no longer match a null session id, and a blank email never passes.
    if (!canAccessOrder(row, session, email)) {
      audit('order.access_denied', {
        actor: session?.user?.email ?? email ?? null,
        ip,
        detail: { orderId: row.id },
      });
      return fail(res, 403, 'You cannot view this order.');
    }
    return send(res, 200, { order });
  }

  if (pathname === '/api/orders' && req.method === 'GET') {
    if (!session) return fail(res, 401, 'Sign in to view your orders.');

    const rows = db
      .prepare('SELECT data FROM orders WHERE user_id = ? AND status = ? ORDER BY created_at DESC')
      .all(session.user.id, 'paid');

    return send(res, 200, { orders: rows.map((r) => JSON.parse(r.data)) });
  }

  return null;
}

/** Gateway webhooks — verified by signature, never by session. */
export async function handleWebhook(req, res, rawBody) {
  const gateway = getGateway();
  const { valid, event } = await gateway.verifyWebhook(rawBody, req.headers);

  if (!valid) {
    audit('webhook.rejected', { detail: { provider: gateway.id } });
    return fail(res, 400, 'Invalid signature.');
  }

  audit('webhook.received', { detail: { provider: gateway.id, type: event?.event ?? 'unknown' } });
  return send(res, 200, { received: true });
}
