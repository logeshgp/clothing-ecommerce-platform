import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const RecentlyViewedContext = createContext(null);
const MAX_ITEMS = 8;

export function RecentlyViewedProvider({ children }) {
  const [ids, setIds] = useLocalStorage('dnd.recentlyViewed.v1', []);

  const record = useCallback(
    (productId) => {
      setIds((current) => [productId, ...current.filter((id) => id !== productId)].slice(0, MAX_ITEMS));
    },
    [setIds],
  );

  const value = useMemo(() => ({ ids, record, clear: () => setIds([]) }), [ids, record, setIds]);

  return <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>;
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  return context;
}
