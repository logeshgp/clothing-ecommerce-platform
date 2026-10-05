import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PRICE_BOUNDS } from '../data/taxonomy';

const ARRAY_KEYS = ['sizes', 'colors', 'fabrics', 'fits', 'gender'];

/**
 * Keeps all catalog state in the URL so filtered views are shareable,
 * bookmarkable and survive the browser back button.
 */
export function useCatalogFilters(categoryFromRoute) {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(
    () => ({
      query: params.get('q') ?? '',
      category: categoryFromRoute ?? params.get('category') ?? 'all',
      sizes: params.get('sizes')?.split(',').filter(Boolean) ?? [],
      colors: params.get('colors')?.split(',').filter(Boolean) ?? [],
      fabrics: params.get('fabrics')?.split(',').filter(Boolean) ?? [],
      fits: params.get('fits')?.split(',').filter(Boolean) ?? [],
      gender: params.get('gender')?.split(',').filter(Boolean) ?? [],
      minPrice: PRICE_BOUNDS.min,
      maxPrice: Number(params.get('maxPrice')) || PRICE_BOUNDS.max,
      onSale: params.get('onSale') === '1',
      inStock: params.get('inStock') === '1',
    }),
    [params, categoryFromRoute],
  );

  const sort = params.get('sort') ?? 'featured';
  const page = Number(params.get('page')) || 1;
  const view = params.get('view') === 'list' ? 'list' : 'grid';

  const update = useCallback(
    (patch, { resetPage = true } = {}) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);

          Object.entries(patch).forEach(([key, value]) => {
            const paramKey = key === 'query' ? 'q' : key;

            if (ARRAY_KEYS.includes(key)) {
              value.length ? next.set(paramKey, value.join(',')) : next.delete(paramKey);
            } else if (key === 'maxPrice') {
              value < PRICE_BOUNDS.max ? next.set(paramKey, String(value)) : next.delete(paramKey);
            } else if (key === 'onSale' || key === 'inStock') {
              value ? next.set(paramKey, '1') : next.delete(paramKey);
            } else if (!value || value === 'all' || value === 'featured' || value === 'grid') {
              next.delete(paramKey);
            } else {
              next.set(paramKey, String(value));
            }
          });

          if (resetPage && !('page' in patch)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const clear = useCallback(() => {
    setParams(
      (current) => {
        const next = new URLSearchParams();
        const keepSort = current.get('sort');
        const keepView = current.get('view');
        if (keepSort) next.set('sort', keepSort);
        if (keepView) next.set('view', keepView);
        return next;
      },
      { replace: true },
    );
  }, [setParams]);

  const activeCount =
    ARRAY_KEYS.reduce((total, key) => total + filters[key].length, 0) +
    (filters.maxPrice < PRICE_BOUNDS.max ? 1 : 0) +
    (filters.onSale ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.query ? 1 : 0);

  return { filters, sort, page, view, activeCount, update, clear };
}
