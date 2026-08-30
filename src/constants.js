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

/** Order used by Ctrl+Tab / Ctrl+Shift+Tab cycling. */
export const VIEW_ORDER = Object.freeze([
  VIEWS.MAIN,
  VIEWS.TABS,
  VIEWS.HISTORY,
  VIEWS.BOOKMARKS,
  VIEWS.SETTINGS,
]);

/** Keyboard shortcuts shown in Settings — documented next to the
 *  actual handler in useViewShortcuts.js. */
export const SHORTCUTS = Object.freeze([
  { keys: 'CTRL + L', action: 'URL / SEARCH' },
  { keys: 'CTRL + K', action: 'FILTER / FOCUS' },
  { keys: 'CTRL + TAB', action: 'NEXT VIEW' },
  { keys: 'ALT + ←/→', action: 'BACK / FWD' },
  { keys: 'CTRL + R', action: 'REFRESH' },
  { keys: 'CTRL + SHIFT + R', action: 'HARD REFRESH' },
  { keys: 'CTRL + H', action: 'HIST' },
  { keys: 'CTRL + B', action: 'BKMK' },
  { keys: 'CTRL + ,', action: 'CONFIG' },
  { keys: 'ESC', action: 'CLOSE' },
]);

/** URL helpers for the mock social feeds. */
export const EXTERNAL_LINKS = Object.freeze({
  GOOGLE_SEARCH: 'https://www.google.com/search?q=',
  YOUTUBE_MUSIC: 'https://music.youtube.com/',
});
