/**
 * useTypingCapture — "type anywhere" routing.
 * ------------------------------------------------------------------
 * When the app is open, any printable keystroke that lands on the page
 * (not inside an editable field) is routed straight into the search
 * dock: we focus the input and insert the character. This gives the
 * app the feel of a browser omnibox — you never have to click the
 * search bar before typing.
 *
 * Modifiers (Ctrl/Alt/Meta) are ignored — those are shortcuts handled
 * elsewhere. The callback is read through a ref so the listener stays
 * bound exactly once.
 */
import { useEffect, useRef } from 'react';

export function useTypingCapture({ onType }) {
  const onTypeRef = useRef(onType);
  useEffect(() => {
    onTypeRef.current = onType;
  });

  useEffect(() => {
    /** @param {KeyboardEvent} e */
    const handleKeyDown = (e) => {
      // Never capture modifier combos or Alt navigation.
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target;
      const isField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (isField) return; // input already focused → native typing

      // Only single printable characters (letters, digits, space,
      // punctuation) — function keys and shortcuts pass through.
      if (e.key.length !== 1) return;

      e.preventDefault(); // stop the char reaching the page body
      onTypeRef.current?.(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
