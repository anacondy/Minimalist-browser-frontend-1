/**
 * TabsView — open sessions, rendered as a staggered list.
 * ------------------------------------------------------------------
 * Responsive:
 *  - List is inside a scroll container (visible scrollbar hidden with
 *    .no-scrollbar) so long lists never clip on short screens.
 *  - The staggered indentation uses rem-based inline styles instead
 *    of Tailwind's fixed pixel utilities (ml-32 = 128 px) — the old
 *    version overflowed horizontally on phones. Clamped to 0–96 px.
 *  - Title text scales fluidly (1.5rem → 2.25rem).
 *
 * Interactions:
 *  - Clicking a session "restores" it: opens its URL in a new tab
 *    (buttons that used to be cursor-pointer but dead are now wired).
 */
import { openSessionTab } from '../native.js';

/** Clamp the decorative indent so it never pushes content off-screen. */
const clampOffset = (rem) => Math.max(0, Math.min(rem, 6)); // 0–96px

/**
 * @param {{
 *   tabs: Array<{id:number,label:string,title:string,offset:number,url:string}>,
 *   activeTabId: number | null,
 *   onBack: () => void,
 * }} props
 */
export default function TabsView({ tabs, activeTabId, onBack }) {
  return (
    // Blank-area click → home. Clicks on the panel background bubble
    // here; item clicks stopPropagation (see below).
    <div
      data-testid="surface-tabs"
      data-scroll-root
      onClick={onBack}
      className="no-scrollbar absolute inset-0 overflow-y-auto overflow-x-hidden px-5 pb-44 pt-28 md:px-24 md:pt-32"
    >
      <h2 className="mb-10 border-b border-neutral-800 pb-4 font-bold tracking-tighter text-white md:mb-16"
        style={{ fontSize: 'var(--fluid-section-title)' }}
      >
        OPEN SESSIONS : <span className="text-neutral-600">LOST</span>
      </h2>

      <div className="flex min-h-max flex-col items-start">
        {tabs.length === 0 ? (
          <p className="font-mono text-xs tracking-widest text-neutral-500 md:text-sm">
            NO SESSIONS MATCHING QUERY.
          </p>
        ) : (
          tabs.map((tab) => {
            // The session that Ctrl+Tab / the tab bar selected lights up.
            const isActiveTab = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={(e) => {
                  // Item click = open the session, never "back".
                  e.stopPropagation();
                  openSessionTab(tab.url, tab.title);
                }}
                title={`Open ${tab.url}`}
                // Explicit accessible name (button text is visual only).
                aria-label={`Open ${tab.title}`}
                aria-current={isActiveTab ? 'true' : undefined}
                className="group flex w-full items-end gap-4 text-left transition-colors duration-300 hover:text-white md:gap-6"
                style={{ paddingLeft: `${clampOffset(tab.offset)}rem` }}
              >
                <span
                  className={`mb-1 shrink-0 font-mono text-[10px] tracking-widest md:text-xs ${
                    isActiveTab ? 'text-white' : 'text-neutral-500'
                  }`}
                >
                  {tab.label}
                </span>
                <span
                  className={`truncate font-bold tracking-tight transition-all duration-500 group-hover:tracking-widest group-hover:text-white ${
                    isActiveTab ? 'text-white' : 'text-neutral-300'
                  }`}
                  style={{ fontSize: 'clamp(1.25rem, 2.5vw + 0.75rem, 2.25rem)' }}
                >
                  {tab.title}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
