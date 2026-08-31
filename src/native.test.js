/**
 * native.js tests — Tauri bridge behaviour in a NON-Tauri environment.
 * ------------------------------------------------------------------
 * jsdom has no `__TAURI_INTERNALS__`, so every call must transparently
 * fall back to `window.open` (the browser-preview behaviour). This is
 * what keeps the web preview and the 26 existing tests working even
 * with the desktop bridge wired in.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  closeSessionTab,
  inTauri,
  navigateSessionTab,
  openSessionTab,
  reloadSessionTab,
} from './native.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('native bridge (browser fallback)', () => {
  it('detects the browser (non-Tauri) environment', () => {
    expect(inTauri()).toBe(false);
  });

  it('openSessionTab falls back to window.open and returns null', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const label = await openSessionTab('https://react.dev/', 'REACT DOCS');

    expect(label).toBeNull();
    expect(openSpy).toHaveBeenCalledWith(
      'https://react.dev/',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('management calls are silent no-ops outside Tauri', async () => {
    await expect(closeSessionTab('tab-1')).resolves.toBeNull();
    await expect(navigateSessionTab('tab-1', 'back')).resolves.toBeNull();
    await expect(reloadSessionTab('tab-1')).resolves.toBeNull();
  });
});
