import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import SearchResults from './pages/SearchResults';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import BulkOrder from './pages/BulkOrder';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import Terms from './pages/Terms';

/**
 * Storefront routes only.
 *
 * The admin and support consoles are a separate application (see `console/`)
 * served from their own origin, so no staff code ships in this bundle.
 */
export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />

        <Route path="shop" element={<Catalog />} />
        <Route path="shop/:category" element={<Catalog />} />
        <Route path="product/:slug" element={<ProductDetail />} />

        <Route path="collections" element={<Collections />} />
        <Route path="collections/:slug" element={<CollectionDetail />} />

        <Route path="search" element={<SearchResults />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="bulk-order" element={<BulkOrder />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
