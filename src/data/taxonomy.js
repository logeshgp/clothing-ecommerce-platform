/** Shared vocabulary for navigation, filters, admin forms and badges. */

export const CATEGORIES = [
  { slug: 'pants', name: 'Pants', blurb: 'Everyday pants made for comfortable movement.' },
  { slug: 'trousers', name: 'Trousers', blurb: 'Cut once, worn a thousand times.' },
  { slug: 'track-pants', name: 'Track pants', blurb: 'Built to move, comfortable enough to stay in.' },
  { slug: 'three-fourth', name: '3/4 pants', blurb: 'Half-length, all-day. Made for warm months.' },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

/** Pseudo-category used by navigation and filters to surface newly tagged items. */
export const NEW_CATEGORY = { slug: 'new', name: 'New arrivals', blurb: 'The latest drops, fresh off the table.' };

export const GENDERS = [
  { slug: 'men', name: 'Men' },
  { slug: 'women', name: 'Women' },
  { slug: 'unisex', name: 'Unisex' },
];

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const FITS = [
  { slug: 'slim', name: 'Slim' },
  { slug: 'regular', name: 'Regular' },
  { slug: 'relaxed', name: 'Relaxed' },
  { slug: 'oversized', name: 'Oversized' },
];

export const FABRICS = [
  'Combed cotton',
  'Organic cotton',
  'Cotton terry',
  'Brushed fleece',
  'Stretch twill',
  'Linen blend',
  'Tencel™ lyocell',
  'Performance mesh',
  'Poly-cotton knit',
];

export const COLOR_SWATCHES = {
  Oat: '#e3d9c6',
  Bone: '#f0ece2',
  Ivory: '#faf8f4',
  Ecru: '#efe7d6',
  Sand: '#d8c7a9',
  Stone: '#b8b2a6',
  Clay: '#c47f5a',
  Rust: '#a9643f',
  Cocoa: '#6b4f3a',
  Olive: '#6b7254',
  Moss: '#5c6b52',
  Sage: '#9aa88e',
  Slate: '#6b7280',
  Indigo: '#39455e',
  Navy: '#2b3650',
  Charcoal: '#3a3730',
  Ink: '#1a1a18',
  Plum: '#8c3f52',
  Maroon: '#6d2f3c',
};

export const COLOR_NAMES = Object.keys(COLOR_SWATCHES);

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'New arrivals' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

/** Price slider bounds, in rupees. */
export const PRICE_BOUNDS = { min: 499, max: 3999, step: 100 };

export const TAGS = ['new', 'sale', 'last-chance'];

export const BADGE_STYLES = {
  new: { label: 'New', className: 'bg-ink-900 text-sand-100' },
  sale: { label: 'On sale', className: 'bg-berry-500 text-white' },
  'last-chance': { label: 'Last chance', className: 'bg-moss-500 text-white' },
};

/** Garment measurements in inches, measured flat. Shown in the size guide. */
export const MEASUREMENTS = {
  XS: { chest: 36, waist: 28, hip: 36, length: 26, inseam: 27 },
  S: { chest: 38, waist: 30, hip: 38, length: 27, inseam: 28 },
  M: { chest: 40, waist: 32, hip: 40, length: 28, inseam: 29 },
  L: { chest: 42, waist: 34, hip: 42, length: 29, inseam: 30 },
  XL: { chest: 44, waist: 36, hip: 44, length: 30, inseam: 31 },
  XXL: { chest: 46, waist: 38, hip: 46, length: 31, inseam: 31.5 },
};

/** Which measurement columns make sense for a given category. */
export const MEASUREMENT_COLUMNS = {
  pants: [
    { key: 'waist', label: 'Waist' },
    { key: 'hip', label: 'Hip' },
    { key: 'inseam', label: 'Inseam' },
  ],
  trousers: [
    { key: 'waist', label: 'Waist' },
    { key: 'hip', label: 'Hip' },
    { key: 'inseam', label: 'Inseam' },
  ],
  'track-pants': [
    { key: 'waist', label: 'Waist' },
    { key: 'hip', label: 'Hip' },
    { key: 'inseam', label: 'Inseam' },
  ],
  'three-fourth': [
    { key: 'waist', label: 'Waist' },
    { key: 'hip', label: 'Hip' },
    { key: 'length', label: 'Length' },
  ],
};
