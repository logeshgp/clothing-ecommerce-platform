import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/format';
import { CloseIcon } from '../ui/Icons';

/** Totals panel shared by the cart page and checkout. */
export function OrderSummary({ showPromo = true, children }) {
  const { totals, promo, applyPromo, removePromo } = useCart();
  const { notify } = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function handleApply(event) {
    event.preventDefault();
    const result = applyPromo(code);
    if (result.ok) {
      setCode('');
      setError('');
      notify(`${result.promo.code} applied — ${result.promo.description}.`, { tone: 'success' });
    } else {
      setError(result.reason);
    }
  }

  return (
    <div className="space-y-5 rounded-3xl border border-sand-300 bg-sand-50 p-6">
      <h2 className="text-lg font-semibold">Order summary</h2>

      {totals.festiveDiscount > 0 && (
        <div className="rounded-xl bg-clay-400/15 px-3.5 py-2.5">
          <p className="text-sm font-semibold text-clay-500">
            {totals.festiveLabel} — {totals.festivePercent}% off
          </p>
          <p className="text-xs text-ink-500">Applied automatically to your order.</p>
        </div>
      )}

      {totals.bulkDiscount > 0 && (
        <div className="rounded-xl bg-moss-500/10 px-3.5 py-2.5">
          <p className="text-sm font-semibold text-moss-500">
            {totals.bulkLabel} — {totals.bulkPercent}% off
          </p>
          <p className="text-xs text-ink-500">Applied to this quantity.</p>
        </div>
      )}

      {showPromo && (
        <div className="space-y-2">
          {promo ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-moss-500/10 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-moss-500">{promo.code}</p>
                <p className="truncate text-xs text-ink-500">{promo.description}</p>
              </div>
              <button
                type="button"
                onClick={removePromo}
                aria-label={`Remove promo code ${promo.code}`}
                className="shrink-0 text-ink-500 hover:text-berry-500"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleApply} className="space-y-1.5">
              <label htmlFor="promo-code" className="dnd-label mb-0">
                Promo code
              </label>
              <div className="flex gap-2">
                <input
                  id="promo-code"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setError('');
                  }}
                  placeholder="Enter a code shared by the store"
                  aria-invalid={Boolean(error)}
                  className="dnd-field flex-1 uppercase"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-xl border border-ink-900/20 px-4 text-sm font-medium transition-colors hover:border-ink-900 hover:bg-ink-900/5"
                >
                  Apply
                </button>
              </div>
              {error && <p className="text-xs text-berry-500">{error}</p>}
            </form>
          )}
        </div>
      )}

      <dl className="space-y-2 border-t border-sand-200 pt-4 text-sm">
        <Row label={`Subtotal (${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'items'})`}>
          {formatPrice(totals.subtotal)}
        </Row>

        {totals.bulkDiscount > 0 && (
          <Row label={`${totals.bulkLabel} (${totals.bulkPercent}%)`} tone="text-moss-500">
            −{formatPrice(totals.bulkDiscount)}
          </Row>
        )}

        {totals.festiveDiscount > 0 && (
          <Row label={`${totals.festiveLabel} (${totals.festivePercent}%)`} tone="text-clay-500">
            −{formatPrice(totals.festiveDiscount)}
          </Row>
        )}

        {totals.codeDiscount > 0 && (
          <Row label={`Promo${promo ? ` (${promo.code})` : ''}`} tone="text-moss-500">
            −{formatPrice(totals.codeDiscount)}
          </Row>
        )}

        <div className="flex items-baseline justify-between border-t border-sand-300 pt-3">
          <dt className="text-base font-semibold">Merchandise estimate</dt>
          <dd className="text-xl font-semibold tabular-nums">
            {formatPrice(totals.total)}
          </dd>
        </div>
      </dl>
      <p className="text-xs leading-relaxed text-ink-500">
        Delivery charges and applicable taxes are confirmed by the seller before your order is
        accepted. No payment is collected on this website.
      </p>

      {children}
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
