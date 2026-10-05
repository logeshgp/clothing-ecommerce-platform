import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { queryProducts } from '../api/mockApi';
import { useStore } from '../context/StoreContext';
import { SORT_OPTIONS } from '../data/taxonomy';
import { ProductCard } from '../components/product/ProductCard';
import { QuickViewModal } from '../components/product/QuickViewModal';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useDebounce } from '../hooks/useDebounce';
import { SearchIcon } from '../components/ui/Icons';

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const sort = params.get('sort') ?? 'featured';

  const { products } = useStore();
  const [input, setInput] = useState(query);
  const [quickView, setQuickView] = useState(null);

  const debouncedInput = useDebounce(input, 350);

  // Keep the URL in step with the input so results stay shareable.
  useEffect(() => {
    if (debouncedInput === query) return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        debouncedInput ? next.set('q', debouncedInput) : next.delete('q');
        return next;
      },
      { replace: true },
    );
  }, [debouncedInput, query, setParams]);

  const results = useMemo(
    () => (query ? queryProducts(products, { filters: { query }, sort, perPage: 48 }).items : []),
    [products, query, sort],
  );

  return (
    <div className="dnd-container py-10">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Search' }]} />

      <header className="mt-6 border-b border-sand-200 pb-8">
        <p className="dnd-eyebrow">Search</p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
          {query ? <>Results for "{query}"</> : 'Search the collection'}
        </h1>

        <div className="mt-6 flex max-w-xl items-center gap-3 rounded-full border border-sand-300 bg-white px-5 py-3">
          <SearchIcon className="h-5 w-5 shrink-0 text-ink-500" />
          <label htmlFor="search-input" className="sr-only">
            Search products
          </label>
          <input
            id="search-input"
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Try 'pants', 'trousers' or 'track pants'"
            className="w-full bg-transparent outline-none placeholder:text-sand-400"
          />
        </div>
      </header>

      {query && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-ink-500" aria-live="polite">
            {results.length} {results.length === 1 ? 'piece' : 'pieces'} found
          </p>
          <label className="flex items-center gap-2 text-sm">
            <span className="dnd-eyebrow mb-0">Sort</span>
            <select
              value={sort}
              onChange={(event) =>
                setParams((current) => {
                  const next = new URLSearchParams(current);
                  next.set('sort', event.target.value);
                  return next;
                })
              }
              className="rounded-full border border-sand-300 bg-white px-3.5 py-2 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="mt-8">
        {!query ? (
          <EmptyState
            mark="⌕"
            title="What are you looking for?"
            description="Search by name, fabric, colour or category."
          />
        ) : results.length === 0 ? (
          <EmptyState
            title={`Nothing matches "${query}".`}
            description="Try a different term, or browse everything we make."
          >
            <Button to="/shop">Browse all pieces</Button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 4}
                onQuickView={setQuickView}
              />
            ))}
          </div>
        )}
      </div>

      <QuickViewModal
        product={quickView}
        open={Boolean(quickView)}
        onClose={() => setQuickView(null)}
      />
    </div>
  );
}
