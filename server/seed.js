import { randomUUID } from 'node:crypto';
import { db, now, getSetting, setSetting } from './db.js';
import { config } from './config.js';
import { hashPassword, roleForEmail } from './security.js';
import { SEED_PRODUCTS } from '../src/data/products.js';
import { CATEGORIES } from '../src/data/taxonomy.js';
import { SEED_PROMOS } from '../src/data/promoCodes.js';
import { SEED_ANNOUNCEMENTS, SEED_SETTINGS } from '../src/data/settings.js';

/**
 * First-run bootstrap: categories, products, promos, settings and the
 * allowlisted admin/support accounts. Safe to call on every boot — existing
 * rows are left untouched.
 */
export function seedDatabase() {
  seedCategories();
  seedProducts();
  migrateLegacyPantsCatalog();
  seedSettings();
  seedStaffAccounts();
}

function seedCategories() {
  const insert = db.prepare(
    `INSERT INTO categories (slug, name, blurb, position, active) VALUES (?, ?, ?, ?, 1)
     ON CONFLICT(slug) DO UPDATE SET name = excluded.name, blurb = excluded.blurb,
                                     position = excluded.position, active = 1`,
  );
  CATEGORIES.forEach((category, index) => {
    insert.run(category.slug, category.name, category.blurb, index);
  });
  db.prepare("UPDATE categories SET active = 0 WHERE slug = 'tshirt'").run();
  console.log(`[seed] ${CATEGORIES.length} categories`);
}

function seedProducts() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  if (count > 0) return;

  const insert = db.prepare(
    'INSERT INTO products (id, slug, category, price, data, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  );

  SEED_PRODUCTS.forEach((product) => {
    // Per-product copy blocks are editable from the admin console.
    const withCopy = {
      ...product,
      copy: {
        detailsHeading: 'Details & fit',
        fabricHeading: `Fabric — ${product.fabric}`,
        careHeading: 'Care',
        shippingHeading: 'Ordering & delivery',
        shippingBody:
          'Send a purchase enquiry on WhatsApp. The seller will confirm availability, applicable taxes, delivery charges and the final quote before accepting the order.',
        fabricBody: `${product.fabric}. Contact the seller for additional material details.`,
        sizeGuideNote: 'All measurements are taken flat, in inches, and may vary by up to ½".',
        addToBagLabel: 'Add to bag',
        soldOutLabel: 'Sold out',
        relatedHeading: 'Complete the look',
        relatedSubheading: 'Pieces that work with this one.',
        askQuestionLabel: 'Ask about this product',
      },
    };

    insert.run(
      product.id,
      product.slug,
      product.category,
      product.price,
      JSON.stringify(withCopy),
      now(),
    );
  });

  console.log(`[seed] ${SEED_PRODUCTS.length} products`);
}

function migrateLegacyPantsCatalog() {
  const previousNames = new Set([
    'Everyday Heavy Tee',
    'Core Crew Tee',
    'Oversized Drop-Shoulder Tee',
    'Pocket Slub Tee',
    'Performance Active Tee',
    'Relaxed Scoop Tee',
    'Striped Sailor Tee',
  ]);
  const update = db.prepare(
    'UPDATE products SET slug = ?, category = ?, price = ?, data = ?, updated_at = ? WHERE id = ?',
  );

  SEED_PRODUCTS.filter((product) => product.id >= 'p-001' && product.id <= 'p-007').forEach(
    (product) => {
      const row = db.prepare('SELECT data FROM products WHERE id = ?').get(product.id);
      if (!row) return;
      const existing = JSON.parse(row.data);
      if (existing.category !== 'tshirt' || !previousNames.has(existing.name)) return;
      const migrated = {
        ...product,
        copy: {
          ...existing.copy,
          shippingHeading: 'Ordering & delivery',
          shippingBody:
            'Send a purchase enquiry on WhatsApp. The seller will confirm availability, applicable taxes, delivery charges and the final quote before accepting the order.',
        },
      };
      update.run(
        migrated.slug,
        migrated.category,
        migrated.price,
        JSON.stringify(migrated),
        now(),
        migrated.id,
      );
    },
  );
}

function seedSettings() {
  if (!getSetting('store')) {
    setSetting('store', {
      ...SEED_SETTINGS,
      whatsapp: { enabled: false, contacts: [] },
      bulkDiscount: { active: true, minQuantity: 10, percent: 10, label: 'Wholesale pricing' },
      // Editable copy that appears on every product page.
      productCopy: {
        shippingNote: 'Delivery charges and applicable taxes are confirmed by the seller.',
        lowStockTemplate: 'Only {count} left in {size} / {color}.',
        soldOutColorTemplate: '{color} is sold out in every size. Try another colour.',
        chooseSizeError: 'Choose a size first.',
      },
      banner: {
        enabled: false,
        title: '',
        body: '',
        ctaLabel: 'Shop now',
        ctaTo: '/shop',
        image: '',
        dismissible: true,
        showOncePerSession: true,
        delayMs: 1200,
        theme: 'dark',
      },
      support: {
        enabled: true,
        heading: 'Questions about this piece?',
        body: 'Our team usually replies within a few hours.',
        buttonLabel: 'Ask a question',
      },
    });
  }

  if (!getSetting('promos')) setSetting('promos', SEED_PROMOS);
  if (!getSetting('announcements')) setSetting('announcements', SEED_ANNOUNCEMENTS);
}

/**
 * Creates accounts for every allowlisted address so the consoles are reachable
 * on first boot. Passwords must be changed immediately in production.
 */
function seedStaffAccounts() {
  const emails = [...config.access.adminEmails, ...config.access.supportEmails];
  const insert = db.prepare(
    `INSERT INTO users (id, email, name, phone, password_hash, password_salt, role, provider, created_at)
     VALUES (?, ?, ?, '', ?, ?, ?, 'password', ?)`,
  );

  emails.forEach((email) => {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    const role = roleForEmail(email);

    if (existing) {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, existing.id);
      return;
    }

    const { hash, salt } = hashPassword(config.access.bootstrapPassword);
    insert.run(randomUUID(), email, email.split('@')[0], hash, salt, role, now());
    console.log(`[seed] ${role} account: ${email}`);
  });
}
