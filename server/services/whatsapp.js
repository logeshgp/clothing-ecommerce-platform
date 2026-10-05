import { config } from '../config.js';
import { audit } from '../db.js';

/**
 * Server-side WhatsApp notifications.
 *
 * Legacy paid-order notifications support all owner-enabled WhatsApp contacts.
 *
 * Providers:
 *   log    — development default, prints to the console
 *   meta   — WhatsApp Cloud API (graph.facebook.com)
 *   twilio — Twilio WhatsApp
 */

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function isValidNumber(value) {
  const d = digits(value);
  return d.length >= 10 && d.length <= 15;
}

/** Adds the default country code when a bare 10-digit Indian number is given. */
export function normalizeNumber(value, defaultCode = '91') {
  const d = digits(value);
  if (d.length === 10) return `${defaultCode}${d}`;
  return d;
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

/* ----------------------------------------------------------------- templates */

export function customerMessage(order, settings) {
  const lines = [
    `*${settings.storeName}* — order received 🎉`,
    `Order: *${order.id}*`,
    `Placed: ${new Date(order.placedAt).toLocaleString('en-IN')}`,
    '',
    '*Items*',
    ...order.items.map(
      (line, i) =>
        `${i + 1}. ${line.name} — ${line.color}/${line.size} × ${line.quantity} = ${inr.format(
          line.price * line.quantity,
        )}`,
    ),
    '',
    `Total paid: *${inr.format(order.totals.total)}*`,
    `Payment: ${order.payment.method?.toUpperCase() ?? 'CARD'}${
      order.payment.last4 ? ` ending ${order.payment.last4}` : ''
    }`,
    '',
    `Delivery by ${new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}`,
    `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`,
    '',
    `Questions? Reply here or email ${settings.supportEmail}.`,
  ];
  return lines.join('\n');
}

export function ownerMessage(order, settings) {
  const { shippingAddress: a, contact, totals, payment } = order;

  const lines = [
    `*New order — ${settings.storeName}*`,
    `Order: ${order.id}`,
    `Placed: ${new Date(order.placedAt).toLocaleString('en-IN')}`,
    '',
    '*Items*',
    ...order.items.map(
      (line, i) =>
        `${i + 1}. ${line.name} — ${line.color}/${line.size} × ${line.quantity} = ${inr.format(
          line.price * line.quantity,
        )}`,
    ),
    '',
    '*Payment*',
    `Subtotal: ${inr.format(totals.subtotal)}`,
  ];

  if (totals.festiveDiscount > 0) {
    lines.push(`${totals.festiveLabel} (${totals.festivePercent}%): -${inr.format(totals.festiveDiscount)}`);
  }
  if (totals.codeDiscount > 0) {
    lines.push(`Promo${order.promo ? ` (${order.promo.code})` : ''}: -${inr.format(totals.codeDiscount)}`);
  }

  lines.push(
    `Shipping (${order.shippingMethod}): ${totals.shipping === 0 ? 'Free' : inr.format(totals.shipping)}`,
    `GST: ${inr.format(totals.tax)}`,
    `*Total: ${inr.format(totals.total)}*`,
    `Gateway: ${order.payment.provider} · ${payment.method ?? 'card'}${
      payment.last4 ? ` ••••${payment.last4}` : ''
    }`,
    `Reference: ${payment.reference ?? '—'}`,
    '',
    '*Customer*',
    `${a.firstName} ${a.lastName}`,
    contact.email,
    contact.phone,
    '',
    '*Ship to*',
    [a.line1, a.line2].filter(Boolean).join(', '),
    `${a.city}, ${a.state} ${a.postalCode}`,
    a.country,
  );

  return lines.join('\n');
}

/* ----------------------------------------------------------------- providers */

async function sendViaMeta(to, body) {
  const { token, phoneNumberId, apiVersion } = config.whatsapp.metaCloud;
  if (!token || !phoneNumberId) throw new Error('WhatsApp Cloud API is not configured.');

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { preview_url: false, body },
      }),
    },
  );

  if (!response.ok) throw new Error(`Meta API error: ${await response.text()}`);
  return response.json();
}

async function sendViaTwilio(to, body) {
  const { accountSid, authToken, from } = config.whatsapp.twilio;
  if (!accountSid || !authToken || !from) throw new Error('Twilio WhatsApp is not configured.');

  const params = new URLSearchParams({
    From: `whatsapp:+${digits(from)}`,
    To: `whatsapp:+${digits(to)}`,
    Body: body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    },
  );

  if (!response.ok) throw new Error(`Twilio error: ${await response.text()}`);
  return response.json();
}

async function sendOne(to, body) {
  const number = normalizeNumber(to);
  if (!isValidNumber(number)) return { ok: false, to, error: 'invalid-number' };

  try {
    if (config.whatsapp.provider === 'meta') {
      const result = await sendViaMeta(number, body);
      return { ok: true, to: number, id: result.messages?.[0]?.id };
    }
    if (config.whatsapp.provider === 'twilio') {
      const result = await sendViaTwilio(number, body);
      return { ok: true, to: number, id: result.sid };
    }

    // `log` provider — the default in development.
    console.log(`\n[whatsapp → +${number}]\n${body}\n`);
    return { ok: true, to: number, id: 'logged', simulated: true };
  } catch (error) {
    console.error('[whatsapp] send failed:', error.message);
    return { ok: false, to: number, error: error.message };
  }
}

/**
 * Notifies the customer and the owner about a paid order.
 * Failures are logged and returned, never thrown — a messaging outage must not
 * roll back a successful payment.
 */
export async function notifyOrder(order, settings) {
  const whatsapp = settings.whatsapp ?? {};
  if (!whatsapp.enabled) return { skipped: true, reason: 'disabled' };

  const results = {};

  if (whatsapp.notifyCustomer !== false && order.contact?.phone) {
    results.customer = await sendOne(order.contact.phone, customerMessage(order, settings));
  }

  if (whatsapp.notifyOwner !== false) {
    const contacts = Array.isArray(whatsapp.contacts)
      ? whatsapp.contacts.filter((contact) => contact.enabled !== false)
      : whatsapp.number
        ? [{ id: 'owner', number: whatsapp.number }]
        : [];
    for (const contact of contacts) {
      results[contact.id || contact.number] = await sendOne(contact.number, ownerMessage(order, settings));
    }
  }

  audit('whatsapp.notify', { detail: { order: order.id, results } });
  return results;
}

/** Used by the admin console's "send a test message" button. */
export async function sendTest(number, storeName) {
  return sendOne(
    number,
    `*${storeName}* — test message.\nWhatsApp order alerts are configured correctly.`,
  );
}
