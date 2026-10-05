import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { colorNames, relatedProducts, sizesInStock, stockFor } from '../data/products';
import { formatPrice } from '../utils/format';
import { ProductGallery } from '../components/product/ProductGallery';
import { SizePicker } from '../components/product/SizePicker';
import { SizeGuide } from '../components/product/SizeGuide';
import { ProductRail } from '../components/product/ProductRail';
import { QuickViewModal } from '../components/product/QuickViewModal';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ColorSwatchButton } from '../components/ui/ColorSwatch';
import { QuantityStepper } from '../components/ui/QuantityStepper';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { HeartIcon } from '../components/ui/Icons';

/** Replaces {token} placeholders in admin-authored copy. */
function fill(template, values) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { products, productsBySlug, productsById, categoryMap, settings, status } = useStore();
  const product = productsBySlug[slug];

  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [quickView, setQuickView] = useState(null);

  const { addItem, openCart } = useCart();
  const wishlist = useWishlist();
  const { notify } = useToast();
  const { ids: recentIds, record } = useRecentlyViewed();

  useEffect(() => {
    if (!product) return;
    setColor(colorNames(product)[0]);
    setSize(null);
    setQuantity(1);
    record(product.id);
  }, [product, record]);

  const stockBySize = useMemo(() => {
    if (!product || !color) return {};
    return Object.fromEntries(product.sizes.map((s) => [s, stockFor(product, color, s)]));
  }, [product, color]);

  const related = useMemo(
    () => (product ? relatedProducts(product, products) : []),
    [product, products],
  );

  const recentlyViewed = useMemo(
    () =>
      recentIds
        .filter((id) => id !== product?.id)
        .map((id) => productsById[id])
        .filter(Boolean)
        .slice(0, 4),
    [recentIds, product, productsById],
  );

  if (status === 'loading') {
    return (
      <div className="dnd-container grid gap-10 py-10 lg:grid-cols-2">
        <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="dnd-container py-20">
        <EmptyState
          title="We couldn't find that piece."
          description="It may have been removed, or the link may be out of date."
        >
          <Button to="/shop">Back to the shop</Button>
        </EmptyState>
      </div>
    );
  }

  if (!color) return null;

  // Copy comes from the admin console: per-product overrides first, then the
  // store-wide defaults, then a hard-coded fallback.
  const copy = product.copy ?? {};
  const globalCopy = settings.productCopy ?? {};
  const available = sizesInStock(product, color);
  const maxQuantity = size ? Math.min(stockBySize[size] ?? 0, 10) : 10;
  const saved = wishlist.has(product.id);
  const category = categoryMap[product.category];
  const festive = settings.festiveOffer;

  function handleAddToBag() {
    if (!size) {
      notify(globalCopy.chooseSizeError ?? 'Choose a size first.', { tone: 'error' });
      return;
    }
    addItem(product, { size, color, quantity, maxQuantity });
    notify(`${product.name} (${size}, ${color}) added to your bag.`, {
      tone: 'success',
      action: { label: 'View bag', onClick: openCart },
    });
  }

  function handleWishlist() {
    const added = wishlist.toggle(product.id);
    notify(added ? 'Saved to your wishlist.' : 'Removed from your wishlist.', {
      tone: added ? 'success' : 'default',
    });
  }

  return (
    <div className="dnd-container py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Shop', to: '/shop' },
          ...(category ? [{ label: category.name, to: `/shop/${category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <ProductGallery product={product} activeColor={color} onColorChange={setColor} />

        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.tags?.map((tag) => (
                <Badge key={tag} tag={tag} />
              ))}
              <span className="dnd-eyebrow">{category?.name ?? product.category}</span>
            </div>

            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{product.name}</h1>

            <div className="flex flex-wrap items-baseline gap-3">
              <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
              {product.compareAt && (
                <>
                  <s className="text-base text-ink-500">{formatPrice(product.compareAt)}</s>
                  <span className="rounded-full bg-berry-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                    Save {Math.round((1 - product.price / product.compareAt) * 100)}%
                  </span>
                </>
              )}
            </div>

            {festive?.active && (
              <p className="inline-flex items-center gap-2 rounded-full bg-clay-400/20 px-3 py-1.5 text-xs font-semibold text-clay-500">
                {festive.label} — extra {festive.percent}% off at checkout
              </p>
            )}

            <p className="max-w-prose text-sm leading-relaxed text-ink-500">{product.blurb}</p>
          </div>

          {/* ------------------------------------------------- Colour */}
          <div className="space-y-2.5">
            <p className="dnd-label mb-0">
              Colour —{' '}
              <span className="font-normal normal-case tracking-normal text-ink-900">{color}</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {colorNames(product).map((option) => (
                <ColorSwatchButton
                  key={option}
                  color={option}
                  selected={option === color}
                  onSelect={(next) => {
                    setColor(next);
                    setSize(null);
                  }}
                />
              ))}
            </div>
          </div>

          {/* --------------------------------------------------- Size */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <p className="dnd-label mb-0">Size</p>
              <SizeGuide product={product} />
            </div>
            <SizePicker
              sizes={product.sizes}
              value={size}
              onChange={setSize}
              stockBySize={stockBySize}
            />
            {size && stockBySize[size] > 0 && stockBySize[size] <= 3 && (
              <p className="text-xs font-medium text-berry-500">
                {fill(globalCopy.lowStockTemplate ?? 'Only {count} left in {size} / {color}.', {
                  count: stockBySize[size],
                  size,
                  color,
                })}
              </p>
            )}
            {!available.length && (
              <p className="text-xs font-medium text-berry-500">
                {fill(
                  globalCopy.soldOutColorTemplate ??
                    '{color} is sold out in every size. Try another colour.',
                  { color },
                )}
              </p>
            )}
          </div>

          {/* ------------------------------------------- Add to bag */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <QuantityStepper value={quantity} onChange={setQuantity} max={maxQuantity} />
              <Button
                onClick={handleAddToBag}
                disabled={!available.length}
                size="lg"
                className="flex-1"
              >
                {available.length
                  ? `${copy.addToBagLabel ?? 'Add to bag'} · ${formatPrice(product.price * quantity)}`
                  : copy.soldOutLabel ?? 'Sold out'}
              </Button>
              <button
                type="button"
                onClick={handleWishlist}
                aria-pressed={saved}
                aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
                className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  saved
                    ? 'border-berry-500 bg-berry-500/10 text-berry-500'
                    : 'border-sand-300 hover:border-ink-900'
                }`}
              >
                <HeartIcon filled={saved} className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-ink-500">
              Delivery charges and applicable taxes are confirmed by the seller before an order is
              accepted.
            </p>
          </div>

          {/* ------------------------------------------------ Details */}
          <div className="divide-y divide-sand-200 border-y border-sand-200">
            <Accordion title={copy.detailsHeading ?? 'Details & fit'} defaultOpen>
              <ul className="space-y-1.5">
                {(product.details ?? []).map((detail) => (
                  <li key={detail} className="flex gap-2">
                    <span className="text-clay-500" aria-hidden="true">·</span>
                    {detail}
                  </li>
                ))}
              </ul>
            </Accordion>

            <Accordion title={copy.fabricHeading ?? `Fabric — ${product.fabric}`}>
              <p>{copy.fabricBody ?? `${product.fabric} chosen for how it wears over time.`}</p>
            </Accordion>

            <Accordion title={copy.careHeading ?? 'Care'}>
              <ul className="space-y-1.5">
                {(product.care ?? []).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-clay-500" aria-hidden="true">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Accordion>

            <Accordion title={copy.shippingHeading ?? 'Ordering & delivery'}>
              <p>
                {copy.shippingBody ??
                  'Send a purchase enquiry on WhatsApp. The seller will confirm availability, applicable taxes, delivery charges and the final quote.'}
              </p>
            </Accordion>
          </div>
        </div>
      </div>

      <div className="mt-20 space-y-16">
        <ProductRail
          title={copy.relatedHeading ?? 'Complete the look'}
          description={copy.relatedSubheading ?? 'Pieces that work with this one.'}
          products={related}
          onQuickView={setQuickView}
        />
        {recentlyViewed.length > 0 && (
          <ProductRail title="Recently viewed" products={recentlyViewed} onQuickView={setQuickView} />
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

function Accordion({ title, children, defaultOpen = false }) {
  return (
    <details open={defaultOpen} className="group py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
        {title}
        <span
          className="text-lg text-ink-500 transition-transform duration-200 group-open:rotate-45"
          aria-hidden="true"
        >
          +
        </span>
      </summary>
      <div className="pt-3 text-sm leading-relaxed text-ink-500">{children}</div>
    </details>
  );
}
