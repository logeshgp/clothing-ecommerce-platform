import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { formatDate, formatPrice } from '../utils/format';
import { assetUrl } from '../api/client';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { CheckIcon, PackageIcon, TruckIcon } from '../components/ui/Icons';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { settings } = useStore();

  const [order, setOrder] = useState(location.state?.order ?? null);
  const [status, setStatus] = useState(location.state?.order ? 'ready' : 'loading');
  const messaging = location.state?.messaging ?? null;

  useEffect(() => {
    if (order) return;

    let cancelled = false;
    // Guests can still see their receipt by quoting the order email.
    const email = new URLSearchParams(location.search).get('email') ?? undefined;

    api
      .order(orderId, email)
      .then((data) => {
        if (cancelled) return;
        setOrder(data.order);
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));

    return () => {
      cancelled = true;
    };
  }, [orderId, order, location.search]);

  if (status === 'loading') {
    return (
      <div className="dnd-container py-16">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="mx-auto h-14 w-14 rounded-full" />
          <Skeleton className="mx-auto h-10 w-64" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (status === 'error' || !order) {
    return (
      <div className="dnd-container py-20">
        <EmptyState
          title="We couldn't find that order."
          description="Check the link, or view your order history if you're signed in."
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Button to={isAuthenticated ? '/account/orders' : '/login'}>View orders</Button>
            <Button to="/shop" variant="outline">
              Continue shopping
            </Button>
          </div>
        </EmptyState>
      </div>
    );
  }

  const method = settings.shippingMethods?.find((m) => m.id === order.shippingMethod);
  const customerNotified = messaging?.customer?.ok;
  const ownerNotified = messaging?.owner?.ok;

  return (
    <div className="dnd-container py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-moss-500 text-white">
            <CheckIcon className="h-7 w-7" />
          </span>
          <div className="space-y-2">
            <p className="dnd-eyebrow">Order {order.id}</p>
            <h1 className="text-4xl font-bold sm:text-5xl">Thank you.</h1>
            <p className="text-sm text-ink-500">
              A confirmation is on its way to{' '}
              <strong className="text-ink-900">{order.contact.email}</strong>.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <InfoCard icon={PackageIcon} title="Order placed">
            {formatDate(order.placedAt, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </InfoCard>
          <InfoCard icon={TruckIcon} title={`${method?.label ?? 'Standard'} delivery`}>
            Arriving by {formatDate(order.estimatedDelivery)}
          </InfoCard>
        </div>

        {(customerNotified || ownerNotified) && (
          <div className="mt-6 rounded-2xl border border-moss-500/30 bg-moss-500/10 p-5">
            <p className="text-sm font-semibold text-moss-500">WhatsApp confirmation sent</p>
            <p className="mt-1 text-xs text-ink-500">
              {customerNotified && `A summary was sent to ${order.contact.phone}. `}
              {ownerNotified && 'Our team has been notified and will start packing.'}
            </p>
          </div>
        )}

        <section className="mt-8 rounded-3xl border border-sand-300 bg-sand-50 p-6">
          <h2 className="text-lg font-semibold">Your order</h2>

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
            <SummaryRow label="Subtotal">{formatPrice(order.totals.subtotal)}</SummaryRow>
            {order.totals.festiveDiscount > 0 && (
              <SummaryRow
                label={`${order.totals.festiveLabel} (${order.totals.festivePercent}%)`}
                tone="text-clay-500"
              >
                −{formatPrice(order.totals.festiveDiscount)}
              </SummaryRow>
            )}
            {order.totals.codeDiscount > 0 && (
              <SummaryRow
                label={`Promo${order.promo ? ` (${order.promo.code})` : ''}`}
                tone="text-moss-500"
              >
                −{formatPrice(order.totals.codeDiscount)}
              </SummaryRow>
            )}
            <SummaryRow label="Shipping">
              {order.totals.shipping === 0 ? 'Free' : formatPrice(order.totals.shipping)}
            </SummaryRow>
            <SummaryRow label={`GST (${Math.round(order.totals.taxRate * 100)}%)`}>
              {formatPrice(order.totals.tax)}
            </SummaryRow>
            <div className="flex items-baseline justify-between border-t border-sand-300 pt-3">
              <dt className="font-semibold">Total paid</dt>
              <dd className="text-lg font-semibold tabular-nums">
                {formatPrice(order.totals.total, { forceCents: true })}
              </dd>
            </div>
          </dl>
        </section>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
            <p className="font-medium capitalize">
              {order.payment.method ?? 'card'}
              {order.payment.last4 ? ` •••• ${order.payment.last4}` : ''}
            </p>
            <p className="mt-1 text-ink-500">via {order.payment.provider}</p>
            <p className="mt-1 break-all text-xs text-ink-500">Ref: {order.payment.reference}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button to="/shop">Continue shopping</Button>
          {isAuthenticated && (
            <Button to="/account/orders" variant="outline">
              View order history
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-sand-300 bg-sand-50 p-5">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-clay-500" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-ink-500">{children}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, children, tone }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${tone ?? ''}`}>
      <dt className={tone ? '' : 'text-ink-500'}>{label}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  );
}
