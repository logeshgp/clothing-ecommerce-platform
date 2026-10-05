import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { config, newToken } from './config.js';
import { db, now, audit } from './db.js';

/* ------------------------------------------------------------------ passwords */

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
  }).toString('hex');
  return { hash, salt };
}

/** Constant-time comparison — never short-circuits on the first wrong byte. */
export function verifyPassword(password, hash, salt) {
  if (!hash || !salt) return false;
  const candidate = scryptSync(password, salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
  });
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

export function passwordProblems(password) {
  const problems = [];
  if (String(password).length < 10) problems.push('at least 10 characters');
  if (!/[a-z]/.test(password)) problems.push('a lowercase letter');
  if (!/[A-Z]/.test(password)) problems.push('an uppercase letter');
  if (!/\d/.test(password)) problems.push('a number');
  return problems;
}

/* ------------------------------------------------------------------- sessions */

export function createSession(user, req) {
  const token = newToken(32);
  const csrf = newToken(24);
  const expires = new Date(Date.now() + config.session.ttlMs).toISOString();

  db.prepare(
    `INSERT INTO sessions (token, user_id, csrf, created_at, expires_at, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(token, user.id, csrf, now(), expires, clientIp(req), String(req.headers['user-agent'] || '').slice(0, 300));

  return { token, csrf, expires };
}

export function readSession(req) {
  const token = parseCookies(req)[config.session.cookieName];
  if (!token) return null;

  const row = db
    .prepare(
      `SELECT s.token, s.csrf, s.expires_at, u.id, u.email, u.name, u.role, u.phone
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`,
    )
    .get(token);

  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }

  return {
    token: row.token,
    csrf: row.csrf,
    user: { id: row.id, email: row.email, name: row.name, role: row.role, phone: row.phone },
  };
}

export function destroySession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function destroyUserSessions(userId) {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

/* -------------------------------------------------------------------- cookies */

export function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((part) => {
      const index = part.indexOf('=');
      const key = part.slice(0, index).trim();
      const value = decodeURIComponent(part.slice(index + 1).trim());
      return [key, value];
    }),
  );
}

export function setCookie(res, name, value, { maxAgeMs, httpOnly = true } = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    // The storefront and admin are static on GitHub Pages while the API is
    // hosted separately. Secure production cookies need cross-site credentials;
    // API origin checks and the CSRF token protect state-changing requests.
    `SameSite=${config.session.secure ? 'None' : 'Lax'}`,
  ];
  if (httpOnly) parts.push('HttpOnly');
  if (config.session.secure) parts.push('Secure');
  if (maxAgeMs) parts.push(`Max-Age=${Math.floor(maxAgeMs / 1000)}`);

  const existing = res.getHeader('Set-Cookie');
  const header = existing ? [].concat(existing, parts.join('; ')) : [parts.join('; ')];
  res.setHeader('Set-Cookie', header);
}

export function clearCookie(res, name) {
  setCookie(res, name, '', { maxAgeMs: 0 });
}

/* ----------------------------------------------------------------------- CORS */

export function resolveOrigin(origin) {
  if (!origin) return null;
  const allowed = [...config.origins.store, ...config.origins.admin];
  if (allowed.includes(origin.toLowerCase())) return origin;

  if (config.origins.allowLan) {
    // Dev convenience: private LAN addresses and tunnel hosts.
    if (/^https?:\/\/(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)[\d.]+(:\d+)?$/.test(origin)) return origin;
    if (/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(origin)) return origin;
    if (/^https:\/\/[a-z0-9-]+\.ngrok(-free)?\.app$/.test(origin)) return origin;
  }
  return null;
}

export function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  if (config.session.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

/* --------------------------------------------------------------- rate limiting */

const buckets = new Map();

export function rateLimit(key, { windowMs, max }) {
  const stamp = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || stamp > bucket.reset) {
    buckets.set(key, { count: 1, reset: stamp + windowMs });
    return { ok: true, remaining: max - 1 };
  }

  bucket.count += 1;
  if (bucket.count > max) {
    return { ok: false, retryAfter: Math.ceil((bucket.reset - stamp) / 1000) };
  }
  return { ok: true, remaining: max - bucket.count };
}

setInterval(() => {
  const stamp = Date.now();
  for (const [key, bucket] of buckets) if (stamp > bucket.reset) buckets.delete(key);
}, 60_000).unref?.();

export function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

/* ------------------------------------------------------------------ allowlists */

export function roleForEmail(email) {
  const normalized = String(email || '').toLowerCase().trim();
  if (config.access.adminEmails.includes(normalized)) return 'admin';
  if (config.access.supportEmails.includes(normalized)) return 'support';
  return 'customer';
}

export function requireRole(session, roles) {
  if (!session) return { ok: false, status: 401, error: 'Sign in to continue.' };

  // The allowlist is re-checked on every request, so removing an address from
  // the environment revokes access immediately — even for live sessions.
  const live = roleForEmail(session.user.email);
  if (live !== session.user.role) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(live, session.user.id);
    session.user.role = live;
  }

  if (!roles.includes(live)) {
    audit('access.denied', { actor: session.user.email, detail: { roles, live } });
    return { ok: false, status: 403, error: 'Your account is not allowed to access this area.' };
  }
  return { ok: true };
}

/** Double-submit CSRF: the header must match the session's token. */
export function verifyCsrf(req, session) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
  if (!session) return true; // unauthenticated POSTs are rate-limited separately
  const header = req.headers['x-csrf-token'];
  return Boolean(header) && header === session.csrf;
}

/** Strips angle brackets and control characters from user-supplied strings. */
export function clean(value, maxLength = 500) {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}
