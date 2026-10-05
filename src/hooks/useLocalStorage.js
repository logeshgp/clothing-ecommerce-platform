import { useCallback, useEffect, useState } from 'react';

/**
 * State that persists to localStorage and stays in sync across browser tabs.
 * Falls back to in-memory state if storage is unavailable (private mode, SSR).
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked — state still works for this session */
    }
  }, [key, value]);

  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== key || event.newValue == null) return;
      try {
        setValue(JSON.parse(event.newValue));
      } catch {
        /* ignore malformed payloads from other tabs */
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  const reset = useCallback(() => setValue(initialValue), [initialValue]);

  return [value, setValue, reset];
}
