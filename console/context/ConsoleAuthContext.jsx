import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@store/api/client';

const ConsoleAuthContext = createContext(null);

/**
 * Staff session for the console.
 *
 * Roles are assigned by the server from the ADMIN_EMAILS / SUPPORT_EMAILS
 * allowlists and re-verified on every request, so the UI gate here is purely
 * about what to render — it is not the security boundary.
 */
export function ConsoleAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () => {
    try {
      const data = await api.session();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setStatus('ready');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const login = useCallback(async (payload) => {
    const data = await api.login(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const loginWithCode = useCallback(async (payload) => {
    const data = await api.verifyCode(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAdmin: user?.role === 'admin',
      isSupport: user?.role === 'support',
      isStaff: ['admin', 'support'].includes(user?.role),
      login,
      loginWithCode,
      requestCode: api.requestCode,
      logout,
      reload: load,
    }),
    [user, status, login, loginWithCode, logout, load],
  );

  return <ConsoleAuthContext.Provider value={value}>{children}</ConsoleAuthContext.Provider>;
}

export function useConsoleAuth() {
  const context = useContext(ConsoleAuthContext);
  if (!context) throw new Error('useConsoleAuth must be used within a ConsoleAuthProvider');
  return context;
}
