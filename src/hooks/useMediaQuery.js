/**
 * useMediaQuery — subscribes a component to a CSS media query.
 * ------------------------------------------------------------------
 * Implemented with useSyncExternalStore, React's recommended way to
 * read external (browser) values: the component only re-renders when
 * the matched value actually changes, and the listener is registered
 * once per query — no polling, no resize loop, no cascading renders.
 */
import { useMemo, useSyncExternalStore } from 'react';

/** Subscribe to a MediaQueryList's 'change' events for a fixed query. */
const subscribeToQuery = (query) => (onChange) => {
  const mql = window.matchMedia(query);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};

/** Snapshot: current match state for the query. */
const getSnapshotFor = (query) => () => window.matchMedia(query).matches;

/** Server snapshot — this app renders client-side only. */
const getServerSnapshot = () => false;

export function useMediaQuery(query) {
  // Memoising per query keeps the store subscription stable across
  // re-renders (otherwise React re-subscribes on every render).
  const subscribe = useMemo(() => subscribeToQuery(query), [query]);
  const getSnapshot = useMemo(() => getSnapshotFor(query), [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

