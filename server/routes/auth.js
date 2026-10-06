import { randomUUID, randomInt, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';
import { db, now, audit } from '../db.js';
import {
  clean,
  clearCookie,
  createSession,
  destroySession,
  destroyUserSessions,
  hashPassword,
  passwordProblems,
  rateLimit,
  roleForEmail,
  setCookie,
  sha256,
  verifyPassword,
  clientIp,
} from '../security.js';
import { fail, readJson, send } from '../http.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Constant-time string comparison for secrets of equal expected length. */
function timingSafeMatch(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? '',
    role: user.role,
  };
}

function issueSession(res, user, req) {
  const session = createSession(user, req);
  setCookie(res, config.session.cookieName, session.token, { maxAgeMs: config.session.ttlMs });
  // Readable by JS so the client can echo it back in the X-CSRF-Token header.
  setCookie(res, config.session.csrfCookieName, session.csrf, {
    maxAgeMs: config.session.ttlMs,
    httpOnly: false,
  });
  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now(), user.id);
  return session;
}

function findUser(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase().trim());
}

/**
 * Authentication.
 *
 * Three sign-in options are supported:
 *   · password      — scrypt hashed, strength enforced
 *   · email code    — six-digit one-time code (passwordless)
 *   · guest         — checkout without an account
 *
 * Roles come from the environment allowlists, never from the request, so a
 * customer can't escalate themselves to admin or support.
 */
export async function handleAuth(req, res, pathname, session) {
  const ip = clientIp(req);

  /* ------------------------------------------------------------- session */

  if (pathname === '/api/auth/session' && req.method === 'GET') {
    if (!session) return send(res, 200, { user: null });
    return send(res, 200, { user: publicUser(session.user), csrf: session.csrf });
  }

  /* -------------------------------------------------------------- signup */

  if (pathname === '/api/auth/register' && req.method === 'POST') {
    const limit = rateLimit(`register:${ip}`, config.rateLimits.login);
    if (!limit.ok) return fail(res, 429, 'Too many attempts. Try again shortly.');

    const body = await readJson(req);
    const email = clean(body.email, 160).toLowerCase();
    const name = clean(body.name, 80);
    const password = String(body.password ?? '');

    if (!EMAIL_RE.test(email)) return fail(res, 400, 'Enter a valid email address.');
    if (!name) return fail(res, 400, 'Name is required.');

    const problems = passwordProblems(password);
    if (problems.length) return fail(res, 400, `Password needs ${problems.join(', ')}.`);

    if (findUser(email)) return fail(res, 409, 'An account with that email already exists.');

    const { hash, salt } = hashPassword(password);
    const user = {
      id: randomUUID(),
      email,
      name,
      phone: clean(body.phone, 20),
      role: roleForEmail(email),
    };

    db.prepare(
      `INSERT INTO users (id, email, name, phone, password_hash, password_salt, role, provider, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'password', ?)`,
    ).run(user.id, user.email, user.name, user.phone, hash, salt, user.role, now());

    issueSession(res, user, req);
    audit('auth.register', { actor: email, ip });
    return send(res, 201, { user: publicUser(user) });
  }

  /* --------------------------------------------------------------- login */

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await readJson(req);
    const email = clean(body.email, 160).toLowerCase();

    // Rate limit per IP *and* per account to blunt both spraying and targeting.
    const byIp = rateLimit(`login:${ip}`, config.rateLimits.login);
    const byEmail = rateLimit(`login:${email}`, config.rateLimits.login);
    if (!byIp.ok || !byEmail.ok) {
      audit('auth.rate_limited', { actor: email, ip });
      return fail(res, 429, 'Too many attempts. Try again in a few minutes.');
    }

    const user = findUser(email);
    const valid = user && verifyPassword(String(body.password ?? ''), user.password_hash, user.password_salt);

    if (!valid) {
      audit('auth.login_failed', { actor: email, ip });
      // Identical message either way — no account enumeration.
      return fail(res, 401, 'Email or password is incorrect.');
    }

    const role = roleForEmail(email);
    if (role !== user.role) db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, user.id);

    issueSession(res, { ...user, role }, req);
    audit('auth.login', { actor: email, ip });
    return send(res, 200, { user: publicUser({ ...user, role }) });
  }

  /* ------------------------------------------------- passwordless (code) */

  if (pathname === '/api/auth/code/request' && req.method === 'POST') {
    const limit = rateLimit(`code:${ip}`, config.rateLimits.login);
    if (!limit.ok) return fail(res, 429, 'Too many attempts. Try again shortly.');

    const body = await readJson(req);
    const email = clean(body.email, 160).toLowerCase();
    if (!EMAIL_RE.test(email)) return fail(res, 400, 'Enter a valid email address.');

    const code = String(randomInt(100000, 999999));
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare(
      `INSERT INTO login_codes (email, code_hash, expires_at, attempts) VALUES (?, ?, ?, 0)
       ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash,
                                        expires_at = excluded.expires_at,
                                        attempts = 0`,
    ).run(email, sha256(code), expires);

    // Mail provider is "log" in development: the code appears in the console.
    console.log(`\n[login code] ${email} → ${code} (valid 10 minutes)\n`);
    audit('auth.code_requested', { actor: email, ip });

    return send(res, 200, {
      sent: true,
      // Surfaced only in development so the flow is testable without email.
      devCode: config.isProduction ? undefined : code,
    });
  }

  if (pathname === '/api/auth/code/verify' && req.method === 'POST') {
    // Brute force fix: the per-email attempt counter can be reset by simply
    // requesting a fresh code, so verification needs its own per-IP cap.
    const verifyLimit = rateLimit(`code-verify:${ip}`, config.rateLimits.login);
    if (!verifyLimit.ok) return fail(res, 429, 'Too many attempts. Try again in a few minutes.');

    const body = await readJson(req);
    const email = clean(body.email, 160).toLowerCase();
    const code = clean(body.code, 10);

    const row = db.prepare('SELECT * FROM login_codes WHERE email = ?').get(email);
    if (!row) return fail(res, 400, 'Request a new code.');

    if (new Date(row.expires_at) < new Date()) {
      db.prepare('DELETE FROM login_codes WHERE email = ?').run(email);
      return fail(res, 400, 'That code expired. Request a new one.');
    }

    if (row.attempts >= 5) {
      db.prepare('DELETE FROM login_codes WHERE email = ?').run(email);
      audit('auth.code_locked', { actor: email, ip });
      return fail(res, 429, 'Too many wrong codes. Request a new one.');
    }

    // Brute force fix: count the attempt *before* comparing, so a crash or a
    // disconnect mid-request cannot be used to retry indefinitely.
    db.prepare('UPDATE login_codes SET attempts = attempts + 1 WHERE email = ?').run(email);

    // Timing fix: constant-time compare so the stored hash cannot be probed
    if (!timingSafeMatch(sha256(code), row.code_hash)) {
      return fail(res, 401, 'That code is incorrect.');
    }

    db.prepare('DELETE FROM login_codes WHERE email = ?').run(email);

    let user = findUser(email);
    const role = roleForEmail(email);

    if (!user) {
      user = { id: randomUUID(), email, name: email.split('@')[0], phone: '', role };
      db.prepare(
        `INSERT INTO users (id, email, name, phone, role, provider, created_at)
         VALUES (?, ?, ?, '', ?, 'email-code', ?)`,
      ).run(user.id, user.email, user.name, role, now());
    } else {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, user.id);
      user = { ...user, role };
    }

    issueSession(res, user, req);
    audit('auth.login_code', { actor: email, ip });
    return send(res, 200, { user: publicUser(user) });
  }

  /* -------------------------------------------------------------- logout */

  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    if (session) {
      destroySession(session.token);
      audit('auth.logout', { actor: session.user.email, ip });
    }
    clearCookie(res, config.session.cookieName);
    clearCookie(res, config.session.csrfCookieName);
    return send(res, 200, { ok: true });
  }

  /* ----------------------------------------------------- change password */

  if (pathname === '/api/auth/password' && req.method === 'POST') {
    if (!session) return fail(res, 401, 'Sign in to continue.');

    // Brute force fix: throttle current-password guessing on a hijacked tab.
    const pwLimit = rateLimit(`password:${session.user.id}`, config.rateLimits.login);
    if (!pwLimit.ok) return fail(res, 429, 'Too many attempts. Try again in a few minutes.');

    const body = await readJson(req);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user.id);
    if (!user) return fail(res, 401, 'Sign in to continue.');

    const current = String(body.currentPassword ?? '');
    const next = String(body.newPassword ?? '');

    if (user.password_hash && !verifyPassword(current, user.password_hash, user.password_salt)) {
      audit('auth.password_change_failed', { actor: user.email, ip });
      return fail(res, 401, 'Current password is incorrect.');
    }

    const problems = passwordProblems(next);
    if (problems.length) return fail(res, 400, `Password needs ${problems.join(', ')}.`);

    const { hash, salt } = hashPassword(next);
    db.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').run(
      hash,
      salt,
      user.id,
    );

    // Any other device holding a session is signed out.
    destroyUserSessions(user.id);
    issueSession(res, { ...user, role: roleForEmail(user.email) }, req);
    audit('auth.password_changed', { actor: user.email, ip });

    return send(res, 200, { ok: true });
  }

  return null;
}
