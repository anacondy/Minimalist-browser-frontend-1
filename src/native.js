/**
 * native.js — Tauri bridge (browser <-> desktop shell).
 * ------------------------------------------------------------------
 * One abstraction the front-end uses for tab lifecycle. Two backends:
 *
 *   Tauri (desktop shell)   -> ONE window, tabs are embedded child
 *                              webviews managed by Rust commands
 *                              (open/switch/close/navigate/reload).
 *   Plain browser (preview) -> window.open fallback (sandbox-safe) —
 *                              the web preview keeps working unchanged.
 *
 * The Rust side emits `tab://updated` with the full tab list after
 * every mutation; React subscribes via `onTabsUpdated()` so the tab
 * strip + history update in real time (titles arrive from the page).
 */
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { openExternalUrl } from './utils.js';

/** True when running inside the Tauri desktop shell. */
export const inTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const safeInvoke = (cmd, args) => invoke(cmd, args).catch((error) => {
  console.error(`[sys-native] ${cmd} failed:`, error);
  return null;
});

/**
 * Open a session/tab.
 * In the shell: `newTab=false` navigates the ACTIVE tab (browser-style
 * address bar — repeated searches never spawn extra windows); `newTab
 * =true` opens a new embedded tab. Returns TabInfo (or null in browser).
 */
export const openSessionTab = async (url, title = 'NEW SESSION', { newTab = true } = {}) => {
  if (!inTauri()) {
    openExternalUrl(url);
    return null;
  }
  return safeInvoke('open_tab', { url, title, newTab });
};

/** Switch the visible embedded tab (`'home'` shows the chrome hero). */
export const switchSessionTab = (label) =>
  inTauri() ? safeInvoke('switch_tab', { label }) : Promise.resolve(null);

/** Close an embedded tab. */
export const closeSessionTab = (label) =>
  inTauri() ? safeInvoke('close_tab', { label }) : Promise.resolve(null);

/** Page-level back/forward inside a tab. */
export const navigateSessionTab = (label, direction) =>
  inTauri() ? safeInvoke('tab_navigate', { label, direction }) : Promise.resolve(null);

/** Soft-reload the page inside a tab. */
export const reloadSessionTab = (label) =>
  inTauri() ? safeInvoke('tab_reload', { label }) : Promise.resolve(null);

/** Initial tab list (also streamed via `tab://updated`). */
export const listTabs = () => (inTauri() ? safeInvoke('tabs_list') : Promise.resolve([]));

/**
 * Subscribe to tab-list updates from Rust.
 * @param {(tabs: Array<{label:string,title:string,url:string,active:boolean}>) => void} callback
 * @returns {Promise<() => void>} unsubscribe function
 */
export const onTabsUpdated = (callback) => {
  if (!inTauri()) return Promise.resolve(() => {});
  return listen('tab://updated', (event) => {
    if (Array.isArray(event.payload)) callback(event.payload);
  });
};
