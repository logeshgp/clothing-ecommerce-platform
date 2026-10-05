import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [ids, setIds] = useLocalStorage('dnd.wishlist.v1', []);

  const toggle = useCallback(
    (productId) => {
      let added = false;
      setIds((current) => {
        if (current.includes(productId)) return current.filter((id) => id !== productId);
        added = true;
        return [...current, productId];
      });
      return added;
    },
    [setIds],
  );

  const value = useMemo(
    () => ({
      ids,
      count: ids.length,
      has: (productId) => ids.includes(productId),
      toggle,
      remove: (productId) => setIds((current) => current.filter((id) => id !== productId)),
      clear: () => setIds([]),
    }),
    [ids, toggle, setIds],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
}
