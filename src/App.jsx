/**
 * App — SYS® Minimalist Browser (root component).
 * ------------------------------------------------------------------
 * Responsibilities:
 *  1. Owns top-level state: active view, query, sync profile, dock
 *     placement (persisted), and the search input ref.
 *  2. Routes user intent (nav clicks / shortcuts / submit) to views.
 *  3. Renders each view inside a <ViewPanel> that respects reduced
 *     motion and only exposes the *active* view to the accessibility
 *     tree (visibility:hidden on inactive panels).
 *
 * Performance notes
 *  - Panels animate opacity/transform only (compositor-friendly → no
 *    reflow, smooth on 120/144/240 Hz).
 *  - Filtering is memoised with useMemo; datasets are frozen at module
 *    scope, so App re-renders nothing when a toggle flips.
 */
import { useCallback, useMemo, useRef, useState } from 'react';

import TopNav from './components/TopNav.jsx';
import HomeView from './components/HomeView.jsx';
import TabsView from './components/TabsView.jsx';
import HistoryView from './components/HistoryView.jsx';
import BookmarksView from './components/BookmarksView.jsx';
import SettingsView from './components/SettingsView.jsx';
import SearchDock from './components/SearchDock.jsx';

import { GUEST_DATA, SYNCED_DATA } from './data.js';
import { SEARCH_POSITION, VIEWS } from './constants.js';
import { useNow } from './hooks/useNow.js';
import { useViewShortcuts } from './hooks/useViewShortcuts.js';
import { useLocalPreference } from './hooks/useLocalPreference.js';
import {
  buildSearchUrl,
  normalize,
  openExternalUrl,
  resolveHistoryTarget,
} from './utils.js';

/** Cameras for the view transition — transforms only. */
const TRANSITIONS = {
  [VIEWS.MAIN]: { off: 'scale(0.96)' }, // gentle zoom-out
  [VIEWS.TABS]: { off: 'translateX(-3rem)' }, // slide from left
  [VIEWS.HISTORY]: { off: 'scale(1.05)' }, // zoom-in fade
  [VIEWS.BOOKMARKS]: { off: 'translateY(3rem)' }, // rise from below
  [VIEWS.SETTINGS]: { off: 'none' }, // plain opacity cross-fade
};

/**
 * ViewPanel — shared transition wrapper.
 * Inactive panels get visibility:hidden (kept out of the a11y tree and
 * unfocusable) but remain mounted so their scroll positions survive.
 */
function ViewPanel({ active, view, className = '', children }) {
  const anim = TRANSITIONS[view] ?? TRANSITIONS[VIEWS.MAIN];
  return (
    <section
      data-testid={`view-${view}`}
      aria-hidden={!active}
      className={`absolute inset-0 transform-gpu transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${className}`}
      style={{
        opacity: active ? 1 : 0,
        transform: active ? 'none' : anim.off,
        visibility: active ? 'visible' : 'hidden',
        pointerEvents: active ? 'auto' : 'none',
        zIndex: active ? (view === VIEWS.SETTINGS ? 40 : 20) : 0,
      }}
    >
      {children}
    </section>
  );
}

export default function App() {
  /* ------------------------------ state ------------------------------ */
  const [activeView, setActiveView] = useState(VIEWS.MAIN);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAccountSynced, setIsAccountSynced] = useState(false);

  // Dock placement persists across reloads (localStorage-backed).
  const [searchPosition, setSearchPosition] = useLocalPreference(
    'sys.search-position',
    SEARCH_POSITION.RAISED,
  );

  const searchInputRef = useRef(null);
  const now = useNow();

  /* --------------------------- derived data --------------------------- */
  // Profiled dataset (guest vs synced) — frozen module constants.
  const dataset = isAccountSynced ? SYNCED_DATA : GUEST_DATA;

  // Live filtering — recomputed only when the query or profile changes.
  const filtered = useMemo(() => {
    const q = normalize(searchQuery);
    if (!q) return dataset;
    return {
      tabs: dataset.tabs.filter((t) => normalize(t.title).includes(q)),
      history: dataset.history.filter(
        (h) => normalize(h.name).includes(q) || normalize(h.role).includes(q),
      ),
      bookmarks: dataset.bookmarks.filter((b) =>
        normalize(b.title).includes(q),
      ),
    };
  }, [dataset, searchQuery]);

  /* ---------------------------- navigation ---------------------------- */
  const navigate = useCallback((view) => {
    // Switching views clears the filter so the user starts fresh.
    if (view !== VIEWS.MAIN) setSearchQuery('');
    setActiveView(view);
  }, []);

  // Ctrl/Cmd+K: close settings (if open) and focus the dock.
  const handleFocusSearch = useCallback(() => {
    setActiveView((prev) => (prev === VIEWS.SETTINGS ? VIEWS.MAIN : prev));
    // Paint the visible panel first, then focus (prevents focus loss).
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
  }, []);

  // Global keyboard bindings (see useViewShortcuts docs).
  useViewShortcuts({ onShortcut: navigate, onFocusSearch: handleFocusSearch, searchInputRef });

  /* ------------------------- search submit ---------------------------- */
  const handleSubmit = useCallback(() => {
    const q = searchQuery.trim();
    if (!q) return;

    // Filter view + results exist → open the first match (contextual).
    if (activeView !== VIEWS.MAIN) {
      const pool = filtered[activeView] ?? [];
      const first = pool[0];
      if (first) {
        openExternalUrl(
          activeView === VIEWS.HISTORY
            ? resolveHistoryTarget(first.name)
            : first.url,
        );
        return;
      }
    }

    // Default: real web search (Google) in a new tab.
    openExternalUrl(buildSearchUrl(q));
    setSearchQuery(''); // Search bar resets after submit.
  }, [activeView, filtered, searchQuery]);

  /* ------------------------------ render ------------------------------ */
  return (
    <div className="app-root select-text text-neutral-200 selection:bg-white selection:text-black">
      <TopNav activeView={activeView} onNavigate={navigate} now={now} />

      {/* MAIN — hero start page */}
      <ViewPanel active={activeView === VIEWS.MAIN} view={VIEWS.MAIN}>
        <HomeView />
      </ViewPanel>

      {/* TABS — open sessions */}
      <ViewPanel active={activeView === VIEWS.TABS} view={VIEWS.TABS}>
        <TabsView tabs={filtered.tabs} />
      </ViewPanel>

      {/* HISTORY */}
      <ViewPanel active={activeView === VIEWS.HISTORY} view={VIEWS.HISTORY}>
        <HistoryView items={filtered.history} />
      </ViewPanel>

      {/* BOOKMARKS */}
      <ViewPanel active={activeView === VIEWS.BOOKMARKS} view={VIEWS.BOOKMARKS}>
        <BookmarksView items={filtered.bookmarks} />
      </ViewPanel>

      {/* SETTINGS — modal layer */}
      <ViewPanel active={activeView === VIEWS.SETTINGS} view={VIEWS.SETTINGS}>
        <SettingsView
          isAccountSynced={isAccountSynced}
          onToggleSync={() => setIsAccountSynced((v) => !v)}
          searchPosition={searchPosition}
          onToggleSearchPosition={() =>
            setSearchPosition((prev) =>
              prev === SEARCH_POSITION.BOTTOM
                ? SEARCH_POSITION.RAISED
                : SEARCH_POSITION.BOTTOM,
            )
          }
          onClose={() => navigate(VIEWS.MAIN)}
        />
      </ViewPanel>

      {/* GLOBAL SEARCH DOCK — always mounted, hidden only in Settings */}
      <SearchDock
        activeView={activeView}
        searchQuery={searchQuery}
        onQueryChange={setSearchQuery}
        onSubmit={handleSubmit}
        searchPosition={searchPosition}
        inputRef={searchInputRef}
      />
    </div>
  );
}
