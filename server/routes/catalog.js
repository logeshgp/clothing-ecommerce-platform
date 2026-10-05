import { db, getSetting } from '../db.js';
import { send, match } from '../http.js';
import { COUNTRIES } from '../../shared/geo.js';

/**
 * Public, read-only endpoints consumed by the storefront.
 * Nothing here requires a session.
 */

export function loadCategories({ activeOnly = true } = {}) {
  const rows = db
    .prepare(
      `SELECT slug, name, blurb, position, active FROM categories
       ${activeOnly ? 'WHERE active = 1' : ''}
       ORDER BY position, name`,
    )
    .all();
  return rows.map((row) => ({ ...row, active: Boolean(row.active) }));
}

export function loadProducts() {
  return db
    .prepare('SELECT data FROM products ORDER BY updated_at DESC')
    .all()
    .map((row) => JSON.parse(row.data));
}

export function loadProduct(idOrSlug) {
  const row = db
    .prepare('SELECT data FROM products WHERE id = ? OR slug = ?')
    .get(idOrSlug, idOrSlug);
  return row ? JSON.parse(row.data) : null;
}

/** Everything the storefront needs to render, in a single request. */
export function storefrontPayload() {
  const settings = getSetting('store', {});
  const { whatsapp, ...publicSettings } = settings;
  const categories = loadCategories();

  return {
    settings: {
      ...publicSettings,
      // Only the owner-designated public contact numbers are exposed to shoppers.
      whatsapp: {
        enabled: Boolean(whatsapp?.enabled),
        contacts: (Array.isArray(whatsapp?.contacts) ? whatsapp.contacts : [])
          .filter((contact) => contact.enabled !== false)
          .map(({ id, label, number }) => ({ id, label, number, enabled: true })),
      },
    },
    categories,
    products: loadProducts().filter((product) =>
      categories.some((category) => category.slug === product.category),
    ),
    promos: (getSetting('promos', []) ?? []).filter((p) => p.active !== false),
    announcements: (getSetting('announcements', []) ?? []).filter((a) => a.active),
    countries: COUNTRIES,
  };
}

export async function handleCatalog(req, res, pathname) {
  if (req.method !== 'GET') return null;

  if (pathname === '/api/storefront') {
    return send(res, 200, storefrontPayload());
  }

  if (pathname === '/api/products') {
    return send(res, 200, { products: loadProducts() });
  }

  const productParams = match('/api/products/:slug', pathname);
  if (productParams) {
    const product = loadProduct(productParams.slug);
    if (!product) return send(res, 404, { error: 'Product not found.' });
    return send(res, 200, { product });
  }

  if (pathname === '/api/categories') {
    return send(res, 200, { categories: loadCategories() });
  }

  if (pathname === '/api/geo/countries') {
    return send(res, 200, { countries: COUNTRIES });
  }

  if (pathname === '/api/health') {
    return send(res, 200, { ok: true, time: new Date().toISOString() });
  }

  return null;
}
