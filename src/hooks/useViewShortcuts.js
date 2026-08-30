/**
 * useViewShortcuts — universal (browser-style) keyboard bindings.
 * ------------------------------------------------------------------
 *   CTRL/CMD + L        focus the URL/search dock
 *   CTRL/CMD + K        focus the filter/search dock (any view)
 *   ALT + ← / ALT + →   navigate back / forward in view history
 *   CTRL + R            soft refresh (reset filter + scroll)
 *   CTRL + SHIFT + R    hard refresh (reload app)
 *   CTRL + TAB          next view   ·  CTRL + SHIFT + TAB  previous view
 *   CTRL/CMD + H        history · CTRL/CMD + B bookmarks · CTRL/CMD + , config
 *   ESC                 clear field, else close back to home
 *
 * CMD is treated like Ctrl so macOS users get identical behaviour.
 * The listener is bound once and reads the freshest callback through
 * a ref → no re-binding per keystroke or render.
 *
 * NOTE (real-browser caveat): top-level browsers reserve Ctrl+Tab and
 * Alt+←/→ for their own chrome, so an embedded page may not receive
 * them. They become fully available once this front-end runs inside a
 * desktop shell (Tauri/Electron/CEF) where we own the shortcut table.
 */
import { useEffect, useRef } from 'react';

export function useViewShortcuts({ onAction, searchInputRef }) {
  // Keep the latest callback without re-binding the window listener.
  // The ref is only touched inside an effect (React 19 lint rule) so
  // the listener always sees the freshest closures.
  const actionRef = useRef(onAction);
  useEffect(() => {
    actionRef.current = onAction;
  });

  useEffect(() => {
    /** @param {KeyboardEvent} e */
    const handleKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key;
      const lower = key.toLowerCase();
      const fire = (action) => actionRef.current?.(action);

      // --- Modifier combos (browser-level chrome shortcuts) ---
      if (mod && key === 'Tab') {
        e.preventDefault();
        fire(e.shiftKey ? 'prev-view' : 'next-view');
        return;
      }
      if (mod && e.shiftKey && lower === 'r') {
        e.preventDefault();
        fire('hard-refresh');
        return;
      }
      if (mod && lower === 'r') {
        e.preventDefault();
        fire('refresh');
        return;
      }
      if (mod && (lower === 'l' || lower === 'k')) {
        // L = URL/search bar · K = filter/search dock — same input.
        e.preventDefault();
        fire('focus-search');
        return;
      }
      if (mod && lower === ',') {
        e.preventDefault();
        fire('open-settings');
        return;
      }
      if (mod && lower === 'h') {
        e.preventDefault();
        fire('open-history');
        return;
      }
      if (mod && lower === 'b') {
        e.preventDefault();
        fire('open-bookmarks');
        return;
      }

      // --- Alt navigation (back / forward) ---
      if (e.altKey && key === 'ArrowLeft') {
        e.preventDefault();
        fire('back');
        return;
      }
      if (e.altKey && key === 'ArrowRight') {
        e.preventDefault();
        fire('forward');
        return;
      }

      // --- Escape: clear the field first, close the view second ---
      if (key === 'Escape') {
        const target = e.target;
        const isField =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement;

        if (isField && target.value) {
          // First Esc in a field: clear it, keep the panel open.
          fire('clear-search');
          return;
        }
        fire('close');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchInputRef]);
}
