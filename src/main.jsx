import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ToastProvider } from './context/ToastContext';
import { StoreProvider } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ToastProvider>
        <StoreProvider>
          <CartProvider>
            <WishlistProvider>
              <RecentlyViewedProvider>
                <App />
              </RecentlyViewedProvider>
            </WishlistProvider>
          </CartProvider>
        </StoreProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
