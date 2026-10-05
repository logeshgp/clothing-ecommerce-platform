import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatPrice } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ChevronRightIcon } from '../../components/ui/Icons';

export default function AccountOrders() {
  const { orders } = useAuth();

  if (!orders.length) {
    return (
      <EmptyState
        mark="▢"
        title="No orders yet."
        description="When you place an order it will appear here with tracking details."
      >
        <Button to="/shop">Start shopping</Button>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Order history</h2>

      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              to={`/account/orders/${order.id}`}
              className="flex items-center gap-4 rounded-2xl border border-sand-300 bg-sand-50 p-5 transition-colors hover:border-ink-900"
            >
              <div className="flex -space-x-3">
                {order.items.slice(0, 3).map((line) => (
                  <img
                    key={line.id}
                    src={line.image}
                    alt=""
                    className="h-16 w-13 rounded-lg border-2 border-sand-50 object-cover"
                  />
                ))}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{order.id}</p>
                <p className="text-xs text-ink-500">
                  {formatDate(order.placedAt)} · {order.totals.itemCount}{' '}
                  {order.totals.itemCount === 1 ? 'item' : 'items'}
                </p>
                <span className="mt-1.5 inline-block rounded-full bg-moss-500/15 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-moss-500">
                  {order.status}
                </span>
              </div>

              <div className="shrink-0 text-right">
                <p className="font-semibold tabular-nums">
                  {formatPrice(order.totals.total, { forceCents: true })}
                </p>
                <p className="text-xs text-ink-500">
                  Arrives {formatDate(order.estimatedDelivery, { month: 'short', day: 'numeric' })}
                </p>
              </div>

              <ChevronRightIcon className="h-5 w-5 shrink-0 text-ink-500" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
