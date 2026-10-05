import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { BannerPopup } from './BannerPopup';
import { CartDrawer } from '../cart/CartDrawer';
import { Toaster } from '../ui/Toaster';
import { Button } from '../ui/Button';

export function Layout() {
  const { pathname } = useLocation();
  const { status, error, reload, demoMode } = useStore();

  // Restore scroll position on navigation — routers don't do this for you.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
        <p className="dnd-eyebrow">Connection problem</p>
        <h1 className="max-w-md text-3xl font-bold">We can't reach the store right now.</h1>
        <p className="max-w-sm text-sm text-ink-500">{error}</p>
        <p className="max-w-sm text-xs text-ink-500">
          If you're running this locally, start the API with <code>npm run dev:api</code>.
        </p>
        <Button onClick={reload}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-ink-900 focus:px-5 focus:py-3 focus:text-sm focus:text-sand-100"
      >
        Skip to content
      </a>

      <Header />

      {demoMode && (
        <p role="status" className="bg-sand-200 px-4 py-2 text-center text-xs text-ink-700">
          Preview catalog is shown. Configure the store API and WhatsApp contacts before taking live enquiries.
        </p>
      )}

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <CartDrawer />
      <BannerPopup />
      <Toaster />
    </div>
  );
}
