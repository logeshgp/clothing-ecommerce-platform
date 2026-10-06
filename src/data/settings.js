/**
 * Store-wide settings seeded on first load and editable from the admin console.
 * Every monetary value is in rupees (INR).
 */

export const SEED_ANNOUNCEMENTS = [
  { id: 'a-1', text: 'Everyday pants, trousers and track pants — made for movement.', active: true },
  { id: 'a-2', text: 'Wholesale orders welcome — message us for bulk pricing.', active: true },
];

export const SEED_SETTINGS = {
  storeName: 'DND Apparel',
  tagline: 'Everyday pants, made to move with you.',
  supportEmail: '',
  sellerLegalName: '',
  businessAddress: '',
  gstin: '',
  grievanceOfficer: '',
  grievanceEmail: '',
  grievancePhone: '',

  currency: 'INR',
  taxRate: 0.05, // 5% GST on apparel
  freeShippingThreshold: 1999,

  festiveOffer: {
    active: false,
    label: '',
    percent: 0,
    note: '',
  },

  bulkDiscount: {
    active: true,
    minQuantity: 10,
    percent: 10,
    label: 'Wholesale pricing',
  },

  whatsapp: {
    enabled: true,
    contacts: [
      { id: 'owner', label: 'Store owner', number: '93613321260', enabled: true },
    ],
  },

  shippingMethods: [
    { id: 'standard', label: 'Standard', detail: '4–6 business days', price: 79, freeOverThreshold: true },
    { id: 'express', label: 'Express', detail: '2–3 business days', price: 149, freeOverThreshold: false },
    { id: 'overnight', label: 'Overnight', detail: 'Next business day', price: 299, freeOverThreshold: false },
  ],

  hero: {
    eyebrow: 'Everyday clothing · Wholesale available',
    titleLine1: 'Find your',
    titleLine2: 'everyday fit.',
    bodyLine1: 'Pants, trousers and track pants.',
    bodyLine2: 'Comfort for wherever the day goes.',
    caption: 'Shop direct. Ask us on WhatsApp.',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=75',
    ctaLabel: 'Shop the collection',
    ctaTo: '/shop',
  },

  banner: {
    enabled: false,
    title: '',
    body: '',
    ctaLabel: 'Shop now',
    ctaTo: '/shop',
    image: '',
  },
};
