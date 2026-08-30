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
- **Live search filtering** — one global search dock filters Tabs,
  History and Bookmarks as you type; `Enter` opens the first match
  (or a web search from the start page).
- **Global keyboard bindings** — `Ctrl/Cmd+K` (focus search),
  `Ctrl/Cmd+,` (settings), `Ctrl/Cmd+H` (history), `Ctrl/Cmd+B`
  (bookmarks), `Esc` (home).
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
└── index.jsx, 2IMPROVEDindex.jsx, 3MOREIMPROVEDindex.jsx
                                # archived single-file drafts (unmaintained)
```

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — structure, state flow, and
  the responsive / high-refresh-rate strategy.
- **[BUGLOG.md](./BUGLOG.md)** — every bug found in the original drafts
  and during the rebuild, with fixes and how they were verified.

## License

MIT — see [LICENSE](./LICENSE).
