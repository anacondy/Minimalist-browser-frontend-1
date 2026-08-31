/**
 * TopNav — status bar / primary navigation.
 * ------------------------------------------------------------------
 * - Left: brand (acts as HOME) + live date & time.
 * - Right: view switches (Tabs / Hist / Bkmk / Cfg).
 * - Responsive: labels collapse to icons below `md` so four actions
 *   never crowd a phone's width.
 * - mix-blend-difference keeps text legible over any view content.
 *
 * Only text colour changes on hover (no layout shift) and buttons get
 * proper `aria-*` attributes for screen readers.
 */
import { Bookmark, History, Home, Layers, Settings } from 'lucide-react';
import { VIEWS } from '../constants.js';

const NAV_ITEMS = [
  // Home always leads back to the start page, from anywhere.
  { view: VIEWS.MAIN, label: 'HOME', title: 'Home', Icon: Home },
  { view: VIEWS.TABS, label: 'TABS', title: 'Open sessions', Icon: Layers },
  { view: VIEWS.HISTORY, label: 'HIST', title: 'History', Icon: History },
  { view: VIEWS.BOOKMARKS, label: 'BKMK', title: 'Bookmarks', Icon: Bookmark },
  { view: VIEWS.SETTINGS, label: 'CFG', title: 'Settings', Icon: Settings },
];

/**
 * @param {{ activeView: string, onNavigate: (view: string) => void, now: Date }} props
 */
export default function TopNav({ activeView, onNavigate, now }) {
  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header
      className="app-top-nav absolute inset-x-0 top-0 z-50 flex items-start justify-between mix-blend-difference text-neutral-400 uppercase tracking-[0.2em]"
      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 'clamp(9px, 1.5vw, 12px)' }}
    >
      {/* Brand → home (wordmark doubles as home affordance) */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => onNavigate(VIEWS.MAIN)}
          className="text-left font-bold tracking-[0.3em] transition-colors duration-300 hover:text-white"
          aria-label="Go to home / start page"
        >
          BPM® BROWSER V1.0
        </button>
        <div className="flex gap-2">
          <span aria-hidden="true">{dateLabel}</span>
          <span className="text-neutral-500 tabular-nums">{timeLabel}</span>
        </div>
      </div>

      {/* View switcher */}
      <nav className="flex gap-3 md:gap-6" aria-label="Primary">
        {NAV_ITEMS.map(({ view, label, title, Icon }) => {
          const isActive = activeView === view;
          return (
            <button
              key={view}
              type="button"
              title={title}
              aria-label={title}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(view)}
              className={`flex items-center gap-2 transition-colors duration-300 ${
                isActive ? 'text-white' : 'hover:text-white'
              }`}
            >
              <Icon size={14} strokeWidth={1.75} />
              {/* Hide text labels on very narrow screens — icons remain. */}
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
