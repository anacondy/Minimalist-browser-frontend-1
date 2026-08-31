/**
 * App — SYS® Minimalist Browser (root component).
 * ------------------------------------------------------------------
 * Responsibilities:
 *  1. Owns top-level state: active view, query, sync profile, dock
 *     placement (persisted), the search input ref, and the REAL tab
 *     list when running inside the Tauri desktop shell.
 *  2. Routes user intent (nav clicks / shortcuts / submit / blank-area
 *     clicks) to views, keeping a back/forward stack for Alt+←/→.
 *  3. In the desktop shell, tabs are embedded child webviews (Tauri
 *     multi-webview) whose list streams back via `tab://updated` — the
 *     tab strip + history update in real time as pages load.
 *
 * Performance notes
 *  - Panels animate opacity/transform only (compositor-friendly).
 *  - Filtering is memoised; datasets are frozen module constants.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import TopNav from './components/TopNav.jsx';
import TabStrip from './components/TabStrip.jsx';
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
import { useTypingCapture } from './hooks/useTypingCapture.js';
import { useLocalPreference } from './hooks/useLocalPreference.js';
import {
  closeSessionTab,
  inTauri,
  listTabs,
  onTabsUpdated,
  openSessionTab,
  reloadSessionTab,
  switchSessionTab,
} from './native.js';
import {
  buildSearchUrl,
  normalize,
  prettifyUrl,
  reloadPage,
  resolveHistoryTarget,
} from './utils.js';

const MAX_HISTORY = 50;

/** Cameras for the view transition — transforms only. */
const TRANSITIONS = {
  [VIEWS.MAIN]: { off: 'scale(0.96)' },
  [VIEWS.TABS]: { off: 'translateX(-3rem)' },
  [VIEWS.HISTORY]: { off: 'scale(1.05)' },
  [VIEWS.BOOKMARKS]: { off: 'translateY(3rem)' },
  [VIEWS.SETTINGS]: { off: 'none' },
};

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

  // Desktop shell: REAL tabs streamed from Rust (embedded webviews).
  const [nativeTabs, setNativeTabs] = useState([]);
  const isNative = inTauri();

  // Web-preview only: mock session selection (Ctrl+Tab demo behavior).
  const [activeTabId, setActiveTabId] = useState(() => GUEST_DATA.tabs[0]?.id ?? null);

  // Real visitor history (desktop shell) — merged above the mock list.
  const [visited, setVisited] = useLocalPreference('sys.visit-history', []);

  const [searchPosition, setSearchPosition] = useLocalPreference(
    'sys.search-position',
    SEARCH_POSITION.RAISED,
  );

  const searchInputRef = useRef(null);
  const now = useNow();

  const activeViewRef = useRef(VIEWS.MAIN);
  const backStackRef = useRef([]);
  const forwardStackRef = useRef([]);

  /* --------------------- native tab subscriptions -------------------- */
  // `isNative` is already set from the `useState` initializer — this
  // effect only subscribes to the Rust tab stream when in the shell.
  useEffect(() => {
    if (!inTauri()) return undefined;
    let unlisten = () => {};
    // Initial list + live updates (titles arrive as pages load).
    listTabs().then(setNativeTabs).catch(() => {});
    onTabsUpdated(setNativeTabs).then((fn) => {
      unlisten = fn;
    });
    return () => unlisten();
  }, []);

  // Mirror every visited URL into real history (deduped, capped).
  useEffect(() => {
    if (!isNative) return undefined;
    setVisited((prev) => {
      const urls = new Set(prev.map((v) => v.url));
      const next = [...prev];
      for (const tab of nativeTabs) {
        if (tab.url && !urls.has(tab.url)) {
          urls.add(tab.url);
          next.unshift({ url: tab.url, title: tab.title || tab.url });
        }
      }
      return next.slice(0, MAX_HISTORY).reverse().reverse().slice(0, MAX_HISTORY);
    });
  }, [isNative, nativeTabs, setVisited]);

  /* --------------------------- derived data --------------------------- */
  const dataset = isAccountSynced ? SYNCED_DATA : GUEST_DATA;

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

  // History = real visits (most recent first) + mock entries, filtered
  // live by the search query (real + mock names/roles both match).
  const mergedHistory = useMemo(() => {
    const all = [
      ...visited.slice(0, 30).map((v) => ({
        id: `v-${v.url}`,
        role: 'visited',
        name: prettifyUrl(v.url),
        isActive: false,
      })),
      ...dataset.history,
    ];
    const q = normalize(searchQuery);
    if (!q) return all;
    return all.filter(
      (h) => normalize(h.name).includes(q) || normalize(h.role).includes(q),
    );
  }, [dataset, searchQuery, visited]);

  const nativeActiveLabel = useMemo(
    () => nativeTabs.find((t) => t.active)?.label ?? null,
    [nativeTabs],
  );

  /* ---------------------------- navigation ---------------------------- */
  const navigate = useCallback((view) => {
    const prev = activeViewRef.current;
    if (prev === view) return;
    backStackRef.current.push(prev);
    if (backStackRef.current.length > MAX_HISTORY) backStackRef.current.shift();
    forwardStackRef.current = [];
    activeViewRef.current = view;
    setActiveView(view);
    if (view !== VIEWS.MAIN) setSearchQuery('');
  }, []);

  const goBack = useCallback(() => {
    const prev = backStackRef.current.pop();
    if (prev === undefined) return;
    forwardStackRef.current.push(activeViewRef.current);
    activeViewRef.current = prev;
    setActiveView(prev);
  }, []);

  const goForward = useCallback(() => {
    const next = forwardStackRef.current.pop();
    if (next === undefined) return;
    backStackRef.current.push(activeViewRef.current);
    activeViewRef.current = next;
    setActiveView(next);
  }, []);

  /* ----------------------------- tab engine --------------------------- */
  // Ctrl+Tab / Ctrl+Shift+Tab — real tabs in the shell (HOME + open
  // tabs); in the web preview, cycles the mock session list.
  const cycleTab = useCallback(
    (step) => {
      if (isNative) {
        const keys = ['home', ...nativeTabs.map((t) => t.label)];
        const active = nativeActiveLabel ?? 'home';
        const index = keys.indexOf(active);
        const next = keys[(index + step + keys.length) % keys.length];
        switchSessionTab(next);
        return;
      }
      const tabs = dataset.tabs;
      if (tabs.length === 0) return;
      const index = tabs.findIndex((t) => t.id === activeTabId);
      const next = tabs[(index + step + tabs.length) % tabs.length];
      if (next) setActiveTabId(next.id);
    },
    [activeTabId, dataset, isNative, nativeActiveLabel, nativeTabs],
  );

  // Ctrl+T — new embedded tab (about:blank + our dark theme).
  const handleNewTab = useCallback(() => {
    if (!isNative) return;
    openSessionTab('about:blank', 'NEW SESSION', { newTab: true });
  }, [isNative]);

  // Ctrl+W — close the active embedded tab.
  const handleCloseTab = useCallback(() => {
    if (!isNative || !nativeActiveLabel) return;
    closeSessionTab(nativeActiveLabel);
  }, [isNative, nativeActiveLabel]);

  /* ------------------------ search / omnibox -------------------------- */
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleGlobalType = useCallback((char) => {
    setSearchQuery((query) => query + char);
    searchInputRef.current?.focus();
  }, []);
  useTypingCapture({ onType: handleGlobalType });

  const handleFocusSearch = useCallback(() => {
    if (activeViewRef.current === VIEWS.SETTINGS) navigate(VIEWS.MAIN);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
  }, [navigate]);

  const handleClearSearch = useCallback(() => setSearchQuery(''), []);

  /* ------------------------------ refresh ----------------------------- */
  const handleRefresh = useCallback(
    (hard) => {
      if (hard) {
        reloadPage();
        return;
      }
      // Soft refresh: nearest equivalent to a page refresh.
      if (isNative && nativeActiveLabel) reloadSessionTab(nativeActiveLabel);
      setSearchQuery('');
      document.querySelectorAll('[data-scroll-root]').forEach((el) => {
        el.scrollTop = 0;
      });
    },
    [isNative, nativeActiveLabel],
  );

  const goHome = useCallback(() => navigate(VIEWS.MAIN), [navigate]);

  /* ------------------------ global action map ------------------------ */
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
        case 'next-tab': cycleTab(1); break;
        case 'prev-tab': cycleTab(-1); break;
        case 'new-tab': handleNewTab(); break;
        case 'close-tab': handleCloseTab(); break;
        case 'refresh': handleRefresh(false); break;
        case 'hard-refresh': handleRefresh(true); break;
        default: break;
      }
    },
    [
      cycleTab,
      goBack,
      goForward,
      handleClearSearch,
      handleCloseTab,
      handleFocusSearch,
      handleNewTab,
      handleRefresh,
      navigate,
    ],
  );

  useViewShortcuts({ onAction: handleAction, searchInputRef });

  /* ------------------------- search submit ---------------------------- */
  const handleSubmit = useCallback(() => {
    const q = searchQuery.trim();
    if (!q) return;

    // Filter views: open the first matching entry in a NEW tab.
    if (activeView !== VIEWS.MAIN) {
      const pool = filtered[activeView] ?? [];
      const first = pool[0];
      if (first) {
        openSessionTab(
          activeView === VIEWS.HISTORY
            ? resolveHistoryTarget(first.name)
            : first.url,
          first.title ?? first.name,
          { newTab: true },
        );
        return;
      }
    }

    // Address-bar search: reuses the ACTIVE tab (browser-style — no
    // tab explosion), DuckDuckGo Lite (light + no reCAPTCHA wall).
    openSessionTab(buildSearchUrl(q), q, { newTab: false });
    setSearchQuery('');
  }, [activeView, filtered, searchQuery]);

  /* ---------------------- tab strip rendering ------------------------ */
  const tabStripItems = useMemo(() => {
    if (isNative) {
      // HOME pseudo-tab + the real embedded tabs (live from Rust).
      return [
        { key: 'home', label: '01/MAIN', title: 'START PAGE', isHome: true },
        ...nativeTabs.map((t, i) => ({
          key: t.label,
          label: `0${i + 2}/SRCH`,
          title: t.title || t.url || 'NEW SESSION',
          isHome: false,
        })),
      ];
    }
    // Web preview: the mock session list (demo behaviour).
    return dataset.tabs.map((t) => ({
      key: String(t.id),
      label: t.label,
      title: t.title,
      isHome: false,
    }));
  }, [dataset, isNative, nativeTabs]);

  const handleSelectTab = useCallback(
    (key) => {
      if (isNative) switchSessionTab(key);
      else setActiveTabId(Number(key));
    },
    [isNative],
  );

  /* ------------------------------ render ------------------------------ */
  return (
    <div className="app-root select-text text-neutral-200 selection:bg-white selection:text-black">
      <TopNav activeView={activeView} onNavigate={navigate} now={now} />

      <TabStrip
        items={tabStripItems}
        activeKey={isNative ? (nativeActiveLabel ?? 'home') : String(activeTabId)}
        onSelect={handleSelectTab}
        onNewTab={isNative ? handleNewTab : undefined}
      />

      <ViewPanel active={activeView === VIEWS.MAIN} view={VIEWS.MAIN}>
        <HomeView />
      </ViewPanel>

      <ViewPanel active={activeView === VIEWS.TABS} view={VIEWS.TABS}>
        <TabsView tabs={filtered.tabs} onBack={goHome} />
      </ViewPanel>

      <ViewPanel active={activeView === VIEWS.HISTORY} view={VIEWS.HISTORY}>
        <HistoryView items={mergedHistory} onBack={goHome} />
      </ViewPanel>

      <ViewPanel active={activeView === VIEWS.BOOKMARKS} view={VIEWS.BOOKMARKS}>
        <BookmarksView items={filtered.bookmarks} onBack={goHome} />
      </ViewPanel>

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
