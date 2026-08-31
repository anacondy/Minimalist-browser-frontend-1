/**
 * Pure utility helpers (no React) — cheap and unit-testable.
 */

/** Trim a string and lowercase it — used for search filtering. */
export const normalize = (value) => (
  typeof value === 'string' ? value.trim().toLowerCase() : ''
);

/**
 * Build a search URL from a raw query (safe via encodeURIComponent).
 * DuckDuckGo LITE is used on purpose:
 *  - extremely light (no JS/ads/tracking) → fast even in a VM, keeps
 *    the SYS® shell fluid;
 *  - no Google reCAPTCHA wall (Google blocks WebKitGTK/VPN traffic).
 * It renders in our dark theme via the injected stylesheet.
 */
export const buildSearchUrl = (query) => {
  const q = query.trim();
  if (!q) return null;
  return `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(q)}`;
};

/**
 * Open a URL in a new tab in a way that never allows the opener to
 * script the new page (noopener + noreferrer). Returns void.
 */
export const openExternalUrl = (url) => {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Hard refresh — full page reload (Ctrl+Shift+R). Guarded so test/DOM
 * environments that don't implement navigation never crash the app.
 *
 * The reload function is injected via a small setter (default: the
 * page's own location.reload) so unit tests can observe it without
 * fighting jsdom's non-configurable `location.reload` property.
 */
const reloadImpl = {
  fn: () => {
    if (
      typeof window !== 'undefined' &&
      typeof window.location?.reload === 'function'
    ) {
      window.location.reload();
    }
  },
};

/** Override the reload implementation (tests / embedded shells). */
export const setReloadImpl = (fn) => {
  reloadImpl.fn = fn;
};

/** Trigger a full page reload. */
export const reloadPage = () => reloadImpl.fn();

/** "http://foo.bar" → "foo.bar" for compact display. */
export const prettifyUrl = (url) =>
  url.replace(/^https?:\/\//i, '').replace(/\/$/, '');

/**
 * Resolve a history entry to an openable URL.
 * Recognises literal hosts (react.dev), host:port (localhost:3000)
 * and IPs (192.168.1.10:8080); everything else — searches, downloads,
 * media titles — opens as a Google search.
 */
const URL_LIKE = /^[\w-]+(\.[\w-]+)+(:\d+)?$|^[\d.]+(:\d+)?$|^localhost(:\d+)?$/i;

export const resolveHistoryTarget = (name) => {
  const cleaned = prettifyUrl(name);
  if (URL_LIKE.test(cleaned)) {
    return `https://${cleaned}`;
  }
  return buildSearchUrl(name);
};
