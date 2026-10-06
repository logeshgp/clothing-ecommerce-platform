import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useStore } from '../../context/StoreContext';
import { IconButton } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { CloseIcon } from '../ui/Icons';

export function MobileNav({ open, onClose }) {
  const wishlist = useWishlist();
  const { categories, settings } = useStore();
  const location = useLocation();
  const visibility = settings.visibility ?? {};

  // Close the menu whenever navigation happens.
  useEffect(() => {
    onClose();

  }, [location.pathname, location.search]);

  const [first, ...rest] = (settings.storeName ?? 'DND Store').split(' ');

  return (
    <Drawer open={open} onClose={onClose} side="left" label="Site navigation">
      <header className="flex items-center justify-between border-b border-sand-200 px-6 py-5">
        <span className="font-[family-name:var(--font-display)] text-lg font-bold">
          {first}
          {rest.length > 0 && <span className="text-clay-500">{rest.join(' ')}</span>}
        </span>
        <IconButton label="Close menu" onClick={onClose}>
          <CloseIcon className="h-5 w-5" />
        </IconButton>
      </header>

      <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto px-6 py-6">
        <p className="dnd-eyebrow mb-3">Shop</p>
        <ul className="space-y-1">
          <li>
            <MobileLink to="/shop">All pieces</MobileLink>
          </li>
          {visibility.newArrivals !== false && <li>
            <MobileLink to="/shop?category=new">New arrivals</MobileLink>
          </li>}
          {categories.map((category) => (
            <li key={category.slug}>
              <MobileLink to={`/shop/${category.slug}`}>{category.name}</MobileLink>
            </li>
          ))}
        </ul>

        <p className="dnd-eyebrow mb-3 mt-8">Discover</p>
        <ul className="space-y-1">
          {visibility.collections !== false && <li>
            <MobileLink to="/collections">Collections</MobileLink>
          </li>}
          {visibility.bulkOrder !== false && <li>
            <MobileLink to="/bulk-order">Wholesale orders</MobileLink>
          </li>}
          <li>
            <MobileLink to="/wishlist">Wishlist ({wishlist.count})</MobileLink>
          </li>
          <li>
            <MobileLink to="/cart">Bag</MobileLink>
          </li>
          <li>
            <MobileLink to="/feedback">Share feedback</MobileLink>
          </li>
        </ul>

        <p className="dnd-eyebrow mb-3 mt-8">Orders</p>
        <p className="text-sm leading-relaxed text-ink-500">
          Purchase enquiries are confirmed directly with the seller on WhatsApp.
        </p>
      </nav>

      <footer className="border-t border-sand-200 px-6 py-5 text-xs text-ink-500">
        {settings.tagline}
      </footer>
    </Drawer>
  );
}

function MobileLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-xl px-3 py-2.5 text-base transition-colors ${
          isActive ? 'bg-ink-900 text-sand-100' : 'hover:bg-sand-100'
        }`
      }
    >
      {children}
    </NavLink>
  );
}
