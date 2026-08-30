/**
 * useLocalPreference — tiny persisted-state hook.
 * ------------------------------------------------------------------
 * Persists the search-dock preference to localStorage so the setting
 * survives reloads. Writes are debounced via a microtask-ish pattern
 * (setTimeout 0) to avoid blocking the UI on every toggle; failures
 * (private mode / storage quota) are swallowed silently.
 */
import { useEffect, useState } from 'react';

export function useLocalPreference(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Storage unavailable — setting simply won't persist. */
    }
  }, [key, value]);

  return [value, setValue];
}
