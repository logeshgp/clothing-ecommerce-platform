import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

/**
 * SQLite via Node's built-in driver — no native build step, no extra
 * dependency. Rich documents (products, settings, orders) are stored as JSON
 * columns so the admin console can edit arbitrary fields without migrations.
 */

fs.mkdirSync(path.dirname(config.paths.db), { recursive: true });
fs.mkdirSync(config.paths.uploads, { recursive: true });

export const db = new DatabaseSync(config.paths.db);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL DEFAULT '',
    phone         TEXT NOT NULL DEFAULT '',
    password_hash TEXT,
    password_salt TEXT,
    role          TEXT NOT NULL DEFAULT 'customer',
    provider      TEXT NOT NULL DEFAULT 'password',
    created_at    TEXT NOT NULL,
    last_login_at TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    csrf       TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    ip         TEXT,
    user_agent TEXT
  );

  CREATE TABLE IF NOT EXISTS login_codes (
    email      TEXT PRIMARY KEY,
    code_hash  TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts   INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS categories (
    slug     TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    blurb    TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    active   INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS products (
    id         TEXT PRIMARY KEY,
    slug       TEXT NOT NULL,
    category   TEXT NOT NULL,
    price      INTEGER NOT NULL DEFAULT 0,
    data       TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id         TEXT PRIMARY KEY,
    user_id    TEXT,
    email      TEXT NOT NULL,
    phone      TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL DEFAULT 'created',
    total      REAL NOT NULL DEFAULT 0,
    provider   TEXT NOT NULL DEFAULT 'mock',
    data       TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS support_threads (
    id         TEXT PRIMARY KEY,
    user_id    TEXT,
    email      TEXT NOT NULL,
    name       TEXT NOT NULL DEFAULT '',
    subject    TEXT NOT NULL,
    kind       TEXT NOT NULL DEFAULT 'query',
    product_id TEXT,
    order_id   TEXT,
    status     TEXT NOT NULL DEFAULT 'open',
    priority   TEXT NOT NULL DEFAULT 'normal',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS support_messages (
    id          TEXT PRIMARY KEY,
    thread_id   TEXT NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
    author_role TEXT NOT NULL,
    author_name TEXT NOT NULL DEFAULT '',
    body        TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS uploads (
    id         TEXT PRIMARY KEY,
    filename   TEXT NOT NULL,
    mime       TEXT NOT NULL,
    size       INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    actor      TEXT,
    action     TEXT NOT NULL,
    detail     TEXT,
    ip         TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
  CREATE INDEX IF NOT EXISTS idx_threads_status ON support_threads(status);
  CREATE INDEX IF NOT EXISTS idx_messages_thread ON support_messages(thread_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`);

export const now = () => new Date().toISOString();

/* ------------------------------------------------------------------ helpers */

export function getSetting(key, fallback = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}

export function setSetting(key, value) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(key, JSON.stringify(value));
  return value;
}

export function audit(action, { actor = null, detail = null, ip = null } = {}) {
  db.prepare('INSERT INTO audit_log (actor, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)').run(
    actor,
    action,
    detail ? JSON.stringify(detail).slice(0, 2000) : null,
    ip,
    now(),
  );
}

export function parseRow(row, extra = {}) {
  if (!row) return null;
  return { ...JSON.parse(row.data), ...extra };
}

/** Removes expired sessions and login codes. Called on boot and hourly. */
export function pruneExpired() {
  const stamp = now();
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(stamp);
  db.prepare('DELETE FROM login_codes WHERE expires_at < ?').run(stamp);
}
