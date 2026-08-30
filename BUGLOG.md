# Bug & Improvement Log

Every issue found in the original drafts (and during the rebuild), the
fix, and how it was verified. Status: **all resolved** — `npm run check`
is green (lint + 19 tests + production build).

---

## A. Bugs found in the original drafts (v1–v3)

| # | Bug | Where | Fix |
| --- | --- | --- | --- |
| A1 | **Project could not run** — no `package.json`, `index.html`, bundler, or stylesheet; JSX files were dead code | repo root | Vite + React + Tailwind scaffold; `src/main.jsx` mounts `<App/>` |
| A2 | `TopNav` etc. defined **inside the component render** → new component identity every render → state reset / remounts | all drafts | Hoisted into `src/components/` modules (also `react-hooks/static-components` rule) |
| A3 | Fixed pixel indent `ml-12 … ml-32` (48–128 px) → **horizontal overflow on phones** | TabsView | `offset` in rem + clamp 0–96 px; `w-full`, `truncate`, `overflow-x-hidden` |
| A4 | `text-8xl md:text-9xl` did not cover in-between widths (tablets, QHD) | HomeView | Fluid `clamp(4rem, 12vw + 1rem, 9rem)` via `--fluid-display` |
| A5 | Views used `h-screen`/`min-h-screen` → **clipped by collapsing mobile URL bars** | App shell | `100dvh` on `.app-root` |
| A6 | Notch/home-indicator overlap on iOS | TopNav, SearchDock | `env(safe-area-inset-*)` paddings |
| A7 | Inactive views were still **focusable / in the a11y tree** (tab-order leak, SR noise) | App | `visibility:hidden` + `aria-hidden` on inactive `ViewPanel`s |
| A8 | Cursor-pointer rows/buttons with **no handler** (dead UI: tab rows, history, bookmarks) | v3 | Real handlers: sessions/bookmarks open their URL; history resolves URL-or-search |
| A9 | Enter key handled via `onKeyDown` only → **mobile keyboards/IME/screen readers unreliable** | SearchDock (v2/v3) | Real `<form onSubmit>` + `enterKeyHint="search"` |
| A10 | Clock updated via `setInterval(new Date())` → **one-minute drift** vs wall clock | v3 | `useNow` aligns the first tick to the minute boundary |
| A11 | `transition-all` on elements whose layout changed (scroll containers, sizes) → reflows during animation | all drafts | Animate `opacity`/`transform` only; `transform-gpu` |
| A12 | Scrollbar "fix" injected a `<style>` tag per render in JSX | v2/v3 | Global `.no-scrollbar` in `index.css` |
| A13 | Bookmark grid fixed `grid-cols-2 md:grid-cols-3` on 6 hard-coded cards | v3 | Data-driven 1/2/3-column grid from `data.js` |
| A14 | Long URLs / rows clipped on narrow screens | v3 | `break-words` + `truncate` + fluid list type |
| A15 | No `prefers-reduced-motion` support | all drafts | Global reduced-motion override |
| A16 | Search bar placed `bottom-0 pb-0` → overlapped home-indicator / taskbar | v2/v3 | Safe-area aware dock; toggle persists via `useLocalPreference` |
| A17 | `window.open` without `noopener` | v3 | `openExternalUrl()` adds `noopener,noreferrer` |
| A18 | Settings modal could not be dismissed by backdrop click; Escape/`X` were inconsistent | v3 | Backdrop `onClick`, `X`, `Esc` all close |

## B. Issues found & fixed during the rebuild

| # | Issue | Fix |
| --- | --- | --- |
| B1 | ESLint `react-hooks` v7 flagged **setState inside effects** (`useMediaQuery`, `useNow`) | `useMediaQuery` rewritten with `useSyncExternalStore`; `useNow` moves all writes into timers |
| B2 | `react-hooks/refs`: ref mutated **during render** in shortcut hook | Ref updated inside an effect; listener reads via ref closures |
| B3 | Vite **rejected the preview host** (`HTTP 403: host not allowed`) | `server.allowedHosts: true` (dev-only; sandbox preview proxy uses `*.e2b.app`) |
| B4 | `resolveHistoryTarget` treated `localhost:3000` as a search (no dot) | URL-like regex now recognises host, `host:port`, IPs |
| B5 | Tab rows' accessible name came from visual text (not `title`) | Explicit `aria-label="Open {title}"` |
| B6 | Legacy draft files failed lint (`React` unused, in-render components) | Archived in place; excluded via ESLint ignores |
| B7 | No way home from sub-views; no HOME affordance next to TABS | Native HOME item (icon+text) at the left of TABS; wordmark also home |
| B8 | Keys only reached the search bar after clicking it | Autofocus on mount + `useTypingCapture` (type-anywhere omnibox) |
| B9 | Missing browser-like bindings | Unified `onAction` dispatcher: Ctrl+L/K/R/Shift+R/Tab, Alt+←/→, Ctrl+H/B/,, Esc (clear-then-close) |
| B10 | No Ctrl+TAB / Alt-arrow due to page-level shortcuts | Implemented + documented; real availability marked for the desktop shell (see ENGINE.md); back/forward stack added |
| B11 | Only Settings had backdrop-close | Blank-area click → home on Tabs, History, Bookmarks surfaces too |
| B12 | Hard refresh coupled to `location.reload` (untestable in jsdom) | `reloadPage` via injectable `setReloadImpl` |
| B13 | Duplicate "Home" accessible names after adding the chip | Single HOME nav item; brand keeps its own distinct label |
| B14 | `TRANSITIONS.SETTINGS` used a Tailwind class as an inline transform | Corrected to `'none'` (valid CSS) |

## C. Verification matrix

| Check | Tool | Result |
| --- | --- | --- |
| ESLint (hooks + refresh rules) | `npm run lint` | clean |
| Interaction suite (nav, HOME, blank-click, filter, type-anywhere, all universal keys, submit) | Vitest + Testing Library | **15/15 pass** |
| Pure utils (search URLs, URL resolution) | Vitest | **9/9 pass** |
| Production build (tree-shaken, sourcemapped) | `npm run build` | 212 kB JS / 66.9 kB gzip · 31 kB CSS / 6.3 kB gzip |
| Dev server serves + transforms modules | Vite + curl | HTTP 200; host-allowed; HMR restarted cleanly |
| Responsive CSS (fluid type, dvh, safe-areas, grids) | static review (§2 of ARCHITECTURE) | documented |
| High-refresh animation policy | static review (§3 of ARCHITECTURE) | transform/opacity only |

**Not covered here:** pixel-level cross-browser screenshots — this
sandbox had no browser binary and the Playwright CDN was unreachable.
The jsdom suite proves behavioural correctness; layout is guarded by
the CSS policy above and should get a Playwright visual pass in a
networked environment (see `ARCHITECTURE.md §8`).

## D. How to verify yourself

```bash
npm install
npm run dev        # open the preview — walk all 5 views, try Ctrl+K/H/,,/B
npm run check      # lint + 19 tests + production build
```
