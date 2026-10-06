// Explicit extensions keep these modules loadable by both Vite and plain Node
// (the API server seeds its database from this file).
import { MEASUREMENTS, SIZES } from './taxonomy.js';
import { seededRandom } from '../utils/format.js';

/**
 * Seed catalog — four trouser and pants categories, priced in rupees.
 *
 * Products are stored in a flat, admin-editable shape: colours carry their own
 * image URL and stock is a plain `"Colour::Size" -> number` map, so every field
 * can be edited from the admin console without derived data going stale.
 */

const UNSPLASH = (id, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=72`;

const CARE_BY_FABRIC = {
  'Combed cotton': ['Machine wash cold with like colours', 'Tumble dry low', 'Warm iron if needed'],
  'Organic cotton': ['Machine wash cold', 'Line dry in shade', 'Do not bleach'],
  'Cotton terry': ['Machine wash cold inside out', 'Tumble dry low', 'Avoid high heat'],
  'Brushed fleece': ['Machine wash cold inside out', 'Tumble dry low', 'Do not iron print'],
  'Stretch twill': ['Machine wash cold, gentle cycle', 'Hang dry', 'Cool iron on reverse'],
  'Linen blend': ['Machine wash cold, gentle cycle', 'Line dry to limit creasing', 'Iron while damp'],
  'Tencel™ lyocell': ['Machine wash cold, gentle cycle', 'Hang dry', 'Cool iron on reverse'],
  'Performance mesh': ['Machine wash cold', 'Do not use fabric softener', 'Hang dry'],
  'Poly-cotton knit': ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
};

/** Deterministic stock so "only 2 left" warnings stay stable between reloads. */
function seedStock(productId, colors, sizes) {
  const stock = {};
  colors.forEach((color, ci) => {
    sizes.forEach((size, si) => {
      const roll = seededRandom(`${productId}-${color.name}-${size}`);
      if (roll < 0.06) stock[`${color.name}::${size}`] = 0;
      else if (roll < 0.18) stock[`${color.name}::${size}`] = 1 + (Math.floor(roll * 10) % 3);
      else stock[`${color.name}::${size}`] = 6 + Math.floor(roll * 40) + ci + si;
    });
  });
  return stock;
}

const RAW = [
  // --------------------------------------------------------------------- Pants
  {
    id: 'p-001',
    name: 'Everyday Cotton Chino',
    category: 'pants',
    gender: 'unisex',
    price: 1299,
    compareAt: 1699,
    fit: 'relaxed',
    fabric: 'Combed cotton',
    tags: ['sale'],
    blurb: 'A dependable straight-leg cotton chino with a comfortable mid rise.',
    released: '2026-07-02',
    sold: 3180,
    rating: 4.7,
    reviews: 512,
    colors: [
      { name: 'Bone', image: UNSPLASH('photo-1473966968600-fa801b869a1a') },
      { name: 'Ink', image: UNSPLASH('photo-1542272604-787c3835535d') },
      { name: 'Olive', image: UNSPLASH('photo-1604176354204-9268737828e4') },
    ],
  },
  {
    id: 'p-002',
    name: 'Core Everyday Pant',
    category: 'pants',
    gender: 'men',
    price: 999,
    fit: 'regular',
    fabric: 'Organic cotton',
    tags: [],
    blurb: 'An easy daily-wear pant with a clean profile and practical pockets.',
    released: '2026-06-18',
    sold: 4120,
    rating: 4.6,
    reviews: 684,
    colors: [
      { name: 'Ivory', image: UNSPLASH('photo-1594633312681-425c7b97ccd1') },
      { name: 'Navy', image: UNSPLASH('photo-1506629082955-511b1aa562c8') },
      { name: 'Charcoal', image: UNSPLASH('photo-1593030103066-0093718efeb9') },
    ],
  },
  {
    id: 'p-003',
    name: 'Relaxed Drawstring Pant',
    category: 'pants',
    gender: 'unisex',
    price: 1499,
    fit: 'relaxed',
    fabric: 'Combed cotton',
    tags: ['new'],
    blurb: 'A relaxed drawstring waist and an easy tapered leg for off-duty days.',
    released: '2026-09-21',
    sold: 860,
    rating: 4.8,
    reviews: 134,
    colors: [
      { name: 'Sand', image: UNSPLASH('photo-1624378439575-d8705ad7ae80') },
      { name: 'Moss', image: UNSPLASH('photo-1552902865-b72c031ac5ea') },
      { name: 'Ink', image: UNSPLASH('photo-1602293589930-45aad59ba3ab') },
    ],
  },
  {
    id: 'p-004',
    name: 'Utility Cargo Pant',
    category: 'pants',
    gender: 'unisex',
    price: 1199,
    fit: 'regular',
    fabric: 'Organic cotton',
    tags: [],
    blurb: 'A durable cotton cargo with low-profile pockets and a roomy fit.',
    released: '2026-05-30',
    sold: 1540,
    rating: 4.5,
    reviews: 221,
    colors: [
      { name: 'Oat', image: UNSPLASH('photo-1517445312882-bc9910d016b7') },
      { name: 'Rust', image: UNSPLASH('photo-1552902865-b72c031ac5ea') },
      { name: 'Slate', image: UNSPLASH('photo-1551803091-e20673f15770') },
    ],
  },
  {
    id: 'p-005',
    name: 'Active Stretch Pant',
    category: 'pants',
    gender: 'men',
    price: 1599,
    compareAt: 1999,
    fit: 'slim',
    fabric: 'Performance mesh',
    tags: ['sale'],
    blurb: 'Light stretch fabric and a flexible waist made for active days.',
    released: '2026-08-14',
    sold: 1180,
    rating: 4.6,
    reviews: 173,
    colors: [
      { name: 'Ink', image: UNSPLASH('photo-1538805060514-97d9cc17730c') },
      { name: 'Indigo', image: UNSPLASH('photo-1483721310020-03333e577078') },
    ],
  },
  {
    id: 'p-006',
    name: 'Linen Drawstring Pant',
    category: 'pants',
    gender: 'women',
    price: 1099,
    fit: 'relaxed',
    fabric: 'Tencel™ lyocell',
    tags: ['new'],
    blurb: 'A breathable linen blend with a drawcord waist for warm weather.',
    released: '2026-09-12',
    sold: 740,
    rating: 4.5,
    reviews: 96,
    colors: [
      { name: 'Ecru', image: UNSPLASH('photo-1602810318383-e386cc2a3ccf') },
      { name: 'Plum', image: UNSPLASH('photo-1591195853828-11db59a44f6b') },
      { name: 'Sage', image: UNSPLASH('photo-1565084888279-aca607ecce0c') },
    ],
  },
  {
    id: 'p-007',
    name: 'Classic Straight Pant',
    category: 'pants',
    gender: 'unisex',
    price: 1399,
    fit: 'regular',
    fabric: 'Combed cotton',
    tags: ['last-chance'],
    blurb: 'A classic straight fit that pairs easily with everyday essentials.',
    released: '2026-03-28',
    sold: 980,
    rating: 4.4,
    reviews: 142,
    colors: [
      { name: 'Bone', image: UNSPLASH('photo-1541099649105-f69ad21f3246') },
      { name: 'Navy', image: UNSPLASH('photo-1542272604-787c3835535d') },
    ],
  },

  // ----------------------------------------------------------------- Trousers
  {
    id: 'p-008',
    name: 'Studio Straight Trouser',
    category: 'trousers',
    gender: 'unisex',
    price: 2499,
    fit: 'regular',
    fabric: 'Stretch twill',
    tags: [],
    blurb: 'A clean straight leg with a mid rise and just enough stretch.',
    released: '2026-04-11',
    sold: 2240,
    rating: 4.8,
    reviews: 389,
    colors: [
      { name: 'Charcoal', image: UNSPLASH('photo-1473966968600-fa801b869a1a') },
      { name: 'Sand', image: UNSPLASH('photo-1624378439575-d8705ad7ae80') },
      { name: 'Ink', image: UNSPLASH('photo-1542272604-787c3835535d') },
    ],
  },
  {
    id: 'p-009',
    name: 'Drift Wide-Leg Trouser',
    category: 'trousers',
    gender: 'women',
    price: 2799,
    compareAt: 3299,
    fit: 'relaxed',
    fabric: 'Tencel™ lyocell',
    tags: ['new', 'sale'],
    blurb: 'A fluid wide leg that reads tailored but moves like pyjamas.',
    released: '2026-09-28',
    sold: 870,
    rating: 4.6,
    reviews: 141,
    colors: [
      { name: 'Bone', image: UNSPLASH('photo-1594633312681-425c7b97ccd1') },
      { name: 'Slate', image: UNSPLASH('photo-1583496661160-fb5886a13d74') },
      { name: 'Cocoa', image: UNSPLASH('photo-1551803091-e20673f15770') },
    ],
  },
  {
    id: 'p-010',
    name: 'Grove Cargo Trouser',
    category: 'trousers',
    gender: 'men',
    price: 2699,
    fit: 'relaxed',
    fabric: 'Organic cotton',
    tags: ['new'],
    blurb: 'A modern cargo with flat bellows pockets and a tapered leg.',
    released: '2026-09-08',
    sold: 580,
    rating: 4.5,
    reviews: 84,
    colors: [
      { name: 'Moss', image: UNSPLASH('photo-1517445312882-bc9910d016b7') },
      { name: 'Sand', image: UNSPLASH('photo-1604176354204-9268737828e4') },
      { name: 'Ink', image: UNSPLASH('photo-1552902865-b72c031ac5ea') },
    ],
  },
  {
    id: 'p-011',
    name: 'Alder Corduroy Trouser',
    category: 'trousers',
    gender: 'unisex',
    price: 2899,
    fit: 'regular',
    fabric: 'Organic cotton',
    tags: [],
    blurb: '8-wale corduroy with a straight leg and a slightly elevated rise.',
    released: '2026-08-18',
    sold: 730,
    rating: 4.6,
    reviews: 109,
    colors: [
      { name: 'Cocoa', image: UNSPLASH('photo-1624222247344-550fb60583dc') },
      { name: 'Olive', image: UNSPLASH('photo-1541099649105-f69ad21f3246') },
    ],
  },
  {
    id: 'p-012',
    name: 'Linen Easy Trouser',
    category: 'trousers',
    gender: 'unisex',
    price: 2299,
    fit: 'relaxed',
    fabric: 'Linen blend',
    tags: [],
    blurb: 'Breathable linen blend with a drawcord waist for warm months.',
    released: '2026-05-18',
    sold: 1180,
    rating: 4.4,
    reviews: 204,
    colors: [
      { name: 'Ivory', image: UNSPLASH('photo-1602810318383-e386cc2a3ccf') },
      { name: 'Clay', image: UNSPLASH('photo-1591195853828-11db59a44f6b') },
      { name: 'Indigo', image: UNSPLASH('photo-1506629082955-511b1aa562c8') },
    ],
  },
  {
    id: 'p-013',
    name: 'Tapered Work Trouser',
    category: 'trousers',
    gender: 'men',
    price: 2599,
    fit: 'slim',
    fabric: 'Stretch twill',
    tags: [],
    blurb: 'A desk-to-dinner trouser with a clean taper and hidden stretch.',
    released: '2026-06-24',
    sold: 1620,
    rating: 4.7,
    reviews: 267,
    colors: [
      { name: 'Navy', image: UNSPLASH('photo-1507003211169-0a1dd7228f2d') },
      { name: 'Charcoal', image: UNSPLASH('photo-1593030103066-0093718efeb9') },
    ],
  },

  // -------------------------------------------------------------- Track pants
  {
    id: 'p-014',
    name: 'Loop Terry Track Pant',
    category: 'track-pants',
    gender: 'unisex',
    price: 1899,
    fit: 'relaxed',
    fabric: 'Cotton terry',
    tags: [],
    blurb: 'A tapered terry track pant with a ribbed waist that stays put.',
    released: '2026-07-16',
    sold: 1760,
    rating: 4.7,
    reviews: 268,
    colors: [
      { name: 'Oat', image: UNSPLASH('photo-1552902865-b72c031ac5ea') },
      { name: 'Charcoal', image: UNSPLASH('photo-1515886657613-9f3515b0c78f') },
      { name: 'Sage', image: UNSPLASH('photo-1562183241-b937e95585b6') },
    ],
  },
  {
    id: 'p-015',
    name: 'Ember Fleece Jogger',
    category: 'track-pants',
    gender: 'unisex',
    price: 2099,
    compareAt: 2599,
    fit: 'regular',
    fabric: 'Brushed fleece',
    tags: ['sale'],
    blurb: 'Heavyweight loopback, brushed inside, structured outside.',
    released: '2026-06-24',
    sold: 1980,
    rating: 4.8,
    reviews: 341,
    colors: [
      { name: 'Oat', image: UNSPLASH('photo-1556821840-3a63f95609a7') },
      { name: 'Ink', image: UNSPLASH('photo-1544441893-675973e31985') },
      { name: 'Rust', image: UNSPLASH('photo-1584865288642-42078afe6942') },
    ],
  },
  {
    id: 'p-016',
    name: 'Side-Stripe Track Pant',
    category: 'track-pants',
    gender: 'men',
    price: 1799,
    fit: 'slim',
    fabric: 'Poly-cotton knit',
    tags: ['new'],
    blurb: 'A retro side stripe with zip cuffs and a flat, non-bulky waist.',
    released: '2026-09-18',
    sold: 640,
    rating: 4.5,
    reviews: 88,
    colors: [
      { name: 'Navy', image: UNSPLASH('photo-1552374196-c4e7ffc6e126') },
      { name: 'Ink', image: UNSPLASH('photo-1591047139829-d91aecb6caea') },
    ],
  },
  {
    id: 'p-017',
    name: 'Active Training Pant',
    category: 'track-pants',
    gender: 'unisex',
    price: 2199,
    fit: 'slim',
    fabric: 'Performance mesh',
    tags: [],
    blurb: 'Four-way stretch with zip pockets and reflective trims.',
    released: '2026-08-02',
    sold: 760,
    rating: 4.6,
    reviews: 132,
    colors: [
      { name: 'Ink', image: UNSPLASH('photo-1538805060514-97d9cc17730c') },
      { name: 'Slate', image: UNSPLASH('photo-1483721310020-03333e577078') },
      { name: 'Olive', image: UNSPLASH('photo-1565693413579-8a73ffa8de15') },
    ],
  },
  {
    id: 'p-018',
    name: 'Lounge Wide Track Pant',
    category: 'track-pants',
    gender: 'women',
    price: 1999,
    fit: 'oversized',
    fabric: 'Cotton terry',
    tags: ['new'],
    blurb: 'A wide, easy track pant with a high rise and deep pockets.',
    released: '2026-09-25',
    sold: 420,
    rating: 4.7,
    reviews: 61,
    colors: [
      { name: 'Stone', image: UNSPLASH('photo-1583744946564-b52ac1c389c8') },
      { name: 'Plum', image: UNSPLASH('photo-1572804013309-59a88b7e92f1') },
      { name: 'Moss', image: UNSPLASH('photo-1612336307429-8a898d10e223') },
    ],
  },

  // -------------------------------------------------------------- 3/4 pants
  {
    id: 'p-019',
    name: 'Basin Relaxed 3/4 Pant',
    category: 'three-fourth',
    gender: 'unisex',
    price: 1499,
    compareAt: 1899,
    fit: 'relaxed',
    fabric: 'Linen blend',
    tags: ['sale', 'last-chance'],
    blurb: 'A breathable linen-blend three-quarter with a drawcord waist.',
    released: '2026-04-02',
    sold: 1320,
    rating: 4.3,
    reviews: 167,
    colors: [
      { name: 'Ecru', image: UNSPLASH('photo-1591195853828-11db59a44f6b') },
      { name: 'Sage', image: UNSPLASH('photo-1565084888279-aca607ecce0c') },
      { name: 'Cocoa', image: UNSPLASH('photo-1560243563-062bfc001d68') },
    ],
  },
  {
    id: 'p-020',
    name: 'Terry Capri Jogger',
    category: 'three-fourth',
    gender: 'unisex',
    price: 1599,
    fit: 'regular',
    fabric: 'Cotton terry',
    tags: [],
    blurb: 'Cropped terry jogger with ribbed hems that sit above the calf.',
    released: '2026-07-10',
    sold: 1450,
    rating: 4.6,
    reviews: 213,
    colors: [
      { name: 'Oat', image: UNSPLASH('photo-1552902865-b72c031ac5ea') },
      { name: 'Charcoal', image: UNSPLASH('photo-1506629082955-511b1aa562c8') },
    ],
  },
  {
    id: 'p-021',
    name: 'Court Training 3/4',
    category: 'three-fourth',
    gender: 'men',
    price: 1699,
    fit: 'slim',
    fabric: 'Performance mesh',
    tags: ['new'],
    blurb: 'Quick-dry three-quarter with mesh vents behind the knee.',
    released: '2026-09-15',
    sold: 390,
    rating: 4.5,
    reviews: 54,
    colors: [
      { name: 'Ink', image: UNSPLASH('photo-1517466787929-bc90951d0974') },
      { name: 'Indigo', image: UNSPLASH('photo-1483721310020-03333e577078') },
    ],
  },
  {
    id: 'p-022',
    name: 'Easy Cotton 3/4 Pant',
    category: 'three-fourth',
    gender: 'women',
    price: 1399,
    fit: 'relaxed',
    fabric: 'Organic cotton',
    tags: [],
    blurb: 'A soft everyday three-quarter with an elasticated back waist.',
    released: '2026-06-08',
    sold: 880,
    rating: 4.4,
    reviews: 118,
    colors: [
      { name: 'Bone', image: UNSPLASH('photo-1583744946564-b52ac1c389c8') },
      { name: 'Clay', image: UNSPLASH('photo-1565084888279-aca607ecce0c') },
      { name: 'Slate', image: UNSPLASH('photo-1560243563-062bfc001d68') },
    ],
  },
];

/** Expands a seed entry into the full product shape used by the app. */
export function hydrateProduct(raw) {
  const sizes = raw.sizes?.length ? raw.sizes : SIZES;
  const colors = raw.colors;

  return {
    ...raw,
    sizes,
    colors,
    stock: raw.stock ?? seedStock(raw.id, colors, sizes),
    slug:
      raw.slug ??
      `${raw.id}-${raw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    care: raw.care ?? CARE_BY_FABRIC[raw.fabric] ?? CARE_BY_FABRIC['Organic cotton'],
    details: raw.details ?? [
      `${raw.fabric} — ${raw.fit} fit`,
      'Designed in-house, made in limited runs',
      'Check the size guide for garment measurements',
    ],
    measurements: Object.fromEntries(sizes.map((s) => [s, MEASUREMENTS[s]])),
    compareAt: Math.max(
      Number(raw.compareAt) || Math.ceil((Number(raw.price) * 1.2) / 100) * 100,
      Number(raw.price) + 1,
    ),
    tags: raw.tags ?? [],
  };
}

const INITIAL_PRODUCT_IDS = new Set(['p-001', 'p-008', 'p-014', 'p-019']);
export const SEED_PRODUCTS = RAW
  .filter((product) => INITIAL_PRODUCT_IDS.has(product.id))
  .map(hydrateProduct);

/* ------------------------------------------------------------------
   Helpers — pure, so they work against any product list (seed or admin-edited)
   ------------------------------------------------------------------ */

export function stockFor(product, color, size) {
  return product?.stock?.[`${color}::${size}`] ?? 0;
}

export function totalStock(product) {
  return Object.values(product?.stock ?? {}).reduce((sum, n) => sum + n, 0);
}

export function isInStock(product) {
  return totalStock(product) > 0;
}

export function sizesInStock(product, color) {
  return product.sizes.filter((size) => stockFor(product, color, size) > 0);
}

export function colorImage(product, color) {
  return (
    product.colors.find((c) => c.name === color)?.image ?? product.colors[0]?.image ?? ''
  );
}

export function primaryImage(product) {
  return product.colors[0]?.image ?? '';
}

export function colorNames(product) {
  return product.colors.map((c) => c.name);
}

/** "You might also like" — same category first, then same fabric. */
export function relatedProducts(product, allProducts, limit = 4) {
  if (!product) return [];
  const sameCategory = allProducts.filter(
    (p) => p.id !== product.id && p.category === product.category,
  );
  const sameFabric = allProducts.filter(
    (p) => p.id !== product.id && p.fabric === product.fabric && p.category !== product.category,
  );
  return [...sameCategory, ...sameFabric].slice(0, limit);
}
