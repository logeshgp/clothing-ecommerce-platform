import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { db, now, getSetting, setSetting, audit } from '../db.js';
import { clean, rateLimit, requireRole, clientIp } from '../security.js';
import { fail, readBuffer, readJson, send, match } from '../http.js';
import { parseSingleFile, saveImage, deleteUpload } from '../services/uploads.js';
import { sendTest, isValidNumber, normalizeNumber } from '../services/whatsapp.js';
import { loadCategories, loadProducts, loadProduct } from './catalog.js';

/**
 * Admin API. Every route is gated by `requireRole(session, ['admin'])`, which
 * re-checks the ADMIN_EMAILS allowlist on each request.
 */

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sanitizeProduct(input, existing) {
  const colors = (Array.isArray(input.colors) ? input.colors : [])
    .map((color) => ({
      name: clean(color.name, 40),
      image: clean(color.image, 600),
    }))
    .filter((color) => color.name && color.image);

  const sizes = (Array.isArray(input.sizes) ? input.sizes : []).map((s) => clean(s, 8)).filter(Boolean);

  const stock = {};
  colors.forEach((color) => {
    sizes.forEach((size) => {
      const key = `${color.name}::${size}`;
      stock[key] = Math.max(0, Number(input.stock?.[key] ?? existing?.stock?.[key] ?? 0) || 0);
    });
  });

  const id = existing?.id ?? clean(input.id, 60) ?? `p-${randomUUID().slice(0, 8)}`;
  const name = clean(input.name, 120);

  return {
    id,
    slug: `${id}-${slugify(name)}`,
    name,
    category: clean(input.category, 60),
    gender: ['men', 'women', 'unisex'].includes(input.gender) ? input.gender : 'unisex',
    price: Math.max(0, Number(input.price) || 0),
    compareAt: input.compareAt ? Math.max(0, Number(input.compareAt)) : null,
    fit: clean(input.fit, 30) || 'regular',
    fabric: clean(input.fabric, 60),
    blurb: clean(input.blurb, 400),
    released: clean(input.released, 20) || new Date().toISOString().slice(0, 10),
    rating: Math.min(5, Math.max(1, Number(input.rating) || 4.5)),
    reviews: Math.max(0, Number(input.reviews) || 0),
    sold: Math.max(0, Number(input.sold) || 0),
    tags: (Array.isArray(input.tags) ? input.tags : []).map((t) => clean(t, 20)).filter(Boolean),
    sizes,
    colors,
    stock,
    care: (Array.isArray(input.care) ? input.care : existing?.care ?? [])
      .map((c) => clean(c, 160))
      .filter(Boolean),
    details: (Array.isArray(input.details) ? input.details : existing?.details ?? [])
      .map((d) => clean(d, 200))
      .filter(Boolean),
    measurements: input.measurements ?? existing?.measurements ?? null,
    // Per-product editable copy, shown on the product page.
    copy: Object.fromEntries(
      Object.entries({ ...(existing?.copy ?? {}), ...(input.copy ?? {}) }).map(([key, value]) => [
        key,
        clean(value, 600),
      ]),
    ),
  };
}

export async function handleAdmin(req, res, pathname, session) {
  if (!pathname.startsWith('/api/admin')) return null;

  const gate = requireRole(session, ['admin']);
  if (!gate.ok) return fail(res, gate.status, gate.error);

  const ip = clientIp(req);
  const actor = session.user.email;

  if (req.method !== 'GET') {
    const limit = rateLimit(`admin:${actor}`, config.rateLimits.write);
    if (!limit.ok) return fail(res, 429, 'Slow down a moment.');
  }

  /* ------------------------------------------------------------ overview */

  if (pathname === '/api/admin/overview' && req.method === 'GET') {
    const products = loadProducts();
    const orders = db
      .prepare('SELECT total, status, created_at FROM orders WHERE status = ?')
      .all('paid');

    return send(res, 200, {
      settings: getSetting('store', {}),
      promos: getSetting('promos', []),
      announcements: getSetting('announcements', []),
      categories: loadCategories({ activeOnly: false }),
      products,
      stats: {
        productCount: products.length,
        orderCount: orders.length,
        revenue: orders.reduce((sum, o) => sum + o.total, 0),
        openThreads: db
          .prepare("SELECT COUNT(*) AS n FROM support_threads WHERE status IN ('open','pending')")
          .get().n,
      },
      access: {
        adminEmails: config.access.adminEmails,
        supportEmails: config.access.supportEmails,
      },
    });
  }

  /* ------------------------------------------------------------ products */

  if (pathname === '/api/admin/products' && req.method === 'POST') {
    const body = await readJson(req);
    const existing = body.id ? loadProduct(body.id) : null;
    const product = sanitizeProduct(body, existing);

    if (!product.name) return fail(res, 400, 'Product name is required.');
    if (!product.colors.length) return fail(res, 400, 'Add at least one colour with a photo.');
    if (!product.sizes.length) return fail(res, 400, 'Select at least one size.');
    if (product.price <= 0) return fail(res, 400, 'Enter a price greater than zero.');

    const categoryExists = loadCategories({ activeOnly: false }).some(
      (c) => c.slug === product.category,
    );
    if (!categoryExists) return fail(res, 400, 'Choose an existing category.');

    db.prepare(
      `INSERT INTO products (id, slug, category, price, data, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, category = excluded.category,
                                     price = excluded.price, data = excluded.data,
                                     updated_at = excluded.updated_at`,
    ).run(product.id, product.slug, product.category, product.price, JSON.stringify(product), now());

    audit('admin.product_saved', { actor, ip, detail: { id: product.id, name: product.name } });
    return send(res, 200, { product });
  }

  const productParams = match('/api/admin/products/:id', pathname);
  if (productParams && req.method === 'DELETE') {
    db.prepare('DELETE FROM products WHERE id = ?').run(productParams.id);
    audit('admin.product_deleted', { actor, ip, detail: { id: productParams.id } });
    return send(res, 200, { ok: true });
  }

  /* ---------------------------------------------------------- categories */

  if (pathname === '/api/admin/categories' && req.method === 'GET') {
    return send(res, 200, { categories: loadCategories({ activeOnly: false }) });
  }

  if (pathname === '/api/admin/categories' && req.method === 'POST') {
    const body = await readJson(req);
    const name = clean(body.name, 60);
    if (!name) return fail(res, 400, 'Category name is required.');

    const slug = clean(body.slug, 60) || slugify(name);
    const blurb = clean(body.blurb, 200);
    const position = Number(body.position) || 0;
    const active = body.active !== false ? 1 : 0;

    db.prepare(
      `INSERT INTO categories (slug, name, blurb, position, active) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET name = excluded.name, blurb = excluded.blurb,
                                       position = excluded.position, active = excluded.active`,
    ).run(slug, name, blurb, position, active);

    audit('admin.category_saved', { actor, ip, detail: { slug, name } });
    return send(res, 200, { categories: loadCategories({ activeOnly: false }) });
  }

  const categoryParams = match('/api/admin/categories/:slug', pathname);
  if (categoryParams && req.method === 'DELETE') {
    const inUse = db
      .prepare('SELECT COUNT(*) AS n FROM products WHERE category = ?')
      .get(categoryParams.slug).n;

    if (inUse > 0) {
      return fail(
        res,
        409,
        `${inUse} product${inUse === 1 ? '' : 's'} still use this category. Move them first.`,
      );
    }

    db.prepare('DELETE FROM categories WHERE slug = ?').run(categoryParams.slug);
    audit('admin.category_deleted', { actor, ip, detail: { slug: categoryParams.slug } });
    return send(res, 200, { categories: loadCategories({ activeOnly: false }) });
  }

  /* ------------------------------------------------------------ settings */

  if (pathname === '/api/admin/settings' && req.method === 'PATCH') {
    const body = await readJson(req);
    const current = getSetting('store', {});

    // Deep-merge the nested blocks the console edits individually.
    const next = {
      ...current,
      ...body,
      festiveOffer: { ...current.festiveOffer, ...(body.festiveOffer ?? {}) },
      bulkDiscount: {
        active: false,
        minQuantity: 10,
        percent: 0,
        label: '',
        ...(current.bulkDiscount ?? {}),
        ...(body.bulkDiscount ?? {}),
      },
      hero: { ...current.hero, ...(body.hero ?? {}) },
      banner: { ...current.banner, ...(body.banner ?? {}) },
      support: { ...current.support, ...(body.support ?? {}) },
      productCopy: { ...current.productCopy, ...(body.productCopy ?? {}) },
      whatsapp: {
        ...current.whatsapp,
        ...(body.whatsapp ?? {}),
        contacts: Array.isArray(body.whatsapp?.contacts)
          ? body.whatsapp.contacts.map((contact) => ({
              id: clean(contact.id, 40) || `contact-${randomUUID().slice(0, 8)}`,
              label: clean(contact.label, 60) || 'Store',
              number: normalizeNumber(contact.number),
              enabled: contact.enabled !== false,
            }))
          : current.whatsapp?.contacts ?? [],
      },
      shippingMethods: Array.isArray(body.shippingMethods)
        ? body.shippingMethods.map((m) => ({
            id: clean(m.id, 30),
            label: clean(m.label, 40),
            detail: clean(m.detail, 80),
            price: Math.max(0, Number(m.price) || 0),
            freeOverThreshold: Boolean(m.freeOverThreshold),
          }))
        : current.shippingMethods,
    };

    for (const contact of next.whatsapp.contacts) {
      if (contact.enabled && !isValidNumber(contact.number)) {
        return fail(res, 400, 'Each enabled WhatsApp contact needs a valid 10–15 digit number.');
      }
    }

    if (next.whatsapp?.number) {
      next.whatsapp.number = normalizeNumber(next.whatsapp.number);
      if (next.whatsapp.enabled && !isValidNumber(next.whatsapp.number)) {
        return fail(res, 400, 'Enter a WhatsApp number with 10–15 digits including country code.');
      }
    }

    next.taxRate = Math.min(0.28, Math.max(0, Number(next.taxRate) || 0));
    next.freeShippingThreshold = Math.max(0, Number(next.freeShippingThreshold) || 0);
    next.bulkDiscount.minQuantity = Math.max(1, Number(next.bulkDiscount.minQuantity) || 1);
    next.bulkDiscount.percent = Math.min(100, Math.max(0, Number(next.bulkDiscount.percent) || 0));
    next.bulkDiscount.label = clean(next.bulkDiscount.label, 80);

    setSetting('store', next);
    audit('admin.settings_updated', { actor, ip, detail: Object.keys(body) });
    return send(res, 200, { settings: next });
  }

  /* -------------------------------------------------------------- promos */

  if (pathname === '/api/admin/promos' && req.method === 'PUT') {
    const body = await readJson(req);
    const promos = (Array.isArray(body.promos) ? body.promos : []).map((promo) => ({
      id: clean(promo.id, 40) || `promo-${randomUUID().slice(0, 8)}`,
      code: clean(promo.code, 30).toUpperCase(),
      type: ['percent', 'fixed', 'shipping'].includes(promo.type) ? promo.type : 'percent',
      value: Math.max(0, Number(promo.value) || 0),
      description: clean(promo.description, 160),
      minSubtotal: Math.max(0, Number(promo.minSubtotal) || 0),
      active: promo.active !== false,
    }));

    setSetting('promos', promos);
    audit('admin.promos_updated', { actor, ip, detail: { count: promos.length } });
    return send(res, 200, { promos });
  }

  /* ------------------------------------------------------- announcements */

  if (pathname === '/api/admin/announcements' && req.method === 'PUT') {
    const body = await readJson(req);
    const announcements = (Array.isArray(body.announcements) ? body.announcements : []).map((a) => ({
      id: clean(a.id, 40) || `a-${randomUUID().slice(0, 8)}`,
      text: clean(a.text, 200),
      active: a.active !== false,
    }));

    setSetting('announcements', announcements);
    audit('admin.announcements_updated', { actor, ip, detail: { count: announcements.length } });
    return send(res, 200, { announcements });
  }

  /* ------------------------------------------------------------- uploads */

  if (pathname === '/api/admin/uploads' && req.method === 'POST') {
    const limit = rateLimit(`upload:${actor}`, config.rateLimits.upload);
    if (!limit.ok) return fail(res, 429, 'Too many uploads. Please wait a moment.');

    const contentType = req.headers['content-type'] ?? '';

    try {
      let buffer;

      if (contentType.startsWith('multipart/form-data')) {
        const raw = await readBuffer(req, config.uploads.maxBytes + 8192);
        const part = parseSingleFile(raw, contentType);
        if (!part) return fail(res, 400, 'No file found in the request.');
        buffer = part.content;
      } else {
        // Raw binary upload (used by the admin console's drag-and-drop).
        buffer = await readBuffer(req, config.uploads.maxBytes + 1024);
      }

      const upload = saveImage(buffer, { actor });
      audit('admin.upload', { actor, ip, detail: { id: upload.id, size: upload.size } });
      return send(res, 201, { upload });
    } catch (error) {
      return fail(res, error.status ?? 400, error.message);
    }
  }

  const uploadParams = match('/api/admin/uploads/:id', pathname);
  if (uploadParams && req.method === 'DELETE') {
    const removed = deleteUpload(uploadParams.id);
    return send(res, removed ? 200 : 404, removed ? { ok: true } : { error: 'Upload not found.' });
  }

  /* ------------------------------------------------------- whatsapp test */

  if (pathname === '/api/admin/whatsapp/test' && req.method === 'POST') {
    const body = await readJson(req);
    const settings = getSetting('store', {});
    const number = normalizeNumber(body.number ?? settings.whatsapp?.number);

    if (!isValidNumber(number)) return fail(res, 400, 'Enter a valid WhatsApp number first.');

    const result = await sendTest(number, settings.storeName ?? 'DND Store');
    audit('admin.whatsapp_test', { actor, ip, detail: result });
    return send(res, 200, { result, provider: config.whatsapp.provider });
  }

  /* -------------------------------------------------------------- orders */

  if (pathname === '/api/admin/orders' && req.method === 'GET') {
    const rows = db
      .prepare('SELECT data FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 200')
      .all('paid');
    return send(res, 200, { orders: rows.map((r) => JSON.parse(r.data)) });
  }

  /* ----------------------------------------------------------- audit log */

  if (pathname === '/api/admin/audit' && req.method === 'GET') {
    const rows = db
      .prepare('SELECT actor, action, detail, ip, created_at FROM audit_log ORDER BY id DESC LIMIT 100')
      .all();
    return send(res, 200, { entries: rows });
  }

  return fail(res, 404, 'Unknown admin endpoint.');
}
