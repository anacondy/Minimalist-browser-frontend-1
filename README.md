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
| `npm run test` | Vitest suite (`src/*.test.jsx`) — 29 tests |
| `npm run check` | lint → test → build (CI-style gate) |
| `npm run tauri:dev` | Run the **desktop app** (Tauri v2 shell + Vite) |
| `npm run tauri:build` | Build installers (deb / rpm / AppImage) |

## Desktop shell (Tauri v2) — Arch Linux

> **Note:** the rebuilt app (package.json, `src/`, `src-tauri/`) lives on
> branch **`arena/01a05408-minimalist-browser-frontend-1`** until PR #1 is
> merged. Cloning `main` only gives the legacy drafts:
>
> ```bash
> git clone -b arena/01a05408-minimalist-browser-frontend-1 \
>   https://github.com/anacondy/Minimalist-browser-frontend-1.git
> ```

**Fastest path — one command** (installs deps, refreshes mirrors, installs
Rust, runs npm install):

```bash
npm run tauri:setup      # = bash scripts/setup-arch.sh (Arch only)
```

Manual equivalent (Arch / Manjaro):

```bash
# Refreshing mirrors FIRST fixes "failed to retrieve file ... 404" errors
sudo pacman -S --needed reflector
sudo reflector --latest 20 --protocol https --sort rate --save /etc/pacman.d/mirrorlist
sudo pacman -Syy

# Tauri v2 system deps
sudo pacman -S --needed webkit2gtk-4.1 base-devel curl wget file \
  openssl appmenu-gtk-module libappindicator-gtk3 librsvg xdotool

# Rust (skip if already installed; then run: source ~/.cargo/env)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# run / build (inside the repo with the branch checked out)
npm install
npm run tauri:dev     # native window with HMR (first build: 5–10 min)
npm run tauri:build   # deb / rpm / AppImage in src-tauri/target/release/bundle
```

How the shell works:
- `src-tauri/` — Rust crate: hosts the front-end and exposes native
  commands (`open_tab`, `close_tab`, `tab_navigate`, `tab_reload`).
- `src/native.js` — front-end bridge: in the desktop shell, opening a
  session/bookmark/search creates a **real Tauri tab window**; in the
  web preview it falls back to a browser tab. See [ENGINE.md](./ENGINE.md).

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
├── ENGINE.md                   # engine research + RAM/ROM comparison + roadmap
├── src-tauri/                  # Tauri v2 desktop shell (Rust)
│   ├── src/lib.rs              # native commands: open/close/navigate/reload tabs
│   ├── tauri.conf.json         # window, devUrl, bundle targets
│   ├── capabilities/default.json
│   ├── Cargo.toml
│   └── icons/                  # generated icon set (tauri icon)
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
