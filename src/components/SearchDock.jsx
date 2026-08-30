/**
 * SearchDock — the global, always-available search bar.
 * ------------------------------------------------------------------
 * - A real <form> so Enter submits natively (works with mobile
 *   keyboards, IMEs and accessibility tools) — no synthetic key codes.
 * - Placeholder adapts to the active view (filter mode).
 * - Safe-area aware dock; hidden (but focus-safe) while Settings is open.
 * - Desktop hint chip only renders ≥md (less DOM on phones).
 *
 * High-refresh-rate: only transform/opacity animate here; the blurred
 * focus glow is a transform-free layer with pointer-events-none.
 */
import { Search } from 'lucide-react';
import { SEARCH_POSITION, VIEWS } from '../constants.js';

/** Contextual placeholder — one string per view. */
const PLACEHOLDER = {
  [VIEWS.HISTORY]: 'FILTER HISTORY...',
  [VIEWS.BOOKMARKS]: 'SEARCH BOOKMARKS...',
  [VIEWS.TABS]: 'FIND SESSION...',
  [VIEWS.SETTINGS]: 'ENTER QUERY OR URL...',
  [VIEWS.MAIN]: 'ENTER QUERY OR URL...',
};

/**
 * @param {{
 *   activeView: string,
 *   searchQuery: string,
 *   onQueryChange: (value: string) => void,
 *   onSubmit: () => void,
 *   searchPosition: 'raised'|'bottom',
 *   inputRef: React.RefObject<HTMLInputElement | null>,
 * }} props
 */
export default function SearchDock({
  activeView,
  searchQuery,
  onQueryChange,
  onSubmit,
  searchPosition,
  inputRef,
}) {
  // Settings owns the full-screen modal → dock is removed from view.
  const isHidden = activeView === VIEWS.SETTINGS;

  return (
    <div
      className={`app-search-dock absolute inset-x-0 z-30 flex justify-center px-4 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:px-0 ${
        searchPosition === SEARCH_POSITION.BOTTOM ? 'bottom-0' : 'bottom-12'
      } ${isHidden ? 'pointer-events-none translate-y-10 opacity-0' : 'translate-y-0 opacity-100'}`}
    >
      <form
        role="search"
        aria-label="Search or enter URL"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="relative w-full max-w-2xl bg-black"
      >
        {/* Focus glow — GPU-cheap (opacity only), never intercepts input. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-neutral-900/50 opacity-0 blur-xl transition-opacity duration-500 group-focus-within:opacity-100"
        />

        <div className="relative flex items-center border-b-2 border-neutral-800 px-4 py-4 transition-colors duration-500 group-focus-within:border-white md:py-6">
          <Search
            aria-hidden="true"
            size={24}
            className="mr-4 shrink-0 text-neutral-600 transition-colors duration-300 group-focus-within:text-white"
          />

          <input
            ref={inputRef}
            type="text"
            name="q"
            value={searchQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={PLACEHOLDER[activeView] ?? PLACEHOLDER[VIEWS.MAIN]}
            className="w-full min-w-0 bg-transparent text-lg font-bold tracking-widest text-white outline-none placeholder:text-neutral-700 md:text-2xl"
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            enterKeyHint="search"
            aria-label="Search or enter URL"
          />

          {/* Desktop-only shortcut hint (dropped under md to save space). */}
          <span className="ml-4 hidden shrink-0 items-center gap-1 rounded border border-neutral-800 px-2 py-1 font-mono text-[10px] text-neutral-600 md:flex">
            CTRL<span className="text-neutral-700">+</span>K
          </span>
        </div>
      </form>
    </div>
  );
}
