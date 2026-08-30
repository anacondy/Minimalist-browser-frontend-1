# SYS® — Minimalist Browser Frontend

A fast, responsive, keyboard-first minimalist/brutalist browser concept
UI. Built with **React 19 + Vite + Tailwind CSS v4**, restructured from
three loose JSX drafts into a proper, tested project.

> Live preview: `npm run dev` then open the printed URL.
> The dev server binds `0.0.0.0` and allows all preview hosts, so it
> works inside sandboxed/iframe previews out of the box.

---

## Features

- **Five views** — Start (SYS®), Open Sessions, History, Bookmarks, Preferences.
- **Home button** — a HOME chip sits left of TABS in the top nav and
  returns to the start page from anywhere (wordmark does too).
- **Blank-area click → home** — tapping the empty background of Tabs /
  History / Bookmarks / the Settings backdrop goes back to the start page.
- **Autofocus + type-anywhere** — the search bar is focused on load and
  any printable key typed anywhere on the page is routed straight into
  it (browser-omnibox feel).
- **Live search filtering** — one global search dock filters Tabs,
  History and Bookmarks as you type; `Enter` opens the first match
  (or a web search from the start page).
- **Browser tab bar** — a persistent tab strip shows every open session
  (01/MAIN, 02/DOCS, …); the active tab is highlighted, click to switch.
- **Universal keys** (see `src/hooks/useViewShortcuts.js`):
  `Ctrl/Cmd+L` (URL/search), `Ctrl/Cmd+K` (filter/focus),
  `Alt+← / Alt+→` (back/forward across panels), `Ctrl+R` (soft refresh),
  `Ctrl+Shift+R` (hard refresh), **`Ctrl+Tab / Ctrl+Shift+Tab`
  (next/previous OPEN TAB — real-browser semantics, never the panels)**,
  `Ctrl/Cmd+H` (history), `Ctrl/Cmd+B` (bookmarks), `Ctrl/Cmd+,` (settings),
  `Esc` (clear → close).
- **Mock account sync** — guest vs. synced datasets toggle in Settings,
  with more rows to demonstrate smooth scrolling.
- **Persistent preferences** — search-dock alignment survives reload
  (`localStorage` key `sys.search-position`).
- **Responsive & high-refresh ready** — see [ARCHITECTURE.md](./ARCHITECTURE.md).
- **Accessible** — real buttons/forms, `aria-labels`, `role=dialog`,
  `:focus-visible` ring, `prefers-reduced-motion` support.

## Stack

| Tool | Version | Purpose |
| --- | --- | --- |
| React | 19.x | UI framework |
| Vite | 8.x | Dev server + production bundler |
| Tailwind CSS | 4.x (via `@tailwindcss/vite`) | Styling |
| lucide-react | 1.x | Icon set |
| Vitest + Testing Library | 4.x / 16.x | Interaction + unit tests |
| ESLint | 10.x + `react-hooks` v7 | Static correctness checks |

## Quick start

```bash
npm install
npm run dev        # dev server (host 0.0.0.0, port 5173)
npm run check      # lint + tests + production build  ← run before commit
```

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production bundle into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint flat config (hooks + refresh rules) |
| `npm run test` | Vitest suite (`src/*.test.jsx`) — 19 tests |
| `npm run check` | lint → test → build (CI-style gate) |

## Project structure

```
.
├── index.html                  # app shell (#root + meta)
├── vite.config.js              # Vite + Vitest config (host/allowedHosts)
├── eslint.config.js            # flat config (drafts excluded)
├── src/
│   ├── main.jsx                # entry (StrictMode)
│   ├── App.jsx                 # router/orchestrator + ViewPanel
│   ├── index.css               # Tailwind + tokens + platform CSS
│   ├── constants.js            # views, shortcut meta, links
│   ├── data.js                 # guest/synced mock datasets (frozen)
│   ├── utils.js                # pure helpers (URL/search logic)
│   ├── components/             # one file per view + TopNav + SearchDock
│   ├── hooks/                  # useNow, useViewShortcuts,
│   │                           # useMediaQuery, useLocalPreference
│   └── *.test.jsx              # interaction + unit tests
├── ARCHITECTURE.md             # design + perf decisions
├── BUGLOG.md                   # bugs found → fixes → verification
├── ENGINE.md                   # real-engine research + roadmap (Tauri/Servo)
└── index.jsx, 2IMPROVEDindex.jsx, 3MOREIMPROVEDindex.jsx
                                # archived single-file drafts (unmaintained)
```

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — structure, state flow, and
  the responsive / high-refresh-rate strategy.
- **[BUGLOG.md](./BUGLOG.md)** — every bug found in the original drafts
  and during the rebuild, with fixes and how they were verified.
- **[ENGINE.md](./ENGINE.md)** — "how do we add a real engine?" research:
  Electron vs Tauri vs Servo on Linux/Arch, with a staged recommendation.

## License

MIT — see [LICENSE](./LICENSE).
