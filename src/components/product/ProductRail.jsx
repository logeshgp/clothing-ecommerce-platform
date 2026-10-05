import { ProductCard } from './ProductCard';

/** Horizontally scrolling product rail used for "related" and "recently viewed". */
export function ProductRail({ title, products, onQuickView, description }) {
  if (!products?.length) return null;

  return (
    <section aria-label={title} className="border-t border-sand-200 pt-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && <p className="text-sm text-ink-500">{description}</p>}
      </div>

      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
        {products.map((product) => (
          <div key={product.id} className="w-48 shrink-0 snap-start sm:w-56 md:w-auto">
            <ProductCard product={product} onQuickView={onQuickView} />
          </div>
        ))}
      </div>
    </section>
  );
}
