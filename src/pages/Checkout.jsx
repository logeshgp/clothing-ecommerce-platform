import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import { isPhone, isRequired } from '../utils/validation';
import { getWhatsAppContacts, openWhatsAppMessage } from '../utils/whatsapp';
import { buildGooglePayDemoUrl, DEMO_UPI_ID } from '../utils/upi';
import { OrderSummary } from '../components/cart/OrderSummary';
import { Button } from '../components/ui/Button';

export default function Checkout() {
  const { selectedItems, totals } = useCart();
  const { settings } = useStore();
  const { notify } = useToast();
  const [customer, setCustomer] = useState({ name: '', phone: '', note: '' });
  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);

  const recipients = useMemo(() => getWhatsAppContacts(settings), [settings]);

  if (!selectedItems.length) return <Navigate to="/cart" replace />;

  function buildMessage() {
    const lines = [
      `Hello ${settings.storeName || 'Store'}, I would like to enquire about placing an order.`,
      '',
      '*Items requested*',
      ...selectedItems.map(
        (item, index) =>
          `${index + 1}. ${item.name} — ${item.color}, size ${item.size} × ${item.quantity} = ${formatPrice(item.price * item.quantity)}`,
      ),
      '',
      `Merchandise subtotal: ${formatPrice(totals.subtotal)}`,
    ];

    if (totals.bulkDiscount > 0) {
      lines.push(`${totals.bulkLabel} (${totals.bulkPercent}%): -${formatPrice(totals.bulkDiscount)}`);
    }
    if (totals.festiveDiscount > 0) {
      lines.push(`${totals.festiveLabel} (${totals.festivePercent}%): -${formatPrice(totals.festiveDiscount)}`);
    }
    if (totals.codeDiscount > 0) {
      lines.push(`Promo discount: -${formatPrice(totals.codeDiscount)}`);
    }

    lines.push(
      `Estimated merchandise amount: ${formatPrice(totals.total)}`,
      'Please confirm availability, final price, applicable taxes and delivery charges.',
      '',
      `Customer: ${customer.name.trim()}`,
      `Contact: ${customer.phone.trim()}`,
    );
    if (customer.note.trim()) lines.push(`Note: ${customer.note.trim()}`);

    return lines.join('\n');
  }

  function handleWhatsApp(contact) {
    const nextErrors = {};
    if (!isRequired(customer.name)) nextErrors.name = 'Enter your name.';
    if (!isPhone(customer.phone)) nextErrors.phone = 'Enter a valid phone number.';
    if (!consent) nextErrors.consent = 'Consent is required before sharing your enquiry.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    openWhatsAppMessage(contact.number, buildMessage());
    notify('Review the WhatsApp draft and tap Send to share your enquiry.', { tone: 'success' });
  }

  function openDemoGooglePay() {
    if (totals.total <= 0) {
      notify('A positive amount is required to open the UPI demo.', { tone: 'error' });
      return;
    }

    window.location.assign(buildGooglePayDemoUrl({
      amount: totals.total,
      payeeName: settings.storeName,
      transactionNote: `Demo checkout for ${totals.itemCount} items`,
    }));
  }

  return (
    <div className="dnd-container py-10">
      <header className="flex flex-wrap items-center justify-between gap-6 border-b border-sand-200 pb-8">
        <div>
          <p className="dnd-eyebrow">Purchase enquiry</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Let’s talk about your order.</h1>
        </div>
        <Link to="/cart" className="text-sm font-medium underline underline-offset-4">
          ← Back to bag
        </Link>
      </header>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_22rem] xl:gap-16">
        <div className="space-y-8">
          <section className="rounded-3xl border border-sand-300 bg-sand-50 p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Your contact details</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              WhatsApp enquiries do not collect payment. You can also open the separate UPI demo
              below; it uses a placeholder ID and does not process or verify a transaction.
            </p>

            <form
              className="mt-6 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (recipients[0]) handleWhatsApp(recipients[0]);
              }}
            >
              <div>
                <label className="dnd-label" htmlFor="customer-name">Your name</label>
                <input
                  id="customer-name"
                  autoComplete="name"
                  className="dnd-field"
                  value={customer.name}
                  onChange={(event) => setCustomer({ ...customer, name: event.target.value })}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'customer-name-error' : undefined}
                />
                {errors.name && <p id="customer-name-error" className="mt-1 text-sm text-berry-500">{errors.name}</p>}
              </div>
              <div>
                <label className="dnd-label" htmlFor="customer-phone">Phone / WhatsApp number</label>
                <input
                  id="customer-phone"
                  type="tel"
                  autoComplete="tel"
                  className="dnd-field"
                  placeholder="+91 98765 43210"
                  value={customer.phone}
                  onChange={(event) => setCustomer({ ...customer, phone: event.target.value })}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'customer-phone-error' : undefined}
                />
                {errors.phone && <p id="customer-phone-error" className="mt-1 text-sm text-berry-500">{errors.phone}</p>}
              </div>
              <div>
                <label className="dnd-label" htmlFor="customer-note">Order note (optional)</label>
                <textarea
                  id="customer-note"
                  className="dnd-field min-h-24 resize-y"
                  maxLength={400}
                  value={customer.note}
                  onChange={(event) => setCustomer({ ...customer, note: event.target.value })}
                  placeholder="Anything the seller should know?"
                />
              </div>
              <p className="text-xs leading-relaxed text-ink-500">
                Selecting a WhatsApp option opens a pre-filled draft. Check the recipient and
                message, then press Send in WhatsApp. Your details are shared only if you send it.
              </p>

              <label className="flex items-start gap-3 text-xs leading-relaxed text-ink-700">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-ink-900)]"
                  aria-describedby={errors.consent ? 'whatsapp-consent-error' : undefined}
                />
                <span>
                  I agree to share my name, phone number and selected items with the chosen store
                  contact through WhatsApp so they can respond to this enquiry. See the{' '}
                  <Link to="/privacy" className="underline underline-offset-2">
                    privacy notice
                  </Link>
                  .
                </span>
              </label>
              {errors.consent && (
                <p id="whatsapp-consent-error" role="alert" className="-mt-3 text-sm text-berry-500">
                  {errors.consent}
                </p>
              )}

              {recipients.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {recipients.map((contact) => (
                    <Button
                      key={contact.id || contact.number}
                      type="button"
                      size="lg"
                      onClick={() => handleWhatsApp(contact)}
                    >
                      {recipients.length > 1 ? `WhatsApp · ${contact.label}` : 'Open WhatsApp to send'}
                    </Button>
                  ))}
                </div>
              ) : (
                <div role="status" className="rounded-2xl bg-sand-200 p-4 text-sm text-ink-700">
                  WhatsApp ordering is temporarily unavailable. Please contact the store using the
                  details in the footer.
                </div>
              )}

              <div className="space-y-3 border-t border-sand-200 pt-5">
                <div>
                  <h3 className="font-semibold">Try UPI checkout (demo)</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">
                    Opens Google Pay with the estimated selected-item amount ({formatPrice(totals.total)})
                    and placeholder UPI ID <code>{DEMO_UPI_ID}</code>. This demo recipient is not a
                    real store account. No payment is processed, confirmed or recorded, and the
                    amount excludes any taxes or delivery charges the seller may later confirm.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  full
                  disabled={totals.total <= 0}
                  onClick={openDemoGooglePay}
                >
                  Open Google Pay · UPI demo
                </Button>
              </div>
            </form>
          </section>

          {settings.bulkDiscount?.active && settings.visibility?.bulkOrder !== false && (
            <aside className="rounded-2xl border border-moss-500/30 bg-moss-500/10 p-5">
              <p className="font-semibold text-moss-500">Wholesale orders welcome</p>
              <p className="mt-1 text-sm text-ink-700">
                {settings.bulkDiscount.percent}% merchandise discount on orders of{' '}
                {settings.bulkDiscount.minQuantity} or more pieces. Bulk availability and final
                pricing are confirmed by the seller.
              </p>
            </aside>
          )}
        </div>

        <aside className="lg:sticky lg:top-28">
          <OrderSummary showPromo />
        </aside>
      </div>
    </div>
  );
}
