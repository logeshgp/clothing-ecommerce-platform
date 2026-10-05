import { useStore } from '../context/StoreContext';

export default function Terms() {
  const { settings } = useStore();
  return (
    <article className="dnd-container max-w-3xl py-14">
      <p className="dnd-eyebrow">Terms of sale</p>
      <h1 className="mt-2 text-4xl font-bold">How ordering works</h1>
      <p className="mt-6 text-sm leading-7 text-ink-700">
        Product pages show the listed merchandise price and current product information. Adding
        items to your bag does not place an order. When you choose WhatsApp, your browser opens a
        message draft; you review and send it yourself. The seller must confirm product availability,
        the final price, any applicable taxes, delivery charges and delivery terms before accepting
        the order. No payment is collected on this website.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Wholesale enquiries</h2>
      <p className="mt-3 text-sm leading-7 text-ink-700">
        Quantity discounts displayed on the site are indicative. The seller confirms the eligible
        quantity, stock and final wholesale quote directly with the buyer.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Seller details and support</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink-700">
        {[
          settings.sellerLegalName,
          settings.businessAddress,
          settings.gstin && `GSTIN: ${settings.gstin}`,
          settings.grievanceOfficer && `Grievance officer: ${settings.grievanceOfficer}`,
          settings.grievanceEmail && `Email: ${settings.grievanceEmail}`,
          settings.grievancePhone && `Phone: ${settings.grievancePhone}`,
        ].filter(Boolean).join('\n') || 'Seller contact details are being updated.'}
      </p>
      <p className="mt-8 text-xs leading-relaxed text-ink-500">
        The seller should have these terms and disclosures reviewed for the business and applicable
        Indian laws before accepting orders.
      </p>
    </article>
  );
}
