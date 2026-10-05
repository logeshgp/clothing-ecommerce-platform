/** Curated edits surfaced on the home page and the /collections route. */

export const COLLECTIONS = [
  {
    slug: 'the-everyday-edit',
    title: 'The Everyday Edit',
    issue: '026',
    tagline: 'Wear your own rhythm.',
    description:
      'The pieces we reach for without thinking — easy forms, considered details, made for wherever the day goes.',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=75',
    productIds: ['p-001', 'p-002', 'p-008', 'p-014', 'p-020'],
  },
  {
    slug: 'move-well',
    title: 'Move Well',
    issue: '027',
    tagline: 'Built to move with you.',
    description:
      'Track pants, training three-quarters and activewear made for days on the move.',
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1400&q=75',
    productIds: ['p-017', 'p-021', 'p-005', 'p-016', 'p-015'],
  },
  {
    slug: 'warm-month-staples',
    title: 'Warm Month Staples',
    issue: '025',
    tagline: 'Comfort for warmer days.',
    description:
      'Easy-to-wear styles for warmer weather and everyday plans.',
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1400&q=75',
    productIds: ['p-012', 'p-019', 'p-022', 'p-006', 'p-004'],
  },
  {
    slug: 'soft-structure',
    title: 'Soft Structure',
    issue: '024',
    tagline: 'Comfort for every day.',
    description: 'Everyday styles in comfortable fits.',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1400&q=75',
    productIds: ['p-009', 'p-018', 'p-003', 'p-011', 'p-013'],
  },
];

export const COLLECTIONS_BY_SLUG = Object.fromEntries(COLLECTIONS.map((c) => [c.slug, c]));

/** Short brand values rendered in the scrolling strip on the home page. */
export const BRAND_VALUES = [
  'Pants and trousers.',
  'Everyday styles.',
  'Find your fit.',
  'Track pants and three-quarter pants.',
  'Wholesale enquiries welcome.',
];

export const STORY_BLOCKS = [
  {
    title: 'Everyday styles',
    body: 'Browse pants, trousers, three-quarter pants and track pants in the collection.',
  },
  {
    title: 'Product details',
    body: 'View available sizes, colours, prices and product details before sending an enquiry.',
  },
  {
    title: 'Made for everyday',
    body: 'Explore pants, trousers, three-quarter styles and track pants for your daily rotation.',
  },
];
