import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { stockFor } from '../../data/products';
import { formatPrice } from '../../utils/format';
import { Button, IconButton } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { QuantityStepper } from '../ui/QuantityStepper';
import { CloseIcon, TrashIcon } from '../ui/Icons';

export function CartDrawer() {
  const { items, totals, isOpen, closeCart, updateQuantity, removeItem, changeSize } = useCart();
  const { productsById } = useStore();

  return (
    <Drawer open={isOpen} onClose={closeCart} label="Shopping bag">
      <header className="flex items-start justify-between gap-4 border-b border-sand-200 px-6 py-5">
        <div>
          <p className="dnd-eyebrow">Your selection</p>
          <h2 className="mt-1 text-xl font-semibold">
            Your bag{' '}
            <span className="ml-1 text-sm font-normal text-ink-500">({totals.itemCount})</span>
          </h2>
        </div>
        <IconButton label="Close bag" onClick={closeCart}>
          <CloseIcon className="h-5 w-5" />
        </IconButton>
      </header>

      <div className="flex-1 overflow-y-auto px-6">
        {items.length === 0 ? (
          <EmptyState
            title="It's looking a little light."
            description="Find something that feels like you."
          >
            <Button to="/shop" onClick={closeCart}>
              Explore the collection
            </Button>
          </EmptyState>
        ) : (
          <ul className="divide-y divide-sand-200">
            {items.map((line) => {
              const product = productsById[line.productId];
              const stock = product
                ? stockFor(product, line.color, line.size)
                : line.maxQuantity;

              return (
                <li key={line.id} className="flex gap-4 py-5">
                  <Link
                    to={`/product/${line.slug}`}
                    onClick={closeCart}
                    className="h-28 w-22 shrink-0 overflow-hidden rounded-xl bg-sand-200"
                  >
                    <img src={line.image} alt={line.name} className="h-full w-full object-cover" />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/product/${line.slug}`}
                        onClick={closeCart}
                        className="truncate text-sm font-semibold"
                      >
                        {line.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(line.id)}
                        aria-label={`Remove ${line.name}`}
                        className="shrink-0 text-ink-500 transition-colors hover:text-berry-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-ink-500">
                      <span>{line.color}</span>
                      <span aria-hidden="true">·</span>
                      {product && product.sizes.length > 1 ? (
                        <label className="flex items-center gap-1">
                          <span className="sr-only">Size for {line.name}</span>
                          <select
                            value={line.size}
                            onChange={(event) => {
                              const nextSize = event.target.value;
                              changeSize(
                                line.id,
                                nextSize,
                                Math.min(stockFor(product, line.color, nextSize), 10),
                              );
                            }}
                            className="rounded-md border border-sand-300 bg-white px-1.5 py-0.5 text-xs"
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
                      ) : (
                        <span>Size {line.size}</span>
                      )}
                    </div>

                    {stock <= 3 && stock > 0 && (
                      <p className="text-[11px] font-medium text-berry-500">Only {stock} left</p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3">
                      <QuantityStepper
                        value={line.quantity}
                        onChange={(quantity) => updateQuantity(line.id, quantity)}
                        min={1}
                        max={Math.min(stock || line.maxQuantity, 10)}
                        size="sm"
                      />
                      <span className="text-sm font-semibold tabular-nums">
                        {formatPrice(line.price * line.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <footer className="space-y-4 border-t border-sand-200 bg-sand-100 px-6 py-5">
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatPrice(totals.subtotal)}</dd>
            </div>
            {totals.festiveDiscount > 0 && (
              <div className="flex justify-between text-clay-500">
                <dt>
                  {totals.festiveLabel} ({totals.festivePercent}%)
                </dt>
                <dd className="font-medium tabular-nums">−{formatPrice(totals.festiveDiscount)}</dd>
              </div>
            )}
            {totals.bulkDiscount > 0 && (
              <div className="flex justify-between text-moss-500">
                <dt>{totals.bulkLabel} ({totals.bulkPercent}%)</dt>
                <dd className="font-medium tabular-nums">−{formatPrice(totals.bulkDiscount)}</dd>
              </div>
            )}
            {totals.codeDiscount > 0 && (
              <div className="flex justify-between text-moss-500">
                <dt>Promo code</dt>
                <dd className="font-medium tabular-nums">−{formatPrice(totals.codeDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-sand-300 pt-2 text-base">
              <dt className="font-semibold">Estimated total</dt>
              <dd className="font-semibold tabular-nums">{formatPrice(totals.total)}</dd>
            </div>
          </dl>

          <p className="text-xs leading-relaxed text-ink-500">
            Delivery charges and applicable taxes are confirmed by the seller before an order is
            accepted. No payment is collected on this website.
          </p>

          <div className="space-y-2">
            <Button to="/checkout" onClick={closeCart} full>
              Request on WhatsApp
            </Button>
            <Button to="/cart" onClick={closeCart} variant="outline" full>
              View full bag
            </Button>
          </div>
        </footer>
      )}
    </Drawer>
  );
}
