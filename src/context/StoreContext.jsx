import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, assetUrl } from '../api/client';
import { SEED_PRODUCTS } from '../data/products';
import { CATEGORIES } from '../data/taxonomy';
import { SEED_PROMOS } from '../data/promoCodes';
import { SEED_ANNOUNCEMENTS, SEED_SETTINGS } from '../data/settings';

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

/**
 * Live store data, loaded from the API.
 *
 * The admin console writes through its own endpoints; the storefront simply
 * re-fetches. Nothing here is editable client-side, which is what makes the
 * catalogue tamper-proof.
 */
export function StoreProvider({ children }) {
  const [state, setState] = useState({
    products: [],
    categories: [],
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
      setState({
        products: SEED_PRODUCTS,
        categories: CATEGORIES,
        promos: SEED_PROMOS,
        announcements: SEED_ANNOUNCEMENTS,
        settings: SEED_SETTINGS,
        countries: [],
      });
      setStatus('ready');
      setError(null);
      return;
    }

    try {
      const data = await api.storefront();
      setState({
        products: data.products ?? [],
        categories: data.categories ?? [],
        promos: data.promos ?? [],
        announcements: data.announcements ?? [],
        settings: { ...FALLBACK_SETTINGS, ...(data.settings ?? {}) },
        countries: data.countries ?? [],
      });
      setStatus('ready');
      setError(null);
    } catch (err) {
      setState({
        products: SEED_PRODUCTS,
        categories: CATEGORIES,
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
      activeAnnouncements: state.announcements,
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
