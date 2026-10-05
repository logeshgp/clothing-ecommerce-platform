import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AuthContext = createContext(null);

/**
 * Session-backed authentication.
 *
 * The browser never sees a password hash or a role it can edit — the server
 * decides both. Addresses stay on the device (the demo has no profile store),
 * while orders come from the API.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useLocalStorage('dnd.addresses.v2', []);

  const refreshOrders = useCallback(async (signedIn) => {
    if (!signedIn) {
      setOrders([]);
      return;
    }
    try {
      const data = await api.myOrders();
      setOrders(data.orders ?? []);
    } catch {
      setOrders([]);
    }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const data = await api.session();
      setUser(data.user);
      await refreshOrders(Boolean(data.user));
    } catch {
      setUser(null);
    } finally {
      setStatus('ready');
    }
  }, [refreshOrders]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = useCallback(
    async (payload) => {
      const data = await api.login(payload);
      setUser(data.user);
      await refreshOrders(true);
      return data.user;
    },
    [refreshOrders],
  );

  const register = useCallback(
    async (payload) => {
      const data = await api.register(payload);
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const requestCode = useCallback((email) => api.requestCode(email), []);

  const verifyCode = useCallback(
    async (payload) => {
      const data = await api.verifyCode(payload);
      setUser(data.user);
      await refreshOrders(true);
      return data.user;
    },
    [refreshOrders],
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setOrders([]);
  }, []);

  /* --------------------------------------------------------- addresses */

  const saveAddress = useCallback(
    (address) => {
      setAddresses((current) => {
        const id = address.id ?? `addr-${Date.now().toString(36)}`;
        const next = current.some((a) => a.id === address.id)
          ? current.map((a) => (a.id === address.id ? { ...address, id } : a))
          : [...current, { ...address, id }];

        if (address.isDefault) {
          return next.map((a) => ({ ...a, isDefault: a.id === id }));
        }
        if (!next.some((a) => a.isDefault) && next.length) {
          return next.map((a, index) => ({ ...a, isDefault: index === 0 }));
        }
        return next;
      });
    },
    [setAddresses],
  );

  const deleteAddress = useCallback(
    (id) => setAddresses((current) => current.filter((a) => a.id !== id)),
    [setAddresses],
  );

  const value = useMemo(
    () => ({
      user: user ? { ...user, addresses } : null,
      isAuthenticated: Boolean(user),
      isStaff: Boolean(user && ['admin', 'support'].includes(user.role)),
      status,
      orders,
      addresses,
      login,
      register,
      requestCode,
      verifyCode,
      logout,
      saveAddress,
      deleteAddress,
      refreshOrders: () => refreshOrders(Boolean(user)),
      getOrder: (id) => orders.find((order) => order.id === id) ?? null,
      changePassword: api.changePassword,
    }),
    [
      user,
      addresses,
      status,
      orders,
      login,
      register,
      requestCode,
      verifyCode,
      logout,
      saveAddress,
      deleteAddress,
      refreshOrders,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
