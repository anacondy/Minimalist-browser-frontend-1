# Engine Strategy — Real Browser Engine?

> Research-driven answer to: *"we need to add a proper engine (chromium or
> gecko or any other better)… fast, very light weight, optimized for Linux
> & especially Arch Linux. Can we achieve that? What are the best ways?"*

**Short answer: yes — it's achievable, but the right move is *staged*.**
We first ship the front-end inside a **Tauri v2 shell (WebKitGTK)** for a
~3–10 MB / 40–80 MB RAM app on Arch today, and we keep the door open to
**Servo** (Rust, embeddable, Linux-first) as the long-term engine — not
Electron, and not a hand-rolled CEF port.

---

## 1. The options, honestly compared

| | Electron (bundled Chromium) | Tauri v2 (system WebView / WebKitGTK) | Servo (embed as crate) |
| --- | --- | --- | --- |
| Bundle size | 120–200 MB | **3–10 MB** | ~tens of MB (engine included) |
| Idle RAM | 150–400 MB | **40–80 MB** | 60–150 MB (younger, growing) |
| Cold start | 2–5 s | **< 200 ms** | fast (Rust, no Node) |
| Engine | Chromium (consistent, heavy) | WebKitGTK (already installed on Arch) | **Servo 0.4.0 — Rust-native, memory-safe, parallel** |
| Arch Linux | fine but bloats the system | **uses `webkit2gtk-4.1` from the official repo** | builds cleanly on Arch; niche |
| Web compatibility | best | good | **rough edges (0.x)** |
| Dev cost | JS-only | small Rust seam | **high** (engine is pre-1.0, docs young) |
| Security model | Chromium sandbox | least-privilege permissions | memory-safe by construction |

Sources: Tauri/Electron footprint & trade-offs ([1](https://rustify.rs/articles/rust-tauri-vs-electron-2026), [2](https://www.pkgpulse.com/guides/electron-vs-tauri-2026), [3](https://techloghub.com/compare/tauri-vs-electron)); Tauri's Linux/Arch deps — `webkit2gtk-4.1`, `base-devel`, `openssl`, `librsvg`, `xdotool` ([4](https://tauri.app/start/prerequisites/), [5](https://tauri.app/blog/tauri-2-0-0-alpha-3/)); Servo 0.1.0/0.4.0 embeddable Rust engine + LTS + servoshell/Verso ([6](https://byteiota.com/servo-0-1-0-ships-on-crates-io-embeddable-rust-browser/), [7](https://en.wikipedia.org/wiki/Servo_(software)), [8](https://book.servo.org/), [9](https://github.com/servo/servo/discussions/28608)); WebKitGTK-on-Linux perf caveats ([10](https://news.ycombinator.com/item?id=41565888)); numbers in §1.1: ([11](https://www.reddit.com/r/rust/comments/1t6fw7s/servofetch_embedding_the_servo_browser_engine_as/), [12](https://hn.nuxt.dev/item/45643357), [13](https://news.ycombinator.com/item?id=25125325), [14](https://tech-insider.org/tauri-vs-electron-2026/), [15](https://blog.openreplay.com/comparing-electron-tauri-desktop-applications/), [16](https://github.com/cjpais/Handy/issues/1279)).

## 1.1 Tauri v2 shell vs Servo — RAM & ROM, the honest numbers

"ROM" = disk/installer footprint; "RAM" = resident memory at idle / per page.
These are community-measured ranges for comparable minimal apps; measure
your own build before committing either.

| Metric | Tauri v2 shell (WebKitGTK) | Servo (embedded engine) |
| --- | --- | --- |
| **App installer (ROM)** | **~3–10 MB**; deb/rpm ~4 MB because WebKitGTK is a system dep; AppImage ~76 MB (it embeds WebKitGTK) ([14](https://tech-insider.org/tauri-vs-electron-2026/), [15](https://blog.openreplay.com/comparing-electron-tauri-desktop-applications/)) | **30–72 MB binary** for an embedded engine app (30 MB compressed); full servoshell desktop app ~270 MB; minimal custom (no JS engine) builds ~10–15 MB ([11](https://www.reddit.com/r/rust/comments/1t6fw7s/servofetch_embedding_the_servo_browser_engine_as/), [12](https://hn.nuxt.dev/item/45643357)) |
| **System deps** | `webkit2gtk-4.1` (already installed once on Arch, shared by every WebKitGTK app — not duplicated per app) | none — self-contained Rust engine, but *your app ships the whole engine* (no sharing) |
| **Idle RAM** | **~20–80 MB** typical (42 MB measured single-window; ~80 MB heavy window) ([14](https://tech-insider.org/tauri-vs-electron-2026/), [15](https://blog.openreplay.com/comparing-electron-tauri-desktop-applications/), [1](https://rustify.rs/articles/rust-tauri-vs-electron-2026)); the WebKitWebProcess adds real content cost — some WebKitGTK apps seen at ~250 MB after a fresh launch, and it can be leak-prone ([16](https://github.com/cjpais/Handy/issues/1279)) | **~100 MB+ even for simple pages** (older measurement, still the honest ballpark) ([13](https://news.ycombinator.com/item?id=25125325)); real-world pages measure **"a bit higher than Firefox with the same tabs"** → expect ~200–400 MB on JS-heavy sites ([12](https://hn.nuxt.dev/item/45643357)); ~3× less RAM than Ladybird ([12](https://hn.nuxt.dev/item/45643357)) |
| **Startup** | **~190–380 ms** ([14](https://tech-insider.org/tauri-vs-electron-2026/), [2](https://rustify.rs/articles/rust-tauri-vs-electron-2026)) | no official published figure; engine-sized init, generally comparable but unmeasured here |
| **Linux/Arch fit** | excellent — official pacman dep, tiny binary | excellent build-wise (`cargo`), but heavier per-app ROM and 0.x web compatibility |
| **Who it wins for** | **smallest ROM + lowest typical RAM** on Arch, right now | **independence** (no WebKit dep, memory-safe, parallel) + full control, later |

### The key insight
- **Tauri v2 wins ROM + typical idle RAM.** ~4 MB deb. RAM numbers stay low because the UI is one lightweight web page and the system WebKitGTK is *shared*.
- **Servo is NOT automatically "lighter."** Its engine costs **30–72 MB ROM** (270 MB for the demo browser) and **~100–400 MB RAM for real pages** — the "lightweight" story is *no Chromium/Node bundled*, not *less per-page memory* ([11](https://www.reddit.com/r/rust/comments/1t6fw7s/servofetch_embedding_the_servo_browser_engine_as/), [12](https://hn.nuxt.dev/item/45643357), [13](https://news.ycombinator.com/item?id=25125325)).
- So: **Tauri v2 (WebKitGTK) for the Arch-first, light-RAM/ROM product now; Servo only if we later want engine ownership (or a truly dependency-free build) and can accept its size/compat profile.**

## 2. Why **not** Electron (for this project)

- Electron *is* a full Chromium — but it ships **Node.js + Chromium per
  app**: 100 MB+ installers, 150–400 MB idle RAM. That directly fights
  the "very light weight" and "Arch-optimized" goals.
- Each app then owns its own Chromium security patch cadence.

## 3. Why **not** hand-rolled CEF/WebKit embedding first

Embedding Chromium via CEF or WebKit via `webkit2gtk` directly means
owning window management, IPC, navigation, crash handling, packaging and
(WebKitGTK) the known GPU/performance lament on Linux ([10](https://news.ycombinator.com/item?id=41565888)). **Tauri v2 already solved all of that**
and gives us the Rust backend + safe IPC for free.

## 4. The recommendation: two-stage

### Stage 1 — Tauri v2 shell (ship now, Arch-ready) ✅ WIRED
- **Frontend = the exact React/Vite app we already have** (works as-is).
- Shell = Rust + Tauri, window chrome + per-view WebView navigation.
- **Status in this repo:** scaffolded & wired — `src-tauri/` (Rust
  commands `open_tab`, `close_tab`, `tab_navigate`, `tab_reload`),
  `src/native.js` bridge (real tab windows in the shell; browser-tab
  fallback in the web preview), generated icons, `npm run tauri:dev`
  / `tauri:build` scripts.
- **What could NOT be verified in this sandbox:** compiling/running the
  Rust side. The sandbox has no Rust and its firewall blocks
  `static.rust-lang.org` + `crates.io` (only GitHub/npm are reachable),
  so a full `cargo build` is impossible here. Verified instead:
  `tauri info` parses the config (`tauri 🦀: 2`, icons OK) and the
  front-end suite runs in browser-fallback mode (29/29 tests). First
  `npm run tauri:dev` on the user's machine is the real smoke test.
- Arch install/devel:
  ```bash
  sudo pacman -Syu
  sudo pacman -S --needed webkit2gtk-4.1 base-devel curl wget file \
    openssl appmenu-gtk-module libappindicator-gtk3 librsvg xdotool
  ```
  (Tauri v2 + wry docs: `webkit2gtk-4.1` on Arch/Manjaro — [5](https://tauri.app/blog/tauri-2-0-0-alpha-3/), [4](https://tauri.app/start/prerequisites/)).
- **This is a real browser shell from day one**: page views become real
  WebView tabs, history/bookmarks bind to real navigation, the
  search-URL bar (Ctrl+L) navigates pages, Alt+←/→ and Ctrl+Tab stop
  being "-not-received-by-the-page" and become fully ours (native
  accelerators). Alt+←/→ and Ctrl+Tab are reserved by the *top-level*
  browser; inside a desktop shell we own them ([declared in the shortcut hook](../src/hooks/useViewShortcuts.js)).

### Stage 2 — evaluate Servo as the engine (the "better" option)
- **Servo 0.4.0 is a real, embeddable Rust engine** (`ServoBuilder` /
  `WebView`), Linux-first, memory-safe, GPU-accelerated — no Chromium,
  no WebKitGTK, no FFI ([6](https://byteiota.com/servo-0-1-0-ships-on-crates-io-embeddable-rust-browser/)). It even ships an **LTS track** now.
- The catch: **web compatibility gaps** — it's a 0.x engine. Realistic
  plan: build the Tauri shell first, make the *view layer* abstract
  (a `WebViewHost` trait), and run a servo-gtk / tauri-runtime-verso
  spike on Arch as a **proof of concept on a small feature branch**.
- Verso (the Servo-based browser) and servo-gtk show embed patterns
  ([8](https://book.servo.org/), [9](https://github.com/servo/servo/discussions/28608), [7](https://en.wikipedia.org/wiki/Servo_(software))). A successful spike = drop-in engine swap
  with a much smaller footprint; a failing one costs us nothing because
  the front-end is engine-agnostic.

## 5. What "optimized for Linux / Arch" concretely means for us

- **No bloat**: Tauri binaries ~3–10 MB; no Chromium/Node deliverable.
- **Arch-native deps**: `webkit2gtk-4.1` is in `extra`/community repos;
  ship an **AUR/PKGBUILD-ready** packaging script.
- **Perf policy** (already in the front-end): compositor-only transitions,
  `transform-gpu`, lazy blur, reduced-motion support, zero image assets,
  ~67 kB gzip JS. Perfect for low-end or integrated-GPU Arch boxes.
- **Rust core** can eventually do: real history DB (SQLite via `rusqlite`),
  real bookmarks, downloads, keyboard accelerators, session restore.

## 6. What this front-end needs to be shell-ready (small, safe steps)

Already done:
- Abstract `openExternalUrl` + navigation dispatcher (`src/utils.js`, `src/App.jsx`).
- Real `<form>` search submit (Ctrl+L = URL bar), data-driven views.

Next steps (each tiny):
1. Add a `nav` module: `navigate(url)`, `back()`, `forward()`, `reload()`
   currently call `window.*`; in Tauri they call the Rust `core::nav`
   commands. The web version keeps working in the browser.
2. Add a Tauri `src-tauri/` (created by `tauri init`) — **separate
   branch/PR**, not this one.
3. Add `package.json` scripts: `tauri dev`, `tauri build --bundles deb,rpm,appimage`.
4. AUR package (`PKGBUILD`) for Arch + optional Flatpak.

## 7. Verdict

> **Yes, we can achieve it.** Best path = **Tauri v2 (WebKitGTK) now for
> a genuinely light Arch app, with an abstracted view layer and a Servo
> spike (feature branch) as the "better engine" bet.** Electron is the
> only option we should actively avoid; hand-rolled WebKit/CEF is
> unnecessary work that Tauri already did.

*Research snapshot: 2026-08-31. Engine releases move fast — re-verify
Servo's current web-compat status before committing to Stage 2.*
