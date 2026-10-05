import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { primaryImage } from '../../data/products';
import { formatDate, formatPrice } from '../../utils/format';
import { assetUrl } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { ArrowUpRightIcon } from '../../components/ui/Icons';

export default function AccountDashboard() {
  const { user, orders } = useAuth();
  const { productsById } = useStore();
  const wishlist = useWishlist();
  const { totals } = useCart();

  const latestOrder = orders[0];
  const defaultAddress = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];
  const savedProducts = wishlist.ids
    .map((id) => productsById[id])
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders placed" value={orders.length} to="/account/orders" />
        <StatCard label="Items saved" value={wishlist.count} to="/wishlist" />
        <StatCard label="In your bag" value={totals.itemCount} to="/cart" />
      </div>

      <section className="rounded-3xl border border-sand-300 bg-sand-50 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Latest order</h2>
          <Link to="/account/orders" className="text-sm underline underline-offset-4">
            All orders
          </Link>
        </div>

        {latestOrder ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-semibold">{latestOrder.id}</p>
                <p className="text-ink-500">Placed {formatDate(latestOrder.placedAt)}</p>
              </div>
              <span className="rounded-full bg-moss-500/15 px-3 py-1 text-xs font-semibold capitalize text-moss-500">
                {latestOrder.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {latestOrder.items.slice(0, 5).map((line) => (
                <img
                  key={line.id}
                  src={assetUrl(line.image)}
                  alt={line.name}
                  className="h-20 w-16 rounded-lg object-cover"
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-ink-500">
                {latestOrder.totals.itemCount} items ·{' '}
                <strong className="text-ink-900">
                  {formatPrice(latestOrder.totals.total, { forceCents: true })}
                </strong>
              </p>
              <Button to={`/account/orders/${latestOrder.id}`} variant="outline" size="sm">
                View details
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-ink-500">You haven't placed an order yet.</p>
            <Button to="/shop" size="sm">
              Start shopping
            </Button>
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-sand-300 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Default address</h2>
            <Link to="/account/addresses" className="text-sm underline underline-offset-4">
              Manage
            </Link>
          </div>
          {defaultAddress ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              <span className="font-medium text-ink-900">
                {defaultAddress.firstName} {defaultAddress.lastName}
              </span>
              <br />
              {defaultAddress.line1}
              {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ''}
              <br />
              {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}
              <br />
              {defaultAddress.country}
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink-500">No address saved yet.</p>
          )}
        </section>

        <section className="rounded-3xl border border-sand-300 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Wishlist</h2>
            <Link
              to="/wishlist"
              className="inline-flex items-center gap-1 text-sm underline underline-offset-4"
            >
              View all <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          {savedProducts.length ? (
            <div className="mt-3 flex gap-2">
              {savedProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="h-24 w-20 overflow-hidden rounded-lg bg-sand-200"
                >
                  <img
                    src={primaryImage(product)}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-500">Nothing saved yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, to }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-sand-300 bg-sand-50 p-5 transition-colors hover:border-ink-900"
    >
      <p className="dnd-eyebrow">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold">{value}</p>
    </Link>
  );
}
