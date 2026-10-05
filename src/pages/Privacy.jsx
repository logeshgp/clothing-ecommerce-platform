import { useStore } from '../context/StoreContext';

export default function Privacy() {
  const { settings } = useStore();
  const grievance = [settings.grievanceOfficer, settings.grievanceEmail, settings.grievancePhone]
    .filter(Boolean);

  return (
    <main className="dnd-container max-w-4xl py-12 sm:py-16">
      <p className="dnd-eyebrow">Your information</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Privacy notice</h1>
      <p className="mt-4 text-sm text-ink-500">Last updated: {new Date().toLocaleDateString('en-IN')}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-700">
        <section>
          <h2 className="text-xl font-semibold text-ink-900">Who handles your information</h2>
          <p className="mt-2">{settings.sellerLegalName || settings.storeName} operates this storefront.</p>
          {settings.businessAddress && <p className="mt-1 whitespace-pre-line">{settings.businessAddress}</p>}
          {settings.gstin && <p className="mt-1">GSTIN: {settings.gstin}</p>}
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink-900">What is shared</h2>
          <p className="mt-2">
            When you prepare a purchase enquiry, the page uses the name, phone number, selected items, quantity and optional note you enter to create a WhatsApp draft. Nothing is sent to the seller until you review that draft and press Send in WhatsApp. WhatsApp then handles the message under its own terms and privacy practices.
          </p>
          <p className="mt-2">
            This storefront does not collect payment credentials or accept payment. If you choose to use account or support features, the information you submit there is processed by the store service to provide those features.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink-900">Why information is used</h2>
          <p className="mt-2">
            Enquiry details are used to answer your product, availability, quote and delivery questions. The seller should use the information only for the purpose explained here and follow applicable Indian data-protection requirements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink-900">Your choices and requests</h2>
          <p className="mt-2">
            You can edit or clear the WhatsApp draft before sending it. For access, correction, erasure, withdrawal of consent or a privacy concern about information already shared with the store, contact the seller using the details below. Withdrawal does not undo processing that happened before the request.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink-900">Contact and grievance handling</h2>
          {grievance.length ? (
            <p className="mt-2">{grievance.join(' · ')}</p>
          ) : (
            <p className="mt-2">Contact {settings.supportEmail || 'the store owner'} to raise a privacy concern. The store owner must publish the applicable grievance contact before launch.</p>
          )}
        </section>

        <p className="border-t border-sand-300 pt-5 text-xs text-ink-500">
          This notice describes this demo storefront’s current data flow. The seller must review it against the live services, retention practices and applicable law before accepting customer enquiries.
        </p>
      </div>
    </main>
  );
}
