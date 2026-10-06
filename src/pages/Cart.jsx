import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { stockFor } from '../data/products';
import { WishlistRow } from './Wishlist';
import { formatPrice } from '../utils/format';
import { assetUrl } from '../api/client';
import { OrderSummary } from '../components/cart/OrderSummary';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { QuantityStepper } from '../components/ui/QuantityStepper';
import { HeartIcon, TrashIcon } from '../components/ui/Icons';

export default function Cart() {
  const { items, selectedItems, totals, updateQuantity, removeItem, changeSize, setSelected, selectAll } = useCart();
  const { productsById } = useStore();
  const wishlist = useWishlist();
  const { notify } = useToast();
  const wishlistProducts = wishlist.ids.map((id) => productsById[id]).filter(Boolean);

  return (
    <div className="dnd-container py-10">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Bag' }]} />

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-sand-200 pb-8">
        <div>
          <p className="dnd-eyebrow">Your selection</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Your bag</h1>
        </div>
        <p className="text-sm text-ink-500">
          {items.length} bag {items.length === 1 ? 'item' : 'items'} · {wishlistProducts.length} saved
        </p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] xl:gap-16">
        <div className="space-y-10">
          <section aria-labelledby="bag-items-title">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="bag-items-title" className="text-xl font-semibold">Bag items</h2>
              {items.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-ink-600">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === items.length}
                    onChange={(event) => selectAll(event.target.checked)}
                    className="h-4 w-4 accent-ink-900"
                  />
                  Select all bag items
                </label>
              )}
            </div>
            {items.length ? <ul className="divide-y divide-sand-200 border-y border-sand-200">
            {items.map((line) => {
              const product = productsById[line.productId];
              const stock = product ? stockFor(product, line.color, line.size) : line.maxQuantity;

              return (
                <li key={line.id} className="flex flex-col gap-4 py-6 sm:flex-row">
                  <label className="flex shrink-0 items-start gap-2 pt-1 text-sm">
                    <input
                      type="checkbox"
                      checked={line.selected !== false}
                      onChange={(event) => setSelected(line.id, event.target.checked)}
                      aria-label={`Select ${line.name} for checkout`}
                      className="h-4 w-4 accent-ink-900"
                    />
                  </label>
                  <Link
                    to={`/product/${line.slug}`}
                    className="h-40 w-32 shrink-0 overflow-hidden rounded-2xl bg-sand-200"
                  >
                    <img src={assetUrl(line.image)} alt={line.name} className="h-full w-full object-cover" />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <p className="dnd-eyebrow">{line.category}</p>
                        <Link
                          to={`/product/${line.slug}`}
                          className="block truncate text-base font-semibold"
                        >
                          {line.name}
                        </Link>
                        <p className="text-sm text-ink-500">
                          {line.color} · Size {line.size}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold tabular-nums">
                          {formatPrice(line.price * line.quantity)}
                        </p>
                        {line.compareAt > line.price && (
                          <s className="block text-xs text-ink-500">
                            {formatPrice(line.compareAt * line.quantity)}
                          </s>
                        )}
                        {line.quantity > 1 && (
                          <p className="text-xs text-ink-500">{formatPrice(line.price)} each</p>
                        )}
                      </div>
                    </div>

                    {product && product.sizes.length > 1 && (
                      <label className="flex items-center gap-2 text-xs text-ink-500">
                        Change size
                        <select
                          value={line.size}
                          onChange={(event) => {
                            const next = event.target.value;
                            changeSize(
                              line.id,
                              next,
                              Math.min(stockFor(product, line.color, next), 10),
                            );
                          }}
                          className="rounded-lg border border-sand-300 bg-white px-2 py-1 text-xs"
                        >
                          {product.sizes.map((s) => {
                            const available = stockFor(product, line.color, s);
                            return (
                              <option key={s} value={s} disabled={available <= 0}>
                                {s}
                                {available <= 0 ? ' — sold out' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    )}

                    {stock <= 3 && stock > 0 && (
                      <p className="text-xs font-medium text-berry-500">Only {stock} left</p>
                    )}

                    <div className="mt-auto flex flex-wrap items-center gap-4">
                      <QuantityStepper
                        value={line.quantity}
                        onChange={(quantity) => updateQuantity(line.id, quantity)}
                        max={Math.min(stock || line.maxQuantity, 10)}
                        size="sm"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          if (!wishlist.has(line.productId)) wishlist.toggle(line.productId);
                          notify(`${line.name} saved to your wishlist.`);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-ink-900"
                      >
                        <HeartIcon className="h-4 w-4" /> Save to wishlist
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          removeItem(line.id);
                          notify(`${line.name} removed from your bag.`);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-berry-500"
                      >
                        <TrashIcon className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul> : (
            <EmptyState
              title="Your bag is empty."
              description="Add an item to your bag to select it for a purchase enquiry."
              className="border-y border-sand-200 py-12"
            >
              <Button to="/shop">Start shopping</Button>
            </EmptyState>
          )}

          <div className="mt-6">
            <Link to="/shop" className="text-sm font-medium underline underline-offset-4">
              ← Continue shopping
            </Link>
          </div>
          </section>

          <section aria-labelledby="wishlist-items-title">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="wishlist-items-title" className="text-xl font-semibold">
                Wishlist items <span className="text-sm font-normal text-ink-500">({wishlistProducts.length})</span>
              </h2>
              <Link to="/wishlist" className="text-sm font-medium underline underline-offset-4">
                Manage wishlist
              </Link>
            </div>
            {wishlistProducts.length ? (
              <ul className="space-y-4">
                {wishlistProducts.map((product) => <WishlistRow key={product.id} product={product} />)}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-sand-300 p-5 text-sm text-ink-500">
                Your wishlist is empty. Save a product with the heart button to keep it here.
              </p>
            )}
          </section>
        </div>

        {items.length > 0 && <aside className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary>
            <div className="space-y-3">
              {selectedItems.length ? (
                <Button to="/checkout" full size="lg">Continue with selected items</Button>
              ) : (
                <Button full size="lg" disabled>Select bag items to continue</Button>
              )}
              <p className="text-center text-xs text-ink-500">
                Only selected bag items are included in the estimate and enquiry.
              </p>
            </div>
          </OrderSummary>
        </aside>}
      </div>
    </div>
  );
}
