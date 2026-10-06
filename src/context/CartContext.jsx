import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { calculateTotals, lineId } from '../utils/cart';
import { resolvePromoCode } from '../data/promoCodes';
import { colorImage } from '../data/products';
import { useStore } from './StoreContext';

const CartContext = createContext(null);

const STORAGE_KEY = 'dnd.cart.v3';

function readInitialState() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        items: Array.isArray(parsed.items)
          ? parsed.items.map((item) => ({ ...item, selected: item.selected !== false }))
          : [],
        promo: parsed.promo ?? null,
        shippingMethod: parsed.shippingMethod ?? 'standard',
      };
    }
  } catch {
    /* fall through to a clean cart */
  }
  return { items: [], promo: null, shippingMethod: 'standard' };
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { item } = action;
      const id = lineId(item.productId, item.size, item.color);
      const existing = state.items.find((line) => line.id === id);

      if (existing) {
        return {
          ...state,
          items: state.items.map((line) =>
            line.id === id
              ? {
                  ...line,
                  quantity: Math.min(line.quantity + item.quantity, line.maxQuantity),
                  selected: true,
                }
              : line,
          ),
        };
      }

      return { ...state, items: [...state.items, { ...item, id }] };
    }

    case 'updateQuantity': {
      const quantity = Math.max(0, action.quantity);
      if (quantity === 0) {
        return { ...state, items: state.items.filter((line) => line.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map((line) =>
          line.id === action.id ? { ...line, quantity: Math.min(quantity, line.maxQuantity) } : line,
        ),
      };
    }

    case 'setSelected':
      return {
        ...state,
        items: state.items.map((line) =>
          line.id === action.id ? { ...line, selected: action.selected } : line,
        ),
      };

    case 'selectAll':
      return {
        ...state,
        items: state.items.map((line) => ({ ...line, selected: action.selected })),
      };

    case 'remove':
      return { ...state, items: state.items.filter((line) => line.id !== action.id) };

    case 'changeSize': {
      // Moving a line to a different size may collide with an existing line — merge if so.
      const target = state.items.find((line) => line.id === action.id);
      if (!target) return state;

      const newId = lineId(target.productId, action.size, target.color);
      const collision = state.items.find((line) => line.id === newId && line.id !== action.id);

      if (collision) {
        return {
          ...state,
          items: state.items
            .filter((line) => line.id !== action.id)
            .map((line) =>
              line.id === newId
                ? { ...line, quantity: Math.min(line.quantity + target.quantity, action.maxQuantity) }
                : line,
            ),
        };
      }

      return {
        ...state,
        items: state.items.map((line) =>
          line.id === action.id
            ? {
                ...line,
                id: newId,
                size: action.size,
                maxQuantity: action.maxQuantity,
                quantity: Math.min(line.quantity, action.maxQuantity),
              }
            : line,
        ),
      };
    }

    case 'applyPromo':
      return { ...state, promo: action.promo };

    case 'removePromo':
      return { ...state, promo: null };

    case 'setShippingMethod':
      return { ...state, shippingMethod: action.method };

    case 'syncPrices':
      // Keeps the bag honest when an admin edits prices mid-session.
      return { ...state, items: action.items };

    case 'clear':
      return { items: [], promo: null, shippingMethod: state.shippingMethod };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, readInitialState);
  const [isOpen, setIsOpen] = useState(false);
  const { productsById, promos, settings, status } = useStore();

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state]);

  // Reflect admin edits (price, photo, name) in any open bag.
  useEffect(() => {
    if (status !== 'ready') return;

    let changed = false;
    const next = state.items.map((line) => {
      const product = productsById[line.productId];
      if (!product) return line;

      const image = colorImage(product, line.color);
      if (
        product.price === line.price &&
        product.compareAt === line.compareAt &&
        image === line.image &&
        product.name === line.name
      ) {
        return line;
      }

      changed = true;
      return { ...line, price: product.price, image, name: product.name, compareAt: product.compareAt };
    });

    if (changed) dispatch({ type: 'syncPrices', items: next });
  }, [productsById, state.items, status]);

  const selectedItems = useMemo(
    () => state.items.filter((line) => line.selected !== false),
    [state.items],
  );

  const totals = useMemo(
    () =>
      calculateTotals(selectedItems, {
        promo: state.promo,
        shippingMethod: state.shippingMethod,
        settings,
      }),
    [selectedItems, state.promo, state.shippingMethod, settings],
  );

  // A promo can become invalid after items are removed or the admin disables it.
  useEffect(() => {
    if (!state.promo || status !== 'ready') return;
    const stillValid = promos.some((p) => p.code === state.promo.code);
    if (!stillValid || totals.subtotal < (state.promo.minSubtotal ?? 0)) {
      dispatch({ type: 'removePromo' });
    }
  }, [state.promo, totals.subtotal, promos, status]);

  const addItem = useCallback((product, { size, color, quantity = 1, maxQuantity = 10 }) => {
    dispatch({
      type: 'add',
      item: {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        compareAt: product.compareAt,
        image: colorImage(product, color),
        category: product.category,
        size,
        color,
        quantity,
        maxQuantity,
        selected: true,
      },
    });
  }, []);

  const applyPromo = useCallback(
    (code) => {
      const result = resolvePromoCode(code, totals.subtotal, promos);
      if (result.ok) dispatch({ type: 'applyPromo', promo: result.promo });
      return result;
    },
    [totals.subtotal, promos],
  );

  const value = useMemo(
    () => ({
      items: state.items,
      selectedItems,
      bagItemCount: state.items.reduce((count, item) => count + item.quantity, 0),
      selectedBagItemCount: selectedItems.reduce((count, item) => count + item.quantity, 0),
      promo: state.promo,
      shippingMethod: state.shippingMethod,
      totals,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      updateQuantity: (id, quantity) => dispatch({ type: 'updateQuantity', id, quantity }),
      setSelected: (id, selected) => dispatch({ type: 'setSelected', id, selected }),
      selectAll: (selected) => dispatch({ type: 'selectAll', selected }),
      removeItem: (id) => dispatch({ type: 'remove', id }),
      changeSize: (id, size, maxQuantity) => dispatch({ type: 'changeSize', id, size, maxQuantity }),
      applyPromo,
      removePromo: () => dispatch({ type: 'removePromo' }),
      setShippingMethod: (method) => dispatch({ type: 'setShippingMethod', method }),
      clearCart: () => dispatch({ type: 'clear' }),
    }),
    [state.items, selectedItems, state.promo, state.shippingMethod, totals, isOpen, addItem, applyPromo],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
