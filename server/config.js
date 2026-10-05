import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function list(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function bool(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Central configuration. Everything sensitive (gateway keys, WhatsApp tokens,
 * the email allowlists) lives here and is read from the environment — none of
 * it is ever shipped to the browser.
 */
export const config = {
  isProduction,
  port: Number(process.env.PORT) || 4000,

  paths: {
    root: path.resolve(here, '..'),
    data: process.env.DATA_DIR || path.resolve(here, 'data'),
    uploads: process.env.UPLOAD_DIR || path.resolve(here, 'data', 'uploads'),
    db: process.env.DB_FILE || path.resolve(here, 'data', 'store.db'),
  },

  /**
   * Browser origins allowed to call the API with credentials. On GitHub Pages,
   * the storefront and /console share the same origin.
   */
  origins: {
    store: list(process.env.STORE_ORIGINS).length
      ? list(process.env.STORE_ORIGINS)
      : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    admin: list(process.env.ADMIN_ORIGINS).length
      ? list(process.env.ADMIN_ORIGINS)
      : ['http://localhost:5174', 'http://127.0.0.1:5174'],
    /** Set true in dev to also accept LAN/tunnel origins. */
    allowLan: bool(process.env.ALLOW_LAN_ORIGINS, !isProduction),
  },

  session: {
    cookieName: 'dnd_session',
    csrfCookieName: 'dnd_csrf',
    ttlMs: Number(process.env.SESSION_TTL_HOURS || 12) * 60 * 60 * 1000,
    secure: bool(process.env.COOKIE_SECURE, isProduction),
  },

  /**
   * Access control. Only these addresses can reach the admin and support
   * consoles — enforced on every request, not just at login.
   */
  access: {
    adminEmails: list(process.env.ADMIN_EMAILS).length
      ? list(process.env.ADMIN_EMAILS)
      : ['admin@dndstore.com'],
    supportEmails: list(process.env.SUPPORT_EMAILS).length
      ? list(process.env.SUPPORT_EMAILS)
      : ['support@dndstore.com'],
    /** Seed password used only when bootstrapping the first admin/support users. */
    bootstrapPassword: process.env.BOOTSTRAP_PASSWORD || 'ChangeMe!2026',
  },

  uploads: {
    maxBytes: Number(process.env.UPLOAD_MAX_BYTES) || 4 * 1024 * 1024,
    allowedMime: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  },

  payments: {
    provider: 'disabled',
    currency: 'INR',
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID || '',
      keySecret: process.env.RAZORPAY_KEY_SECRET || '',
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    },
    juspay: {
      merchantId: process.env.JUSPAY_MERCHANT_ID || '',
      apiKey: process.env.JUSPAY_API_KEY || '',
      baseUrl: process.env.JUSPAY_BASE_URL || 'https://sandbox.juspay.in',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
    },
  },

  /** Storefront enquiries use customer-initiated WhatsApp Click-to-Chat drafts. */
  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || 'log',
    metaCloud: {
      token: process.env.WHATSAPP_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      from: process.env.TWILIO_WHATSAPP_FROM || '',
    },
  },

  mail: {
    provider: process.env.MAIL_PROVIDER || 'log',
    from: process.env.MAIL_FROM || 'DND Store <no-reply@dndstore.example>',
  },

  rateLimits: {
    login: { windowMs: 10 * 60 * 1000, max: 8 },
    write: { windowMs: 60 * 1000, max: 60 },
    upload: { windowMs: 60 * 1000, max: 30 },
    public: { windowMs: 60 * 1000, max: 240 },
  },
};

/** Warn loudly rather than silently running insecurely in production. */
export function assertProductionSafety() {
  if (!config.isProduction) return;

  const problems = [];
  if (config.access.bootstrapPassword === 'ChangeMe!2026') {
    problems.push('BOOTSTRAP_PASSWORD is still the default.');
  }
  if (!config.session.secure) problems.push('COOKIE_SECURE should be true behind HTTPS.');
  if (config.origins.allowLan) problems.push('ALLOW_LAN_ORIGINS should be false in production.');

  if (problems.length) {
    console.warn('\n[security] Review before going live:');
    problems.forEach((p) => console.warn(`  · ${p}`));
    console.warn('');
  }
}

export function newToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}
