import { SEED_PRODUCTS } from './products.js';
import { CATEGORIES } from './taxonomy.js';
import { SEED_PROMOS } from './promoCodes.js';
import { SEED_ANNOUNCEMENTS, SEED_SETTINGS } from './settings.js';
import { BRAND_VALUES, COLLECTIONS, STORY_BLOCKS } from './collections.js';

export const DEFAULT_VISIBILITY = {
  announcements: true,
  hero: true,
  brandValues: true,
  categories: true,
  featured: true,
  editorial: true,
  newArrivals: true,
  promotionalBanner: true,
  bulkOrder: true,
  collections: true,
  footer: true,
};

export const DEFAULT_HOME_EDITORIAL = {
  eyebrow: 'Browse the collection',
  titleLine1: 'Good clothes.',
  titleLine2: 'Everyday fits.',
  body: 'Browse pants, trousers, three-quarter pants and track pants. Select your options and send a purchase enquiry to the seller.',
  ctaLabel: 'Meet your new uniform',
  ctaTo: '/shop',
  image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=75',
};

export const DEFAULT_COLLECTIONS_PAGE = {
  eyebrow: 'Curated edits',
  title: 'Collections, issue by issue.',
  description: 'Each edit is a small group of pieces chosen to work together — a starting point rather than a rulebook.',
};

export const DEFAULT_HOME_CONTENT = {
  categoriesEyebrow: 'Shop by category',
  categoriesTitle: 'Find your starting point.',
  categoriesLink: 'View all pieces',
  featuredEyebrow: 'The DND edit',
  featuredTitleLine1: 'Good things,',
  featuredTitleLine2: 'in good company.',
  featuredBody: 'Pieces to reach for, again and again — chosen by the people who made them.',
  featuredButton: 'Explore all pieces',
  newArrivalsTitle: 'Just landed',
  newArrivalsLink: 'See all new arrivals',
  bulkEyebrow: 'For shops, teams and resellers',
  bulkTitle: 'Buying in quantity?',
  bulkBody: 'Share the styles and quantities you need. The seller will confirm availability and a wholesale quote.',
  bulkButton: 'Request wholesale pricing',
  collectionsEyebrow: 'Curated edits',
  collectionsTitle: 'Collections to browse.',
};

export const DEFAULT_STATIC_STORE = {
  products: SEED_PRODUCTS,
  categories: CATEGORIES,
  collections: COLLECTIONS,
  brandValues: BRAND_VALUES,
  storyBlocks: STORY_BLOCKS,
  promos: SEED_PROMOS,
  announcements: SEED_ANNOUNCEMENTS,
  settings: {
    ...SEED_SETTINGS,
    visibility: DEFAULT_VISIBILITY,
    homeEditorial: DEFAULT_HOME_EDITORIAL,
    collectionsPage: DEFAULT_COLLECTIONS_PAGE,
    homeContent: DEFAULT_HOME_CONTENT,
  },
};
