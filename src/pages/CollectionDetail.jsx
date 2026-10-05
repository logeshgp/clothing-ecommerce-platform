import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { COLLECTIONS_BY_SLUG } from '../data/collections';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/product/ProductCard';
import { QuickViewModal } from '../components/product/QuickViewModal';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { assetUrl } from '../api/client';

export default function CollectionDetail() {
  const { slug } = useParams();
  const { productsById } = useStore();
  const [quickView, setQuickView] = useState(null);

  const collection = COLLECTIONS_BY_SLUG[slug];

  const products = useMemo(
    () => (collection?.productIds ?? []).map((id) => productsById[id]).filter(Boolean),
    [collection, productsById],
  );

  if (!collection) {
    return (
      <div className="dnd-container py-20">
        <EmptyState title="Collection not found." description="This edit may have been archived.">
          <Button to="/collections">All collections</Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="dnd-container py-10">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Collections', to: '/collections' },
          { label: collection.title },
        ]}
      />

      <header className="relative mt-6 overflow-hidden rounded-3xl bg-sand-200">
        <img src={assetUrl(collection.image)} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/30 to-transparent" />
        <div className="absolute inset-x-6 bottom-6 max-w-2xl space-y-3 text-sand-50 sm:inset-x-10 sm:bottom-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sand-300">
            Issue {collection.issue}
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">{collection.title}</h1>
          <p className="text-base font-medium text-sand-100">{collection.tagline}</p>
          <p className="max-w-lg text-sm leading-relaxed text-sand-200">{collection.description}</p>
        </div>
      </header>

      <div className="mt-10 flex items-end justify-between gap-4 border-b border-sand-200 pb-6">
        <h2 className="text-2xl font-bold">In this edit</h2>
        <p className="text-sm text-ink-500">{products.length} pieces</p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          className="py-16"
          title="Nothing here right now."
          description="The pieces in this edit are currently unavailable."
        >
          <Button to="/shop">Browse all pieces</Button>
        </EmptyState>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
              onQuickView={setQuickView}
            />
          ))}
        </div>
      )}

      <div className="mt-14 flex justify-center">
        <Button to="/collections" variant="outline">
          ← All collections
        </Button>
      </div>

      <QuickViewModal
        product={quickView}
        open={Boolean(quickView)}
        onClose={() => setQuickView(null)}
      />
    </div>
  );
}
