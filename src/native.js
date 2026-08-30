/**
 * native.js — Tauri bridge (browser <-> desktop shell).
 * ------------------------------------------------------------------
 * One abstraction the front-end uses for "open a tab / manage a tab".
 * It has two backends:
 *
 *   Tauri (desktop shell)   -> real webview-window tabs via Rust
 *                              commands (src-tauri/src/lib.rs)
 *   Plain browser (preview) -> window.open fallback (no-op, sandbox-safe)
 *
 * Detection is `window.__TAURI_INTERNALS__` (set by the CLI-injected
 * runtime). `invoke()` is imported lazily-safe: it is only *called*
 * when the detection passes, so this module is import-safe in tests
 * and in the web preview.
 */
import { invoke } from '@tauri-apps/api/core';
import { openExternalUrl } from './utils.js';

/** True when running inside the Tauri desktop shell. */
export const inTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Open a session/tab.
 * - Desktop shell: create a REAL Tauri tab (webview window) whose label
 *   is returned for later management.
 * - Browser preview: fall back to a new browser tab.
 *
 * @param {string} url  absolute URL to load
 * @param {string} [title] tab title shown in the OS window
 * @returns {Promise<string|null>} window label, or null in browser mode
 */
export const openSessionTab = async (url, title = 'NEW SESSION') => {
  if (!inTauri()) {
    openExternalUrl(url);
    return null;
  }
  try {
    // Rust assigns the unique label (`tab-N`).
    return await invoke('open_tab', { url, title });
  } catch (error) {
    // Never break browsing because a native call failed.
    console.error('[sys-native] open_tab failed, falling back to browser:', error);
    openExternalUrl(url);
    return null;
  }
};

/** Close a tab by its window label (Tauri only; silent no-op otherwise). */
export const closeSessionTab = async (label) => {
  if (!inTauri() || !label) return;
  try {
    await invoke('close_tab', { label });
  } catch (error) {
    console.error('[sys-native] close_tab failed:', error);
  }
};

/**
 * Navigate a tab window backwards/forwards through its own page history.
 * @param {string} label window label from openSessionTab
 * @param {'back'|'forward'} direction
 */
export const navigateSessionTab = async (label, direction) => {
  if (!inTauri() || !label) return;
  try {
    await invoke('tab_navigate', { label, direction });
  } catch (error) {
    console.error('[sys-native] tab_navigate failed:', error);
  }
};

/** Reload the page inside a tab window (Tauri only). */
export const reloadSessionTab = async (label) => {
  if (!inTauri() || !label) return;
  try {
    await invoke('tab_reload', { label });
  } catch (error) {
    console.error('[sys-native] tab_reload failed:', error);
  }
};
