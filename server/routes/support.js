import { randomUUID } from 'node:crypto';
import { db, now, audit } from '../db.js';
import { config } from '../config.js';
import { clean, rateLimit, requireRole, clientIp } from '../security.js';
import { fail, readJson, send, match } from '../http.js';

/**
 * Support desk.
 *
 * Shoppers raise a query or complaint from the product page; agents answer from
 * the support console. One thread holds the whole conversation.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const KINDS = ['query', 'complaint', 'return', 'sizing', 'order'];
const STATUSES = ['open', 'pending', 'resolved', 'closed'];
const PRIORITIES = ['low', 'normal', 'high'];

function threadWithMessages(thread) {
  const messages = db
    .prepare('SELECT * FROM support_messages WHERE thread_id = ? ORDER BY created_at')
    .all(thread.id);

  return {
    id: thread.id,
    email: thread.email,
    name: thread.name,
    subject: thread.subject,
    kind: thread.kind,
    productId: thread.product_id,
    orderId: thread.order_id,
    status: thread.status,
    priority: thread.priority,
    createdAt: thread.created_at,
    updatedAt: thread.updated_at,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.author_role,
      name: m.author_name,
      body: m.body,
      createdAt: m.created_at,
    })),
  };
}

export async function handleSupport(req, res, pathname, session) {
  const ip = clientIp(req);

  /* ------------------------------------------------- raise a new thread */

  if (pathname === '/api/support/threads' && req.method === 'POST') {
    const limit = rateLimit(`support:${ip}`, { windowMs: 60 * 60 * 1000, max: 10 });
    if (!limit.ok) return fail(res, 429, 'Too many messages. Please try again later.');

    const body = await readJson(req);
    const email = clean(body.email ?? session?.user?.email, 160).toLowerCase();
    const message = clean(body.message, 4000);
    const subject = clean(body.subject, 160) || 'Product question';

    if (!EMAIL_RE.test(email)) return fail(res, 400, 'Enter a valid email address.');
    if (message.length < 5) return fail(res, 400, 'Please describe your question.');

    const thread = {
      id: randomUUID(),
      user_id: session?.user?.id ?? null,
      email,
      name: clean(body.name ?? session?.user?.name, 80),
      subject,
      kind: KINDS.includes(body.kind) ? body.kind : 'query',
      product_id: clean(body.productId, 60) || null,
      order_id: clean(body.orderId, 40) || null,
      status: 'open',
      priority: 'normal',
      created_at: now(),
      updated_at: now(),
    };

    db.prepare(
      `INSERT INTO support_threads
         (id, user_id, email, name, subject, kind, product_id, order_id, status, priority, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      thread.id, thread.user_id, thread.email, thread.name, thread.subject, thread.kind,
      thread.product_id, thread.order_id, thread.status, thread.priority,
      thread.created_at, thread.updated_at,
    );

    db.prepare(
      'INSERT INTO support_messages (id, thread_id, author_role, author_name, body, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(randomUUID(), thread.id, 'customer', thread.name || email, message, now());

    audit('support.thread_created', { actor: email, ip, detail: { id: thread.id } });

    return send(res, 201, { thread: threadWithMessages(thread) });
  }

  /* ------------------------------------------- customer: read own thread */

  const threadParams = match('/api/support/threads/:id', pathname);

  if (threadParams && req.method === 'GET') {
    const row = db.prepare('SELECT * FROM support_threads WHERE id = ?').get(threadParams.id);
    if (!row) return fail(res, 404, 'Conversation not found.');

    const email = String(req.headers['x-support-email'] ?? '').toLowerCase();
    const isStaff = session && ['admin', 'support'].includes(session.user.role);
    const isOwner =
      (session && row.user_id === session.user.id) ||
      (session && session.user.email === row.email) ||
      (email && email === row.email);

    if (!isStaff && !isOwner) return fail(res, 403, 'You cannot view this conversation.');
    return send(res, 200, { thread: threadWithMessages(row) });
  }

  /* ------------------------------------------------------- post a reply */

  const replyParams = match('/api/support/threads/:id/messages', pathname);
  if (replyParams && req.method === 'POST') {
    const row = db.prepare('SELECT * FROM support_threads WHERE id = ?').get(replyParams.id);
    if (!row) return fail(res, 404, 'Conversation not found.');

    const body = await readJson(req);
    const message = clean(body.message, 4000);
    if (message.length < 2) return fail(res, 400, 'Write a message first.');

    const isStaff = session && ['admin', 'support'].includes(session.user.role);
    const email = String(body.email ?? session?.user?.email ?? '').toLowerCase();
    const isOwner = (session && row.user_id === session.user.id) || email === row.email;

    if (!isStaff && !isOwner) return fail(res, 403, 'You cannot reply to this conversation.');

    db.prepare(
      'INSERT INTO support_messages (id, thread_id, author_role, author_name, body, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(
      randomUUID(),
      row.id,
      isStaff ? 'agent' : 'customer',
      isStaff ? session.user.name || 'Support' : row.name || row.email,
      message,
      now(),
    );

    db.prepare('UPDATE support_threads SET updated_at = ?, status = ? WHERE id = ?').run(
      now(),
      isStaff ? 'pending' : 'open',
      row.id,
    );

    return send(res, 201, { thread: threadWithMessages(row) });
  }

  /* -------------------------------------------- staff: list and triage */

  if (pathname === '/api/support/queue' && req.method === 'GET') {
    const gate = requireRole(session, ['admin', 'support']);
    if (!gate.ok) return fail(res, gate.status, gate.error);

    const url = new URL(req.url, 'http://localhost');
    const status = url.searchParams.get('status');
    const search = (url.searchParams.get('q') ?? '').toLowerCase();

    let rows = db.prepare('SELECT * FROM support_threads ORDER BY updated_at DESC').all();
    if (status && STATUSES.includes(status)) rows = rows.filter((r) => r.status === status);
    if (search) {
      rows = rows.filter((r) =>
        `${r.subject} ${r.email} ${r.name}`.toLowerCase().includes(search),
      );
    }

    const counts = STATUSES.reduce((acc, value) => {
      acc[value] = db
        .prepare('SELECT COUNT(*) AS n FROM support_threads WHERE status = ?')
        .get(value).n;
      return acc;
    }, {});

    return send(res, 200, { threads: rows.map(threadWithMessages), counts });
  }

  const updateParams = match('/api/support/threads/:id', pathname);
  if (updateParams && req.method === 'PATCH') {
    const gate = requireRole(session, ['admin', 'support']);
    if (!gate.ok) return fail(res, gate.status, gate.error);

    const row = db.prepare('SELECT * FROM support_threads WHERE id = ?').get(updateParams.id);
    if (!row) return fail(res, 404, 'Conversation not found.');

    const body = await readJson(req);
    const status = STATUSES.includes(body.status) ? body.status : row.status;
    const priority = PRIORITIES.includes(body.priority) ? body.priority : row.priority;

    db.prepare('UPDATE support_threads SET status = ?, priority = ?, updated_at = ? WHERE id = ?').run(
      status,
      priority,
      now(),
      row.id,
    );

    audit('support.thread_updated', {
      actor: session.user.email,
      ip,
      detail: { id: row.id, status, priority },
    });

    const updated = db.prepare('SELECT * FROM support_threads WHERE id = ?').get(row.id);
    return send(res, 200, { thread: threadWithMessages(updated) });
  }

  return null;
}
