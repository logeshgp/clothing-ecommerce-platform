import http from 'node:http';
import { config, assertProductionSafety } from './config.js';
import { pruneExpired } from './db.js';
import { seedDatabase } from './seed.js';
import { applyCors, fail, send } from './http.js';
import { readSession, verifyCsrf, applySecurityHeaders, clientIp, rateLimit } from './security.js';
import { readUpload } from './services/uploads.js';
import { handleAuth } from './routes/auth.js';
import { handleCatalog } from './routes/catalog.js';
import { handleOrders } from './routes/orders.js';
import { handleSupport } from './routes/support.js';
import { handleAdmin } from './routes/admin.js';

seedDatabase();
pruneExpired();
assertProductionSafety();

setInterval(pruneExpired, 60 * 60 * 1000).unref?.();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const pathname = url.pathname;
  const ip = clientIp(req);

  try {
    // ------------------------------------------------------------ CORS
    const originAllowed = applyCors(req, res);

    if (req.method === 'OPTIONS') {
      applySecurityHeaders(res);
      res.writeHead(204);
      return res.end();
    }

    if (!originAllowed) {
      return fail(res, 403, 'Origin not allowed.');
    }

    // --------------------------------------------- static: uploaded images
    if (pathname.startsWith('/uploads/')) {
      const file = readUpload(pathname.slice('/uploads/'.length));
      if (!file) {
        applySecurityHeaders(res);
        res.writeHead(404);
        return res.end();
      }
      applySecurityHeaders(res);
      res.writeHead(200, {
        'Content-Type': file.mime,
        'Content-Length': file.buffer.length,
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      return res.end(file.buffer);
    }

    if (!pathname.startsWith('/api/')) {
      return fail(res, 404, 'Not found.');
    }

    // --------------------------------------------------- blanket rate limit
    const limit = rateLimit(`global:${ip}`, config.rateLimits.public);
    if (!limit.ok) {
      return fail(res, 429, 'Too many requests.', { retryAfter: limit.retryAfter });
    }

    // ------------------------------------------------------------ session
    const session = readSession(req);

    // CSRF: state-changing requests from an authenticated browser must echo
    // the token. Unauthenticated POSTs (login, guest checkout) are covered by
    // origin checks and rate limits instead.
    if (!verifyCsrf(req, session)) {
      return fail(res, 403, 'Invalid or missing CSRF token.');
    }

    // ------------------------------------------------------------- routes
    const handled =
      (await handleAuth(req, res, pathname, session)) ??
      (await handleCatalog(req, res, pathname)) ??
      (await handleOrders(req, res, pathname, session)) ??
      (await handleSupport(req, res, pathname, session)) ??
      (await handleAdmin(req, res, pathname, session));

    if (handled === null || handled === undefined) {
      return fail(res, 404, 'Unknown endpoint.');
    }

    return handled;
  } catch (error) {
    console.error('[api] unhandled error:', error);
    const status = error.status ?? 500;
    // Internal messages are never leaked to the client.
    return fail(res, status, status === 500 ? 'Something went wrong.' : error.message);
  }
});

server.listen(config.port, '0.0.0.0', () => {
  console.log('');
  console.log(`  DND Store API   http://localhost:${config.port}`);
  console.log('  Payments        disabled (WhatsApp enquiries only)');
  console.log(`  WhatsApp        ${config.whatsapp.provider}`);
  console.log(`  Admin emails    ${config.access.adminEmails.join(', ')}`);
  console.log(`  Support emails  ${config.access.supportEmails.join(', ')}`);
  console.log('');
});
