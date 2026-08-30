/**
 * App — SYS® Minimalist Browser (root component).
 * ------------------------------------------------------------------
 * Responsibilities:
 *  1. Owns top-level state: active view, query, sync profile, dock
 *     placement (persisted), and the search input ref.
 *  2. Routes user intent (nav clicks / shortcuts / submit / blank-area
 *     clicks) to views, keeping a back/forward history stack so
 *     Alt+← / Alt+→ behave like a browser.
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import TopNav from './components/TopNav.jsx';
import HomeView from './components/HomeView.jsx';
import TabsView from './components/TabsView.jsx';
import HistoryView from './components/HistoryView.jsx';
import BookmarksView from './components/BookmarksView.jsx';
import SettingsView from './components/SettingsView.jsx';
import SearchDock from './components/SearchDock.jsx';

import { GUEST_DATA, SYNCED_DATA } from './data.js';
import { SEARCH_POSITION, VIEW_ORDER, VIEWS } from './constants.js';
import { useNow } from './hooks/useNow.js';
import { useViewShortcuts } from './hooks/useViewShortcuts.js';
import { useTypingCapture } from './hooks/useTypingCapture.js';
import { useLocalPreference } from './hooks/useLocalPreference.js';
import {
  buildSearchUrl,
  normalize,
  openExternalUrl,
  reloadPage,
  resolveHistoryTarget,
} from './utils.js';

/** Hard cap on back/forward stack size (memory hygiene). */
const MAX_HISTORY = 50;

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

  // Browser-style back/forward stacks (view history only).
  const activeViewRef = useRef(VIEWS.MAIN);
  const backStackRef = useRef([]);
  const forwardStackRef = useRef([]);

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
  /** Navigate to a view, recording the previous one for Alt+←. */
  const navigate = useCallback((view) => {
    const prev = activeViewRef.current;
    if (prev === view) return;

    // Push + cap the back stack, clear the forward stack.
    backStackRef.current.push(prev);
    if (backStackRef.current.length > MAX_HISTORY) backStackRef.current.shift();
    forwardStackRef.current = [];

    activeViewRef.current = view;
    setActiveView(view);
    // Switching views clears the filter so the user starts fresh.
    if (view !== VIEWS.MAIN) setSearchQuery('');
  }, []);

  /** Alt+← — go to the previous view. */
  const goBack = useCallback(() => {
    const prev = backStackRef.current.pop();
    if (prev === undefined) return;
    forwardStackRef.current.push(activeViewRef.current);
    activeViewRef.current = prev;
    setActiveView(prev);
  }, []);

  /** Alt+→ — redo the view we just backed out of. */
  const goForward = useCallback(() => {
    const next = forwardStackRef.current.pop();
    if (next === undefined) return;
    backStackRef.current.push(activeViewRef.current);
    activeViewRef.current = next;
    setActiveView(next);
  }, []);

  /** Ctrl+Tab / Ctrl+Shift+Tab — cycle through the five views. */
  const cycleView = useCallback(
    (step) => {
      const index = VIEW_ORDER.indexOf(activeViewRef.current);
      const next =
        VIEW_ORDER[(index + step + VIEW_ORDER.length) % VIEW_ORDER.length];
      navigate(next);
    },
    [navigate],
  );

  /* ---------------------- search / omnibox typing --------------------- */
  // Global autofocus: open the app with the search bar ready to type.
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Type-anywhere: printable keys land directly in the search bar even
  // when the input itself isn't focused (omnibox behaviour).
  const handleGlobalType = useCallback((char) => {
    setSearchQuery((query) => query + char);
    searchInputRef.current?.focus();
  }, []);
  useTypingCapture({ onType: handleGlobalType });

  // Ctrl/Cmd+L / K: close settings (if open) and focus the dock.
  const handleFocusSearch = useCallback(() => {
    if (activeViewRef.current === VIEWS.SETTINGS) navigate(VIEWS.MAIN);
    // Paint the visible panel first, then focus (prevents focus loss).
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
  }, [navigate]);

  /**
   * Escape in a field: clear the query (second Esc closes the view).
   */
  const handleClearSearch = useCallback(() => setSearchQuery(''), []);

  /* ------------------------------ refresh ----------------------------- */
  /**
   * CTRL+R  — soft refresh: reset transient state (filter + scroll),
   * keeping the current view (mock data is static, so a re-render is
   * enough — real data fetching plugs in here later).
   * CTRL+SHIFT+R — hard refresh: full page reload (bypass-cache).
   */
  const handleRefresh = useCallback((hard) => {
    if (hard) {
      reloadPage();
      return;
    }
    setSearchQuery('');
    document
      .querySelectorAll('[data-scroll-root]')
      .forEach((el) => { el.scrollTop = 0; });
  }, []);

  /**
   * Blank-area click on a panel → back to the start page.
   * (Same behaviour as the Settings backdrop; the user asked for this
   * wiring on Tabs / History / Bookmarks as well.)
   */
  const goHome = useCallback(() => navigate(VIEWS.MAIN), [navigate]);

  /* ------------------------ global action map ------------------------ */
  /** Single dispatcher for every universal shortcut (see hook docs). */
  const handleAction = useCallback(
    (action) => {
      switch (action) {
        case 'focus-search': handleFocusSearch(); break;
        case 'open-settings': navigate(VIEWS.SETTINGS); break;
        case 'open-history': navigate(VIEWS.HISTORY); break;
        case 'open-bookmarks': navigate(VIEWS.BOOKMARKS); break;
        case 'close': navigate(VIEWS.MAIN); break;
        case 'clear-search': handleClearSearch(); break;
        case 'back': goBack(); break;
        case 'forward': goForward(); break;
        case 'next-view': cycleView(1); break;
        case 'prev-view': cycleView(-1); break;
        case 'refresh': handleRefresh(false); break;
        case 'hard-refresh': handleRefresh(true); break;
        default: break;
      }
    },
    [
      cycleView,
      goBack,
      goForward,
      handleClearSearch,
      handleFocusSearch,
      handleRefresh,
      navigate,
    ],
  );

  useViewShortcuts({ onAction: handleAction, searchInputRef });

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

      {/* TABS — open sessions (blank area click → home) */}
      <ViewPanel active={activeView === VIEWS.TABS} view={VIEWS.TABS}>
        <TabsView tabs={filtered.tabs} onBack={goHome} />
      </ViewPanel>

      {/* HISTORY (blank area click → home) */}
      <ViewPanel active={activeView === VIEWS.HISTORY} view={VIEWS.HISTORY}>
        <HistoryView items={filtered.history} onBack={goHome} />
      </ViewPanel>

      {/* BOOKMARKS (blank area click → home) */}
      <ViewPanel active={activeView === VIEWS.BOOKMARKS} view={VIEWS.BOOKMARKS}>
        <BookmarksView items={filtered.bookmarks} onBack={goHome} />
      </ViewPanel>

      {/* SETTINGS — modal layer (backdrop click → home) */}
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
