import { PRICE_BOUNDS } from '../data/taxonomy';
import { isInStock, stockFor, colorNames } from '../data/products';

/**
 * Catalog query engine.
 *
 * These are pure functions over whatever product list is passed in (the live,
 * admin-edited list from StoreContext).
 */

function matchesSearch(product, query) {
  if (!query) return true;
  const haystack = [
    product.name,
    product.category,
    product.gender,
    product.fabric,
    product.fit,
    product.blurb,
    ...colorNames(product),
    ...(product.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

function applyFilters(products, filters) {
  const {
    query = '',
    category = 'all',
    gender = [],
    sizes = [],
    colors = [],
    fabrics = [],
    fits = [],
    minPrice = PRICE_BOUNDS.min,
    maxPrice = PRICE_BOUNDS.max,
    onSale = false,
    inStock = false,
  } = filters;

  return products.filter((product) => {
    if (!matchesSearch(product, query)) return false;

    if (category !== 'all') {
      if (category === 'new') {
        if (!product.tags?.includes('new')) return false;
      } else if (product.category !== category) {
        return false;
      }
    }

    if (gender.length && !gender.includes(product.gender) && product.gender !== 'unisex') {
      return false;
    }

    const productColors = colorNames(product);
    if (colors.length && !productColors.some((c) => colors.includes(c))) return false;
    if (fabrics.length && !fabrics.includes(product.fabric)) return false;
    if (fits.length && !fits.includes(product.fit)) return false;

    if (sizes.length) {
      const available = product.sizes.filter((size) =>
        productColors.some((color) => stockFor(product, color, size) > 0),
      );
      if (!sizes.some((s) => available.includes(s))) return false;
    }

    if (product.price < minPrice || product.price > maxPrice) return false;
    if (onSale && !product.compareAt) return false;
    if (inStock && !isInStock(product)) return false;

    return true;
  });
}

function applySort(products, sort) {
  const sorted = [...products];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'newest':
      return sorted.sort((a, b) => new Date(b.released) - new Date(a.released));
    case 'featured':
    default:
      return sorted.sort((a, b) => featuredScore(b) - featuredScore(a));
  }
}

export function featuredScore(product) {
  return (product.tags ?? []).includes('new') ? 1 : 0;
}

/** Facet counts so the sidebar can show how many results each option returns. */
function buildFacets(products) {
  const tally = (acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  };

  const colors = products.reduce((acc, p) => colorNames(p).reduce(tally, acc), {});
  const fabrics = products.reduce((acc, p) => tally(acc, p.fabric), {});
  const fits = products.reduce((acc, p) => tally(acc, p.fit), {});
  const genders = products.reduce((acc, p) => tally(acc, p.gender), {});
  const categories = products.reduce((acc, p) => tally(acc, p.category), {});

  const sizes = products.reduce((acc, product) => {
    product.sizes.forEach((size) => {
      const available = colorNames(product).some((color) => stockFor(product, color, size) > 0);
      if (available) acc[size] = (acc[size] || 0) + 1;
    });
    return acc;
  }, {});

  return {
    colors,
    fabrics,
    fits,
    genders,
    categories,
    sizes,
    onSale: products.filter((p) => p.compareAt).length,
    inStock: products.filter(isInStock).length,
  };
}

/** Filter → sort → paginate, with facet counts for the current result set. */
export function queryProducts(
  allProducts,
  { filters = {}, sort = 'featured', page = 1, perPage = 12 } = {},
) {
  const filtered = applyFilters(allProducts, filters);
  const sorted = applySort(filtered, sort);
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * perPage;

  return {
    items: sorted.slice(start, start + perPage),
    total,
    page: safePage,
    pageCount,
    perPage,
    facets: buildFacets(filtered),
  };
}

export function searchProducts(allProducts, query, limit = 6) {
  if (!query?.trim()) return [];
  return allProducts.filter((p) => matchesSearch(p, query)).slice(0, limit);
}
