/**
 * Pure utility helpers (no React) — cheap and unit-testable.
 */

/** Trim a string and lowercase it — used for search filtering. */
export const normalize = (value) => (
  typeof value === 'string' ? value.trim().toLowerCase() : ''
);

/** Build a Google search URL from a raw query (safe via encodeURIComponent). */
export const buildSearchUrl = (query) => {
  const q = query.trim();
  if (!q) return null;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
};

/**
 * Open a URL in a new tab in a way that never allows the opener to
 * script the new page (noopener + noreferrer). Returns void.
 */
export const openExternalUrl = (url) => {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

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
