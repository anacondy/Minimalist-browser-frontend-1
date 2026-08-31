#!/usr/bin/env bash
# ============================================================================
# SYS® Minimalist Browser — Arch Linux one-time setup (Tauri v2 deps + Rust)
# ----------------------------------------------------------------------------
# Usage:  npm run tauri:setup        (or: bash scripts/setup-arch.sh)
#
# What it does:
#   1. Refreshes pacman mirrors (fixes "failed to retrieve file ... 404"
#      errors from stale/broken mirrors).
#   2. Installs every Tauri v2 system dependency from official repos.
#   3. Installs the Rust toolchain (rustup) if cargo is missing and pins
#      the stable toolchain.
#   4. Runs `npm install` so the project is ready for `npm run tauri:dev`.
#
# Safe to re-run: pacman --needed, npm install, rustup are all idempotent.
# ============================================================================
set -euo pipefail

if ! command -v pacman >/dev/null 2>&1; then
  echo "✗ This script is for Arch Linux only (no pacman found)."
  exit 1
fi

echo "==> [1/4] Refreshing pacman mirrors (fixes 404 downloads)…"
sudo pacman -S --needed --noconfirm reflector
sudo reflector --latest 20 --protocol https --sort rate --save /etc/pacman.d/mirrorlist
sudo pacman -Syy

echo "==> [2/4] Installing Tauri v2 system dependencies…"
sudo pacman -S --needed --noconfirm \
  webkit2gtk-4.1 \
  base-devel \
  curl \
  wget \
  file \
  openssl \
  appmenu-gtk-module \
  libappindicator-gtk3 \
  librsvg \
  xdotool

echo "==> [3/4] Rust toolchain…"
if ! command -v cargo >/dev/null 2>&1; then
  # Non-interactive install (uses defaults).
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  # shellcheck disable=SC1091
  . "$HOME/.cargo/env"
else
  echo "   cargo already installed: $(cargo --version)"
fi
rustup default stable 2>/dev/null || true
echo "   $(rustc --version) / $(cargo --version)"

echo "==> [4/4] JavaScript dependencies…"
npm install

cat <<'EOF'

─────────────────────────────────────────────────────────────
  All set! Start the native SYS® window with:

      npm run tauri:dev

  (first run compiles the Rust crate — allow 5–10 min.)
─────────────────────────────────────────────────────────────
EOF
