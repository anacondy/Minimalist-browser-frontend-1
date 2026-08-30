/**
 * useViewShortcuts — global keyboard bindings.
 * ------------------------------------------------------------------
 *   CTRL/CMD + K   focus the search dock (closes Settings if open;
 *                  keeps the current view for live filtering)
 *   CTRL/CMD + ,   open Settings
 *   CTRL/CMD + H   open History
 *   CTRL/CMD + B   open Bookmarks
 *   ESC            return to the MAIN view
 *
 * CMD is treated like Ctrl so macOS users get identical behaviour.
 * The listener is bound once and reads the freshest callbacks through
 * a ref → no re-binding on every keystroke or render.
 */
import { useEffect, useRef } from 'react';

export function useViewShortcuts({ onShortcut, onFocusSearch, searchInputRef }) {
  // Keep the latest callbacks without re-binding the window listener.
  // The ref is only touched inside an effect (React 19 lint rule) so
  // the listener always sees the freshest closures.
  const handlersRef = useRef({ onShortcut, onFocusSearch });

  useEffect(() => {
    handlersRef.current = { onShortcut, onFocusSearch };
  });

  useEffect(() => {
    /** @param {KeyboardEvent} e */
    const handleKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // CTRL/CMD + K — always focus the search dock.
      if (mod && key === 'k') {
        e.preventDefault();
        handlersRef.current.onFocusSearch?.();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Text fields manage their own Enter/Escape (submit / blur).
      const target = e.target;
      const isField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement;
      if (isField && (e.key === 'Escape' || e.key === 'Enter')) return;

      // Owned view shortcuts (modifier combos are never hijacked from
      // a field — they're browser-safe here and rare in inputs).
      if (mod && key === ',') {
        e.preventDefault();
        handlersRef.current.onShortcut?.('settings');
      } else if (mod && key === 'h') {
        e.preventDefault();
        handlersRef.current.onShortcut?.('history');
      } else if (mod && key === 'b') {
        e.preventDefault();
        handlersRef.current.onShortcut?.('bookmarks');
      } else if (e.key === 'Escape') {
        handlersRef.current.onShortcut?.('main');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchInputRef]);
}
