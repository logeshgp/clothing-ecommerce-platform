import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

export function Footer() {
  const { settings, categories } = useStore();
  const [first, ...rest] = (settings.storeName ?? 'DND Store').split(' ');
  const visibility = settings.visibility ?? {};

  if (visibility.footer === false) return null;

  return (
    <footer className="mt-24 border-t border-sand-200 bg-sand-50">
      <div className="dnd-container grid gap-6 border-b border-sand-200 py-10 sm:grid-cols-3">
        <div>
          <p className="text-sm font-semibold">Order direct</p>
          <p className="text-xs text-ink-500">Send a purchase enquiry to the seller on WhatsApp.</p>
        </div>
        <div>
          {visibility.bulkOrder !== false && (
            <>
              <p className="text-sm font-semibold">Wholesale orders welcome</p>
              <p className="text-xs text-ink-500">Ask the seller about quantity pricing and availability.</p>
            </>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold">Clear order confirmation</p>
          <p className="text-xs text-ink-500">Final price, taxes and delivery are confirmed before an order is accepted.</p>
        </div>
      </div>

      <div className="dnd-container grid gap-10 py-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-block font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]"
          >
            {first}
            {rest.length > 0 && <span className="text-clay-500">{rest.join(' ')}</span>}
            <sup className="ml-0.5 text-[10px] font-medium">®</sup>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-ink-500">
            {settings.tagline}
          </p>
        </div>

        <FooterColumn title="Shop">
          <FooterLink to="/shop">All pieces</FooterLink>
          {categories.map((category) => (
            <FooterLink key={category.slug} to={`/shop/${category.slug}`}>
              {category.name}
            </FooterLink>
          ))}
          {visibility.collections !== false && <FooterLink to="/collections">Collections</FooterLink>}
        </FooterColumn>

        <FooterColumn title="Explore">
          {visibility.collections !== false && <FooterLink to="/collections">Collections</FooterLink>}
          {visibility.bulkOrder !== false && <FooterLink to="/bulk-order">Wholesale enquiries</FooterLink>}
          <FooterLink to="/wishlist">Wishlist</FooterLink>
          <FooterLink to="/cart">Bag</FooterLink>
        </FooterColumn>

        <FooterColumn title="Seller information">
          {settings.sellerLegalName && <p className="text-sm text-ink-500">{settings.sellerLegalName}</p>}
          {settings.businessAddress && <p className="whitespace-pre-line text-sm text-ink-500">{settings.businessAddress}</p>}
          {settings.gstin && <p className="text-sm text-ink-500">GSTIN: {settings.gstin}</p>}
          {(settings.grievanceOfficer || settings.grievanceEmail || settings.grievancePhone) && (
            <p className="text-xs text-ink-500">
              Grievance contact: {[settings.grievanceOfficer, settings.grievanceEmail, settings.grievancePhone].filter(Boolean).join(' · ')}
            </p>
          )}
          {settings.supportEmail && <a href={`mailto:${settings.supportEmail}`} className="text-sm text-ink-500 hover:text-ink-900">{settings.supportEmail}</a>}
          <FooterLink to="/privacy">Privacy</FooterLink>
          <FooterLink to="/terms">Terms of sale</FooterLink>
        </FooterColumn>
      </div>

      <div className="dnd-container flex flex-col items-center justify-between gap-3 border-t border-sand-200 py-6 text-xs text-ink-500 sm:flex-row">
        <p>
          © {(settings.storeName ?? 'DND Store').toUpperCase()} {new Date().getFullYear()} — All
          rights reserved.
        </p>
        <p>Order enquiries are sent by you via WhatsApp. No online payment is collected.</p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }) {
  return (
    <div className="space-y-3">
      <p className="dnd-eyebrow">{title}</p>
      <nav className="flex flex-col gap-2">{children}</nav>
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link to={to} className="text-sm text-ink-500 transition-colors hover:text-ink-900">
      {children}
    </Link>
  );
}
