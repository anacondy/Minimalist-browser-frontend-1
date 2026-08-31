/**
 * SettingsView — modal preferences panel.
 * ------------------------------------------------------------------
 * - Backdrop click closes (stopPropagation guards the panel itself).
 * - Account "sync" and dock alignment toggles are fully wired.
 * - Shortcut list is data-driven from constants.js.
 * - Modal scrolls internally on short screens instead of clipping.
 */
import { LogOut, User, X } from 'lucide-react';
import { SEARCH_POSITION, SHORTCUTS } from '../constants.js';

/**
 * @param {{
 *   isAccountSynced: boolean,
 *   onToggleSync: () => void,
 *   searchPosition: 'raised'|'bottom',
 *   onToggleSearchPosition: () => void,
 *   onClose: () => void,
 * }} props
 */
export default function SettingsView({
  isAccountSynced,
  onToggleSync,
  searchPosition,
  onToggleSearchPosition,
  onClose,
}) {
  return (
    // Backdrop: click outside the panel to dismiss.
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-soft px-4"
      onClick={onClose}
      role="presentation"
    >
      {/* Panel: stopPropagation so inner clicks never close it. */}
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Preferences"
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-neutral-800 bg-black/60 p-6 md:p-8"
      >
        <header className="mb-6 flex items-center justify-between border-b border-neutral-800 pb-4">
          <h3 className="text-xl font-bold tracking-widest text-white">
            PREFERENCES
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="-mr-2 p-2 text-neutral-500 transition-colors hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        <div className="space-y-7">
          {/* Account sync mock */}
          <div className="flex flex-col gap-3">
            <p className="font-mono text-xs tracking-widest text-neutral-400 md:text-sm">
              DATA SYNC
            </p>

            {isAccountSynced ? (
              <button
                type="button"
                onClick={onToggleSync}
                className="flex w-full items-center justify-between rounded border border-green-900/50 bg-green-950/20 p-4 transition-colors hover:bg-black"
              >
                <span className="flex items-center gap-3 text-green-500">
                  <User size={18} />
                  <span className="text-sm font-bold tracking-wider">
                    SYNCED VIA GOOGLE
                  </span>
                </span>
                <LogOut size={16} className="text-neutral-500" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleSync}
                className="flex w-full items-center justify-center gap-3 rounded border border-neutral-800 p-4 text-neutral-300 transition-all hover:border-white hover:bg-white hover:text-black"
              >
                <User size={18} aria-hidden="true" />
                <span className="text-sm font-bold tracking-wider">
                  CONNECT ACCOUNT
                </span>
              </button>
            )}

            <p className="font-mono text-[10px] tracking-widest text-neutral-600">
              {isAccountSynced
                ? 'REAL BOOKMARKS & HISTORY LOADED.'
                : 'SHOWING PREFIXED GUEST DATA.'}
            </p>
          </div>

          {/* Search dock split */}
          <div className="flex items-center justify-between gap-4 border-t border-neutral-800 pt-6">
            <p className="font-mono text-xs tracking-widest text-neutral-400 md:text-sm">
              SEARCH ALIGNMENT
            </p>
            <button
              type="button"
              onClick={onToggleSearchPosition}
              className="rounded border border-neutral-700 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-white hover:text-black md:px-4 md:text-xs"
            >
              {searchPosition === SEARCH_POSITION.BOTTOM
                ? 'ZERO OFFSET'
                : 'RAISED (TASKBAR)'}
            </button>
          </div>

          {/* Shortcut reference */}
          <div className="border-t border-neutral-800 pt-6">
            <p className="mb-4 font-mono text-xs tracking-widest text-neutral-400 md:text-sm">
              ACTIVE BINDS
            </p>
            <div className="grid grid-cols-1 gap-3 font-mono text-[10px] text-neutral-500 sm:grid-cols-2 md:text-xs">
              {SHORTCUTS.map(({ keys, action }) => (
                <div key={keys}>
                  <span className="text-neutral-300">{keys}</span> : {action}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
