import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useStore } from '../../context/StoreContext';
import { classNames } from '../../utils/format';
import { IconButton } from '../ui/Button';
import { SearchModal } from './SearchModal';
import { MobileNav } from './MobileNav';
import { BagIcon, HeartIcon, MenuIcon, SearchIcon } from '../ui/Icons';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  const { totals, openCart } = useCart();
  const wishlist = useWishlist();
  const { activeAnnouncements, categories, settings } = useStore();
  const navigate = useNavigate();
  const visibility = settings.visibility ?? {};

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (activeAnnouncements.length < 2) return undefined;
    const timer = setInterval(
      () => setAnnouncementIndex((i) => (i + 1) % activeAnnouncements.length),
      5000,
    );
    return () => clearInterval(timer);
  }, [activeAnnouncements.length]);

  // Cmd/Ctrl + K opens search, matching the convention shoppers expect.
  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const announcement = activeAnnouncements[announcementIndex % (activeAnnouncements.length || 1)];
  const [first, ...rest] = (settings.storeName ?? 'DND Store').split(' ');

  return (
    <>
      {visibility.announcements !== false && announcement && (
        <div className="bg-ink-900 px-4 py-2.5 text-center text-[11px] font-medium tracking-[0.08em] text-sand-100">
          <span key={announcement.id} className="inline-block animate-fade-up">
            {announcement.text}
          </span>
        </div>
      )}

      <header
        className={classNames(
          'sticky top-0 z-50 border-b transition-all duration-300',
          scrolled
            ? 'border-sand-200 bg-sand-100/92 backdrop-blur-md'
            : 'border-transparent bg-sand-100',
        )}
      >
        <div className="dnd-container flex h-16 items-center justify-between gap-4 lg:h-18">
          <div className="flex items-center gap-2">
            <IconButton label="Open menu" onClick={() => setMenuOpen(true)} className="lg:hidden">
              <MenuIcon className="h-5 w-5" />
            </IconButton>

            <Link
              to="/"
              aria-label={`${settings.storeName} home`}
              className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[-0.03em] sm:text-xl"
            >
              {first}
              {rest.length > 0 && <span className="text-clay-500">{rest.join(' ')}</span>}
              <sup className="ml-0.5 text-[9px] font-medium">®</sup>
            </Link>
          </div>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {visibility.newArrivals !== false && <NavLink to="/shop?category=new" className={navLinkClass}>
              New
            </NavLink>}
            {categories.map((category) => (
              <NavLink key={category.slug} to={`/shop/${category.slug}`} className={navLinkClass}>
                {category.name}
              </NavLink>
            ))}
            {visibility.collections !== false && <NavLink to="/collections" className={navLinkClass}>
              Collections
            </NavLink>}
            {visibility.bulkOrder !== false && <NavLink to="/bulk-order" className={navLinkClass}>
              Bulk orders
            </NavLink>}
          </nav>

          <div className="flex items-center gap-0.5">
            <IconButton label="Search products" onClick={() => setSearchOpen(true)}>
              <SearchIcon className="h-5 w-5" />
            </IconButton>

            <IconButton
              label="Wishlist"
              onClick={() => navigate('/wishlist')}
              className="relative max-sm:hidden"
            >
              <HeartIcon filled={wishlist.count > 0} className="h-5 w-5" />
              {wishlist.count > 0 && <Indicator count={wishlist.count} />}
            </IconButton>

            <button
              type="button"
              onClick={openCart}
              className="ml-1 inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2.5 text-sm font-medium text-sand-100 transition-transform duration-200 active:scale-95"
            >
              <BagIcon className="h-4 w-4" />
              <span className="max-sm:sr-only">Bag</span>
              <span className="min-w-4 rounded-full bg-sand-100/20 px-1.5 text-xs tabular-nums">
                {totals.itemCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function navLinkClass({ isActive }) {
  return classNames(
    'rounded-full px-3.5 py-2 text-sm transition-colors duration-200',
    isActive ? 'bg-ink-900 text-sand-100' : 'text-ink-700 hover:bg-ink-900/6',
  );
}

function Indicator({ count }) {
  return (
    <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-berry-500 px-1 text-[10px] font-semibold text-white">
      {count}
    </span>
  );
}
