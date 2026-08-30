/**
 * useNow — ticking clock.
 * ------------------------------------------------------------------
 * Updates once per minute to keep the status bar's time in sync with
 * the real clock. The interval start is aligned to the next minute
 * boundary, so the display never drifts visibly from wall-clock time.
 * No state is written synchronously inside the effect (React 19
 * lint rule) — the first update happens in the delayed callback.
 */
import { useEffect, useState } from 'react';

/** Milliseconds until the next minute boundary, plus a safety buffer. */
const msUntilNextMinute = () => 60_000 - (Date.now() % 60_000) + 250;

export function useNow(intervalMs = 60_000) {
  // Initial render already carries the current time (no effect needed).
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval;

    // Align the first tick to the minute boundary, then run a plain
    // interval so the clock keeps updating if the tab is left open.
    const alignTimer = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), intervalMs);
    }, msUntilNextMinute());

    return () => {
      clearTimeout(alignTimer);
      clearInterval(interval);
    };
  }, [intervalMs]);

  return now;
}
