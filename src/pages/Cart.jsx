import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { stockFor } from '../data/products';
import { formatPrice } from '../utils/format';
import { OrderSummary } from '../components/cart/OrderSummary';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { QuantityStepper } from '../components/ui/QuantityStepper';
import { HeartIcon, TrashIcon } from '../components/ui/Icons';

export default function Cart() {
  const { items, totals, updateQuantity, removeItem, changeSize } = useCart();
  const { productsById } = useStore();
  const wishlist = useWishlist();
  const { notify } = useToast();

  if (items.length === 0) {
    return (
      <div className="dnd-container py-10">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Bag' }]} />
        <EmptyState
          title="Your bag is empty."
          description="Once you add something, it'll stay here — even if you close the tab."
          className="py-24"
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Button to="/shop">Start shopping</Button>
            <Button to="/wishlist" variant="outline">
              View wishlist
            </Button>
          </div>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="dnd-container py-10">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Bag' }]} />

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-sand-200 pb-8">
        <div>
          <p className="dnd-eyebrow">Your selection</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Your bag</h1>
        </div>
        <p className="text-sm text-ink-500">
          {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}
        </p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] xl:gap-16">
        <div>
          <ul className="divide-y divide-sand-200 border-y border-sand-200">
            {items.map((line) => {
              const product = productsById[line.productId];
              const stock = product ? stockFor(product, line.color, line.size) : line.maxQuantity;

              return (
                <li key={line.id} className="flex flex-col gap-4 py-6 sm:flex-row">
                  <Link
                    to={`/product/${line.slug}`}
                    className="h-40 w-32 shrink-0 overflow-hidden rounded-2xl bg-sand-200"
                  >
                    <img src={line.image} alt={line.name} className="h-full w-full object-cover" />
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
                          const added = wishlist.toggle(line.productId);
                          removeItem(line.id);
                          notify(
                            added
                              ? `${line.name} moved to your wishlist.`
                              : `${line.name} removed from your bag.`,
                          );
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-ink-900"
                      >
                        <HeartIcon className="h-4 w-4" /> Move to wishlist
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
          </ul>

          <div className="mt-6">
            <Link to="/shop" className="text-sm font-medium underline underline-offset-4">
              ← Continue shopping
            </Link>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary>
            <div className="space-y-3">
              <Button to="/checkout" full size="lg">
                Request on WhatsApp
              </Button>
              <p className="text-center text-xs text-ink-500">
                Review your selection and send a purchase enquiry to the seller.
              </p>
            </div>
          </OrderSummary>
        </aside>
      </div>
    </div>
  );
}
