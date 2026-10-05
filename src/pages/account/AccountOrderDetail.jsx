import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { classNames, formatDate, formatPrice } from '../../utils/format';
import { assetUrl } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { CheckIcon } from '../../components/ui/Icons';

const TIMELINE = [
  { id: 'confirmed', label: 'Order confirmed', detail: 'We received your order.' },
  { id: 'packed', label: 'Packed', detail: 'Your pieces are boxed and labelled.' },
  { id: 'shipped', label: 'Shipped', detail: 'Handed to the carrier.' },
  { id: 'delivered', label: 'Delivered', detail: 'Left at your address.' },
];

export default function AccountOrderDetail() {
  const { orderId } = useParams();
  const { getOrder } = useAuth();
  const { settings } = useStore();
  const order = getOrder(orderId);

  if (!order) {
    return (
      <EmptyState title="Order not found." description="This order may belong to another account.">
        <Button to="/account/orders">Back to orders</Button>
      </EmptyState>
    );
  }

  // Derive progress from how long ago the order was placed.
  const daysElapsed = Math.floor((Date.now() - new Date(order.placedAt)) / 86_400_000);
  const currentStage = Math.min(TIMELINE.length - 1, Math.max(0, Math.floor(daysElapsed / 2)));
  const method = settings.shippingMethods?.find((m) => m.id === order.shippingMethod);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/account/orders" className="text-sm underline underline-offset-4">
            ← All orders
          </Link>
          <h2 className="mt-2 text-2xl font-bold">{order.id}</h2>
          <p className="text-sm text-ink-500">Placed {formatDate(order.placedAt)}</p>
        </div>
        <span className="rounded-full bg-moss-500/15 px-3 py-1.5 text-xs font-semibold capitalize text-moss-500">
          {order.status}
        </span>
      </div>

      {/* ------------------------------------------------------ Timeline */}
      <section className="rounded-3xl border border-sand-300 bg-sand-50 p-6">
        <h3 className="text-sm font-semibold">
          {method?.label ?? 'Standard'} delivery — arriving by {formatDate(order.estimatedDelivery)}
        </h3>

        <ol className="mt-5 space-y-5">
          {TIMELINE.map((stage, index) => {
            const done = index <= currentStage;
            const active = index === currentStage;

            return (
              <li key={stage.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={classNames(
                      'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                      done ? 'bg-moss-500 text-white' : 'bg-sand-200 text-ink-500',
                    )}
                  >
                    {done ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  {index < TIMELINE.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={classNames(
                        'mt-1 w-px flex-1',
                        index < currentStage ? 'bg-moss-500' : 'bg-sand-300',
                      )}
                    />
                  )}
                </div>
                <div className="pb-1">
                  <p className={classNames('text-sm', active ? 'font-semibold' : 'font-medium')}>
                    {stage.label}
                  </p>
                  <p className="text-xs text-ink-500">{stage.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* --------------------------------------------------------- Items */}
      <section className="rounded-3xl border border-sand-300 p-6">
        <h3 className="text-lg font-semibold">Items</h3>

        <ul className="mt-4 divide-y divide-sand-200">
          {order.items.map((line) => (
            <li key={line.id} className="flex items-center gap-4 py-4 first:pt-0">
              <Link
                to={`/product/${line.slug}`}
                className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-sand-200"
              >
                <img src={assetUrl(line.image)} alt="" className="h-full w-full object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/product/${line.slug}`} className="block truncate text-sm font-medium">
                  {line.name}
                </Link>
                <p className="text-xs text-ink-500">
                  {line.color} · {line.size} · Qty {line.quantity}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatPrice(line.price * line.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-sand-300 pt-4 text-sm">
          <Row label="Subtotal">{formatPrice(order.totals.subtotal)}</Row>
          {order.totals.festiveDiscount > 0 && (
            <Row
              label={`${order.totals.festiveLabel} (${order.totals.festivePercent}%)`}
              tone="text-clay-500"
            >
              −{formatPrice(order.totals.festiveDiscount)}
            </Row>
          )}
          {order.totals.codeDiscount > 0 && (
            <Row label="Promo" tone="text-moss-500">
              −{formatPrice(order.totals.codeDiscount)}
            </Row>
          )}
          <Row label="Shipping">
            {order.totals.shipping === 0 ? 'Free' : formatPrice(order.totals.shipping)}
          </Row>
          <Row label={`GST (${Math.round(order.totals.taxRate * 100)}%)`}>
            {formatPrice(order.totals.tax)}
          </Row>
          <div className="flex items-baseline justify-between border-t border-sand-300 pt-3">
            <dt className="font-semibold">Total</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatPrice(order.totals.total, { forceCents: true })}
            </dd>
          </div>
        </dl>
      </section>

      {/* ------------------------------------------------------- Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-sand-300 p-5 text-sm">
          <p className="dnd-eyebrow mb-2">Shipping to</p>
          <p className="font-medium">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          </p>
          <p className="mt-1 text-ink-500">
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
            {order.shippingAddress.postalCode}
            <br />
            {order.shippingAddress.country}
          </p>
        </div>

        <div className="rounded-2xl border border-sand-300 p-5 text-sm">
          <p className="dnd-eyebrow mb-2">Payment</p>
          <p className="font-medium">{order.payment.name}</p>
          <p className="mt-1 text-ink-500">Card ending •••• {order.payment.last4}</p>
          <p className="mt-1 text-ink-500">{order.contact.email}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children, tone }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${tone ?? ''}`}>
      <dt className={tone ? '' : 'text-ink-500'}>{label}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  );
}
