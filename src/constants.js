/**
 * App-wide constants — single source of truth.
 * Kept in one module so data-driven UI (counters, empty states,
 * shortcuts) can never drift out of sync with the render code.
 */

/** View identifiers — mirrors the "views" of a browser (start page,
 *  session list, history, bookmarks, config). */
export const VIEWS = Object.freeze({
  MAIN: 'main',
  TABS: 'tabs',
  HISTORY: 'history',
  BOOKMARKS: 'bookmarks',
  SETTINGS: 'settings',
});

/** Search dock placement — 'raised' floats above the taskbar line,
 *  'bottom' sits flush against the screen edge. */
export const SEARCH_POSITION = Object.freeze({
  RAISED: 'raised',
  BOTTOM: 'bottom',
});

/** Keyboard shortcuts shown in Settings — documented next to the
 *  actual handler in App.jsx. */
export const SHORTCUTS = Object.freeze([
  { keys: 'CTRL + K', action: 'FOCUS SEARCH' },
  { keys: 'CTRL + ,', action: 'CONFIG' },
  { keys: 'CTRL + H', action: 'HIST' },
  { keys: 'CTRL + B', action: 'BKMK' },
  { keys: 'ESC', action: 'CLOSE' },
]);

/** URL helpers for the mock social feeds. */
export const EXTERNAL_LINKS = Object.freeze({
  GOOGLE_SEARCH: 'https://www.google.com/search?q=',
  YOUTUBE_MUSIC: 'https://music.youtube.com/',
});
