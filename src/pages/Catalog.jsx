import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { queryProducts } from '../api/mockApi';
import { useStore } from '../context/StoreContext';
import { useCatalogFilters } from '../hooks/useCatalogFilters';
import { SORT_OPTIONS } from '../data/taxonomy';
import { ProductCard } from '../components/product/ProductCard';
import { QuickViewModal } from '../components/product/QuickViewModal';
import { FilterSidebar } from '../components/catalog/FilterSidebar';
import { ActiveFilters } from '../components/catalog/ActiveFilters';
import { Pagination } from '../components/catalog/Pagination';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { EmptyState } from '../components/ui/EmptyState';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import { classNames, pad } from '../utils/format';
import { CloseIcon, FilterIcon, GridIcon, ListIcon } from '../components/ui/Icons';

const PER_PAGE = 12;

const NEW_CATEGORY = {
  slug: 'new',
  name: 'New arrivals',
  blurb: 'The latest drops, fresh off the table.',
};

export default function Catalog() {
  const { category: routeCategory } = useParams();
  const { products, categoryMap, status } = useStore();
  const { filters, sort, page, view, activeCount, update, clear } = useCatalogFilters(routeCategory);

  const [quickView, setQuickView] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const data = useMemo(
    () => queryProducts(products, { filters, sort, page, perPage: PER_PAGE }),
    [products, filters, sort, page],
  );

  const categoryInfo = filters.category === 'new' ? NEW_CATEGORY : categoryMap[filters.category];
  const title = categoryInfo?.name ?? 'All pieces';
  const blurb = categoryInfo?.blurb ?? 'Everything we make, in one place.';
  const loading = status === 'loading';

  return (
    <div className="dnd-container py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Shop', to: '/shop' },
          ...(categoryInfo ? [{ label: categoryInfo.name }] : []),
        ]}
      />

      <header className="mt-6 flex flex-wrap items-end justify-between gap-6 border-b border-sand-200 pb-8">
        <div>
          <p className="dnd-eyebrow">The DND edit</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-2 max-w-md text-sm text-ink-500">{blurb}</p>
        </div>
        <p className="text-sm text-ink-500">
          <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-ink-900">
            {pad(data.total)}
          </span>{' '}
          {data.total === 1 ? 'piece' : 'pieces'}
        </p>
      </header>

      {/* ------------------------------------------------------- Toolbar */}
      <div className="sticky top-16 z-30 -mx-5 mb-6 flex items-center justify-between gap-3 border-b border-sand-200 bg-sand-100/92 px-5 py-3 backdrop-blur md:-mx-10 md:px-10 lg:top-18 xl:-mx-16 xl:px-16">
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-expanded={filtersOpen}
          className="inline-flex items-center gap-2 rounded-full border border-sand-300 px-4 py-2 text-sm font-medium transition-colors hover:border-ink-900 lg:hidden"
        >
          <FilterIcon className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900 px-1.5 text-[11px] text-sand-100">
              {activeCount}
            </span>
          )}
        </button>

        <div className="hidden lg:block">
          <ActiveFilters filters={filters} onChange={update} onClear={clear} />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex rounded-full border border-sand-300 p-0.5">
            <ViewToggle
              active={view === 'grid'}
              onClick={() => update({ view: 'grid' }, { resetPage: false })}
              label="Grid view"
            >
              <GridIcon className="h-4 w-4" />
            </ViewToggle>
            <ViewToggle
              active={view === 'list'}
              onClick={() => update({ view: 'list' }, { resetPage: false })}
              label="List view"
            >
              <ListIcon className="h-4 w-4" />
            </ViewToggle>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <span className="dnd-eyebrow mb-0 max-sm:sr-only">Sort</span>
            <select
              value={sort}
              onChange={(event) => update({ sort: event.target.value })}
              className="rounded-full border border-sand-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors hover:border-ink-900 focus:border-ink-900"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="lg:hidden">
        <ActiveFilters filters={filters} onChange={update} onClear={clear} />
      </div>

      {/* --------------------------------------------------- Main layout */}
      <div className="grid gap-10 lg:grid-cols-[16rem_1fr] xl:grid-cols-[18rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto pr-2">
            <FilterSidebar
              filters={filters}
              facets={data.facets}
              onChange={update}
              onClear={clear}
              activeCount={activeCount}
            />
          </div>
        </aside>

        <div>
          {loading ? (
            <ProductGridSkeleton count={PER_PAGE} />
          ) : data.items.length === 0 ? (
            <EmptyState
              title="No pieces found."
              description="Try adjusting or clearing your filters to see more."
            >
              <Button onClick={clear} variant="outline">
                Clear all filters
              </Button>
            </EmptyState>
          ) : (
            <>
              <div
                aria-live="polite"
                className={classNames(
                  view === 'grid'
                    ? 'grid grid-cols-2 gap-x-4 gap-y-10 xl:grid-cols-3 2xl:grid-cols-4'
                    : 'flex flex-col gap-2',
                )}
              >
                {data.items.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    layout={view}
                    priority={index < 4}
                    onQuickView={setQuickView}
                  />
                ))}
              </div>

              <Pagination
                page={data.page}
                pageCount={data.pageCount}
                onChange={(next) => {
                  update({ page: next }, { resetPage: false });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------- Mobile filter drawer */}
      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        side="left"
        label="Product filters"
      >
        <header className="flex items-center justify-between border-b border-sand-200 px-6 py-5">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <FilterSidebar
            filters={filters}
            facets={data.facets}
            onChange={update}
            onClear={clear}
            activeCount={activeCount}
          />
        </div>
        <footer className="border-t border-sand-200 p-4">
          <Button full onClick={() => setFiltersOpen(false)}>
            Show {data.total} {data.total === 1 ? 'piece' : 'pieces'}
          </Button>
        </footer>
      </Drawer>

      <QuickViewModal
        product={quickView}
        open={Boolean(quickView)}
        onClose={() => setQuickView(null)}
      />
    </div>
  );
}

function ViewToggle({ active, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={classNames(
        'inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors max-sm:hidden',
        active ? 'bg-ink-900 text-sand-100' : 'text-ink-500 hover:text-ink-900',
      )}
    >
      {children}
    </button>
  );
}
