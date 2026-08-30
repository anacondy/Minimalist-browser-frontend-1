# Architecture — SYS® Minimalist Browser

This document explains how the app is structured, how state flows, and
**why** each performance/responsiveness decision was made. It is the
reference for future work.

---

## 1. Why it was rebuilt

The repository originally contained three standalone JSX files
(`index.jsx`, `2IMPROVEDindex.jsx`, `3MOREIMPROVEDindex.jsx`) with no
`package.json`, no build tooling and no HTML shell — it could not run.
The third draft had the best feature set (sync mock, live filtering,
live clock), so it was chosen as the **feature reference** and rebuilt
module-by-module in `src/`. The old drafts are kept at the repo root as
an archive (excluded from lint).

## 2. File map & responsibilities

```
src/
├── main.jsx            Mounts <App/>; StrictMode in dev.
├── App.jsx             SOLE owner of state. Routes events → views.
│                       Renders <ViewPanel> wrappers around views.
├── index.css           Tailwind import + design tokens + platform CSS.
├── constants.js        VIEWS, SEARCH_POSITION, SHORTCUTS, EXTERNAL_LINKS.
├── data.js             GUEST_DATA / SYNCED_DATA (Object.freeze'd).
├── utils.js            Pure functions: normalize, buildSearchUrl,
│                       openExternalUrl, prettifyUrl, resolveHistoryTarget.
├── components/
│   ├── TopNav.jsx      Status bar: brand/home + view switcher.
│   ├── TabStrip.jsx    Persistent browser tab bar (active-tab chrome).
│   ├── HomeView.jsx    Hero (SYS®) — typography only, zero assets.
│   ├── TabsView.jsx    Staggered session list (scrollable).
│   ├── HistoryView.jsx Cast-list history (scrollable).
│   ├── BookmarksView.jsx Responsive bookmark grid (scrollable).
│   ├── SettingsView.jsx Modal: sync mock + dock alignment + binds.
│   └── SearchDock.jsx  Global search form (contextual placeholder).
└── hooks/
    ├── useNow.js               Clock, aligned to minute boundaries.
    ├── useViewShortcuts.js     Universal browser-like key bindings
    │                           (Ctrl+L/K/R/Tab, Alt+←/→, Esc…).
    ├── useTypingCapture.js     Type-anywhere → routes keys to the dock.
    ├── useMediaQuery.js        useSyncExternalStore wrapper (unused
    │                           today; available for feature work).
    └── useLocalPreference.js   Persisted state (search dock alignment).
```

**Rule of thumb:** components are dumb (props in, events out); App
owns state; data/logic lives in `data.js` / `utils.js`. Nothing in a
component knows about localStorage or keyboard events.

## 3. State flow

```
user action (click / key / form submit)
        │
        ▼
App: navigate(view) / handleSubmit() / toggle callbacks
        │  (single source of truth: activeView, searchQuery,
        │   isAccountSynced, searchPosition, clock)
        ▼
memoised filter → dataset (GUEST or SYNCED) ∩ query
        │
        ▼
ViewPanel(i) → dumb view components render their slice
```

- `filtered` is `useMemo`-ised on `[dataset, searchQuery]`; tab/history/
  bookmark filtering is **O(n) over ≤ 13 items** — negligible.
- Datasets are frozen at module load; switching profiles just swaps the
  reference, so React reconciles cheaply.
- `searchPosition` is persisted via `useLocalPreference`
  (key `sys.search-position`) so the setting survives reloads.

## 4. View transitions (the "view switching" engine)

`ViewPanel` (inside `App.jsx`) renders every view once and toggles:

```js
{ opacity, transform, visibility, pointerEvents, zIndex }
```

Why this design:

- **Mounted once** → scroll positions survive switching.
- **`opacity`/`transform` only** → the browser never computes layout or
  paint for these transitions; they run on the compositor. This is the
  single most important high-refresh-rate optimisation (see §6).
- **`visibility: hidden`** on inactive panels → they cannot receive
  focus or appear to screen readers (`aria-hidden` mirrors it), which
  also fixes tab-order leakage from the original draft.
- `transform-gpu` promotes the animated layers.
- `prefers-reduced-motion` collapses all durations to ~0.

## 5. Responsive strategy (screen & resolution coverage)

| Problem in the drafts | Fix |
| --- | --- |
| `ml-12 … ml-32` = fixed 48–128 px indents → horizontal overflow on phones | `offset` rem value, clamped to 0–96 px via `clampOffset()`; rows use `w-full` + `truncate` |
| `text-8xl md:text-9xl` jumps between two sizes | `font-size: var(--fluid-display)` = `clamp(4rem, 12vw + 1rem, 9rem)` covering 320 px → 4K continuously |
| `h-screen`/`min-h-screen` fights mobile URL-bar resizing | `height: 100dvh` (dynamic viewport unit) on `.app-root` |
| Content hidden under notches/home-indicator | `.app-top-nav` / `.app-search-dock` pad with `env(safe-area-inset-*)` |
| Fixed `grid-cols-2 md:grid-cols-3` bookmark grid | `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` |
| Long rows/URLs clipped at one breakpoint | `break-words` + `truncate` + fluid `clamp()` type inside lists |
| Nav labels crowded phones | icon-only nav below `sm` (`hidden sm:inline` labels) |
| Views could be clipped on short screens | all scrollable views use `overflow-y-auto` + `max-h-[60–70dvh]` + `pt/pb` dock-safe padding |

Support matrix: **320 px → 4K**, portrait/landscape, mobile URL-bar
resize, iPhone notch/home-indicator, and keyboard-only usage.

## 6. High-refresh-rate (120/144/240 Hz) strategy

1. **Compositor-only animation** — all transitions animate
   `opacity`/`transform`; zero layout-triggering properties
   (`width`, `height`, `margin`, `top/left`, `filter` on large layers…).
2. **No rAF or JS-driven animation** — CSS transitions are handed to the
   compositor, which can raster at the display's refresh rate regardless
   of main-thread jank.
3. **`transform-gpu`** layer promotion on the panels; the search-dock
   glow is a separate, `pointer-events-none` layer that only changes
   opacity.
4. **Backdrop blur scoped to one layer** (`backdrop-soft`, 8 px) — blur
   is a paint cost; it exists only on the Settings modal.
5. **Cheap hover effects** — colour changes and `scale` transforms only;
   no shadows, no layout-affecting effects.
6. **No per-frame clocks** — `useNow` ticks **once per minute**
   (aligned to the minute boundary), not per frame.
7. **Reduced motion respected** → see §4.

## 7. Accessibility & correctness

- Real `<button>`/`<form>` semantics; Enter submits natively (mobile
  keyboards, IMEs, screen readers all work).
- `aria-label`s on icon buttons, `role="dialog"` + `aria-modal` on
  Settings, `aria-current` on the active nav item.
- `:focus-visible` outline + `Ctrl/Cmd+K` focuses and selects input.
- `noopener,noreferrer` on every external `window.open`.
- No `dangerouslySetInnerHTML`; all query strings pass through
  `encodeURIComponent`.

## 8. Navigation model & universal keys

View switching keeps a **back/forward stack** (`backStackRef` /
`forwardStackRef`, capped at 50) so:

- `Alt+←` pops the previous view; `Alt+→` redoes it.
- **`Ctrl+Tab` / `Ctrl+Shift+Tab` cycle the OPEN TABS (sessions) only** —
  `<TabStrip />` is the persistent tab bar and `activeTabId` is the
  selected session. Panels (home/tabs/hist/bkmk/cfg) are switched
  exclusively by TopNav, `Ctrl+H/B/,` or `Alt+←/→` — copying how a real
  browser separates tab-cycling from chrome navigation.
- `Ctrl+R` = soft refresh: clear the filter + reset scroll in place
  (no reload — mock data is static; a real data fetch plugs in here).
- `Ctrl+Shift+R` = hard refresh: full page reload (injectable impl for
  embedded shells/tests).
- Blank-area clicks on Tabs / History / Bookmarks surfaces and the
  Settings backdrop all route to the start page (`onBack` / `onClose`).
- **Typing capture**: `useTypingCapture` routes single printable keys
  into the search dock (omnibox behaviour) while modifiers pass through
  to `useViewShortcuts`, whose one `onAction` dispatcher serves every
  binding (see `src/hooks/useViewShortcuts.js` for the full table).

> **Embedded-shell note:** top-level browsers own Ctrl+Tab and
> Alt+←/→, so a page may never see them. Inside a desktop shell
> (Tauri/Electron/CEF — see `ENGINE.md`) we register them natively.

## 9. Known limitations (deliberate scope)

- Account "sync" is **mock data** — there is no backend.
- `useMediaQuery` is exported but unused (kept as a documented building
  block for pointer/hover feature work).
- jsdom tests cover behaviour, not pixel layout — design decisions
  above are verified by static CSS review and manual preview; a
  Playwright/visual pass is the natural next step when browser binaries
  are available in the environment.
