import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, assetUrl } from '../api/client';
import { SEED_PRODUCTS } from '../data/products';
import { CATEGORIES } from '../data/taxonomy';
import { SEED_PROMOS } from '../data/promoCodes';
import { SEED_ANNOUNCEMENTS, SEED_SETTINGS } from '../data/settings';
import { BRAND_VALUES, COLLECTIONS, STORY_BLOCKS } from '../data/collections';
import { DEFAULT_STATIC_STORE } from '../data/storeConfig';

const StoreContext = createContext(null);

const FALLBACK_SETTINGS = {
  storeName: 'DND Store',
  tagline: 'Good clothes for the in-between.',
  supportEmail: 'hello@dndstore.example',
  taxRate: 0.05,
  freeShippingThreshold: 1999,
  festiveOffer: { active: false, label: '', percent: 0 },
  shippingMethods: [],
  hero: {},
  banner: { enabled: false },
  support: { enabled: true },
  productCopy: {},
  whatsapp: { enabled: false },
};

const SEEDED_STORE = { ...DEFAULT_STATIC_STORE, countries: [] };

async function loadPublishedStore() {
  const response = await fetch(`${import.meta.env.BASE_URL}store-data.json`, {
    cache: 'no-store',
  });

  if (response.status === 404) return SEEDED_STORE;
  if (!response.ok) {
    throw new Error(`Could not load published store data (${response.status}).`);
  }

  const data = await response.json();
  if (
    !data ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.categories) ||
    !Array.isArray(data.promos) ||
    !Array.isArray(data.announcements) ||
    !data.settings ||
    typeof data.settings !== 'object' ||
    (data.collections !== undefined && !Array.isArray(data.collections)) ||
    (data.brandValues !== undefined && !Array.isArray(data.brandValues)) ||
    (data.storyBlocks !== undefined && !Array.isArray(data.storyBlocks))
  ) {
    throw new Error('Published store data is incomplete or has an invalid format.');
  }

  return {
    products: data.products.filter((product) => product.active !== false),
    categories: data.categories.filter((category) => category.enabled !== false),
    collections: data.collections ?? COLLECTIONS,
    brandValues: data.brandValues ?? BRAND_VALUES,
    storyBlocks: data.storyBlocks ?? STORY_BLOCKS,
    promos: data.promos,
    announcements: data.announcements.filter((announcement) => announcement.active !== false),
    settings: {
      ...FALLBACK_SETTINGS,
      ...data.settings,
      visibility: data.settings.visibility ?? {},
    },
    countries: data.countries ?? [],
  };
}

/**
 * Store data comes from the committed JSON file in GitHub Pages mode, or the
 * optional API in API mode. A missing JSON file uses the bundled starter data.
 */
export function StoreProvider({ children }) {
  const [state, setState] = useState({
    products: [],
    categories: [],
    collections: COLLECTIONS,
    brandValues: BRAND_VALUES,
    storyBlocks: STORY_BLOCKS,
    promos: [],
    announcements: [],
    settings: FALLBACK_SETTINGS,
    countries: [],
  });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    if (import.meta.env.VITE_GITHUB_ONLY !== 'false') {
      try {
        const data = await loadPublishedStore();
        setState(data);
        setStatus('ready');
        setError(null);
      } catch (err) {
        setState(SEEDED_STORE);
        setStatus('ready');
        setError(err.message);
      }
      return;
    }

    try {
      const data = await api.storefront();
      setState({
        products: (data.products ?? []).filter((product) => product.active !== false),
        categories: (data.categories ?? []).filter((category) => category.enabled !== false),
        collections: data.collections ?? COLLECTIONS,
        brandValues: data.brandValues ?? BRAND_VALUES,
        storyBlocks: data.storyBlocks ?? STORY_BLOCKS,
        promos: data.promos ?? [],
        announcements: (data.announcements ?? []).filter((announcement) => announcement.active !== false),
        settings: { ...FALLBACK_SETTINGS, ...(data.settings ?? {}) },
        countries: data.countries ?? [],
      });
      setStatus('ready');
      setError(null);
    } catch (err) {
      setState({
        products: SEED_PRODUCTS,
        categories: CATEGORIES,
        collections: COLLECTIONS,
        brandValues: BRAND_VALUES,
        storyBlocks: STORY_BLOCKS,
        promos: SEED_PROMOS,
        announcements: SEED_ANNOUNCEMENTS,
        settings: SEED_SETTINGS,
        countries: [],
      });
      setError(err.message);
      setStatus('ready');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const productsById = useMemo(
    () => Object.fromEntries(state.products.map((p) => [p.id, p])),
    [state.products],
  );

  const productsBySlug = useMemo(
    () => Object.fromEntries(state.products.map((p) => [p.slug, p])),
    [state.products],
  );

  const categoryMap = useMemo(
    () => Object.fromEntries(state.categories.map((c) => [c.slug, c])),
    [state.categories],
  );

  const value = useMemo(
    () => ({
      ...state,
      productsById,
      productsBySlug,
      categoryMap,
      activeAnnouncements: state.announcements.filter((announcement) => announcement.active !== false),
      status,
      error,
      demoMode: status === 'ready' && Boolean(error),
      reload: load,
      assetUrl,
    }),
    [state, productsById, productsBySlug, categoryMap, status, error, load],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
}
