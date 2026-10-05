import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { isPhone, isRequired } from '../utils/validation';
import { getWhatsAppContacts, openWhatsAppMessage } from '../utils/whatsapp';
import { Button } from '../components/ui/Button';

export default function BulkOrder() {
  const { categories, settings } = useStore();
  const { notify } = useToast();
  const contacts = useMemo(() => getWhatsAppContacts(settings), [settings]);
  const [recipientId, setRecipientId] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', business: '', city: '', quantity: '', note: '' });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!contacts.some((contact) => (contact.id || contact.number) === recipientId)) {
      setRecipientId(contacts[0] ? contacts[0].id || contacts[0].number : '');
    }
  }, [contacts, recipientId]);

  const minQuantity = Math.max(1, Number(settings.bulkDiscount?.minQuantity) || 10);
  const selectedRecipient = contacts.find(
    (contact) => (contact.id || contact.number) === recipientId,
  );

  function submitEnquiry(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!isRequired(form.name)) nextErrors.name = 'Enter your name.';
    if (!isPhone(form.phone)) nextErrors.phone = 'Enter a valid phone number.';
    if (!form.quantity || Number(form.quantity) < minQuantity) {
      nextErrors.quantity = `Enter at least ${minQuantity} pieces.`;
    }
    if (!selectedCategories.length) nextErrors.categories = 'Choose at least one product type.';
    if (!consent) nextErrors.consent = 'Consent is required before sharing your enquiry.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !selectedRecipient) return;

    const lines = [
      `Hello ${settings.storeName || 'Store'}, I would like a wholesale quote.`,
      '',
      `Product types: ${selectedCategories.map((slug) => categories.find((item) => item.slug === slug)?.name || slug).join(', ')}`,
      `Estimated quantity: ${Number(form.quantity)} pieces`,
      `Contact name: ${form.name.trim()}`,
      `Phone / WhatsApp: ${form.phone.trim()}`,
      ...(form.business.trim() ? [`Business: ${form.business.trim()}`] : []),
      ...(form.city.trim() ? [`City: ${form.city.trim()}`] : []),
      ...(form.note.trim() ? ['', `Additional details: ${form.note.trim()}`] : []),
      '',
      'Please confirm availability, wholesale pricing, applicable taxes and delivery options.',
    ];
    openWhatsAppMessage(selectedRecipient.number, lines.join('\n'));
    notify('Review the WhatsApp draft and tap Send to share your enquiry.', { tone: 'success' });
  }

  return (
    <main className="dnd-container py-12 sm:py-16">
      <header className="max-w-3xl border-b border-sand-300 pb-8">
        <p className="dnd-eyebrow">For shops, teams and resellers</p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Wholesale enquiries</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-500">
          Tell us which styles and quantities you need. The seller will confirm stock, quote and delivery directly with you.
        </p>
        {settings.bulkDiscount?.active && (
          <p className="mt-4 text-sm font-medium text-moss-500">
            {settings.bulkDiscount.label || 'Wholesale pricing'} may be available for orders of {minQuantity} or more pieces. Final pricing is confirmed by the seller.
          </p>
        )}
      </header>

      <form onSubmit={submitEnquiry} noValidate className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="space-y-7">
          <fieldset>
            <legend className="dnd-label">Product types</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <label key={category.slug} className="flex cursor-pointer items-center gap-3 border border-sand-300 bg-sand-50 px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.slug)}
                    onChange={(event) => setSelectedCategories((current) => event.target.checked
                      ? [...current, category.slug]
                      : current.filter((slug) => slug !== category.slug))}
                  />
                  {category.name}
                </label>
              ))}
            </div>
            {errors.categories && <p role="alert" className="mt-2 text-xs text-berry-500">{errors.categories}</p>}
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Estimated quantity" error={errors.quantity}>
              <input className="dnd-field" type="number" min={minQuantity} step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
            </Field>
            <Field label="Your name" error={errors.name}>
              <input className="dnd-field" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </Field>
            <Field label="Phone / WhatsApp" error={errors.phone}>
              <input className="dnd-field" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
            </Field>
            <Field label="Business name (optional)">
              <input className="dnd-field" autoComplete="organization" value={form.business} onChange={(event) => setForm({ ...form, business: event.target.value })} />
            </Field>
            <Field label="City (optional)">
              <input className="dnd-field" autoComplete="address-level2" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            </Field>
          </div>

          <Field label="Sizes, colours or other details (optional)">
            <textarea className="dnd-field min-h-28 resize-y" maxLength={500} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          </Field>

          {contacts.length > 0 && (
            <fieldset>
              <legend className="dnd-label">Send enquiry to</legend>
              <div className="flex flex-wrap gap-3">
                {contacts.map((contact) => {
                  const id = contact.id || contact.number;
                  return (
                    <label key={id} className="flex cursor-pointer items-center gap-2 border border-sand-300 bg-sand-50 px-4 py-3 text-sm">
                      <input type="radio" name="whatsapp-contact" value={id} checked={recipientId === id} onChange={() => setRecipientId(id)} />
                      WhatsApp · {contact.label || 'Store'}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div>
            <label className="flex items-start gap-3 text-xs leading-relaxed text-ink-700">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-ink-900)]" />
              <span>
                I agree to share the details above with the selected seller contact through WhatsApp so they can respond to this wholesale enquiry. Read the{' '}
                <Link to="/privacy" className="underline underline-offset-2">privacy notice</Link>.
              </span>
            </label>
            {errors.consent && <p role="alert" className="mt-2 text-xs text-berry-500">{errors.consent}</p>}
          </div>

          {contacts.length ? (
            <Button type="submit" size="lg">Prepare WhatsApp enquiry</Button>
          ) : (
            <p role="status" className="border border-sand-300 bg-sand-50 p-4 text-sm text-ink-500">
              WhatsApp ordering is not configured yet. Please check back after the store contact is published.
            </p>
          )}
          <p className="text-xs leading-relaxed text-ink-500">
            WhatsApp opens with a draft. Review the recipient and message, then press Send. No payment is collected on this website.
          </p>
        </section>

        <aside className="h-fit border-l-2 border-clay-400 pl-5 text-sm leading-relaxed text-ink-500">
          <p className="font-semibold text-ink-900">How wholesale requests work</p>
          <ol className="mt-3 list-inside list-decimal space-y-2">
            <li>Share product types and quantities.</li>
            <li>Choose a store WhatsApp contact.</li>
            <li>Review and send your message.</li>
            <li>The seller confirms the quote and delivery details.</li>
          </ol>
        </aside>
      </form>
    </main>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="dnd-label">{label}</span>
      {children}
      {error && <span role="alert" className="block text-xs text-berry-500">{error}</span>}
    </label>
  );
}