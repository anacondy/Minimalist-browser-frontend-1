/**
 * TabStrip — the persistent "browser tab bar".
 * ------------------------------------------------------------------
 * Shows every open session (01/MAIN, 02/DOCS, …) as a real tab, exactly
 * like a browser chrome:
 *  - the ACTIVE tab is highlighted (aria-current + white marker),
 *  - clicking a tab activates it,
 *  - Ctrl+Tab / Ctrl+Shift+Tab cycle through it (see App.jsx),
 *  - the strip is horizontally scrollable and scrollbar-free so any
 *    number of tabs fit on a phone without overflow.
 *
 * The strip is NOT a panel switcher — Home/Tabs/Hist/Bkmk/Cfg remain
 * separate views reachable from TopNav. This matches real browsers,
 * where Ctrl+Tab moves between *open tabs*, never between UI chrome.
 */
/**
 * @param {{
 *   tabs: Array<{id:number,label:string,title:string,url:string}>,
 *   activeTabId: number | null,
 *   onSelect: (id: number) => void,
 * }} props
 */
export default function TabStrip({ tabs, activeTabId, onSelect }) {
  if (!tabs || tabs.length === 0) return null;

  return (
    <div
      data-testid="tabstrip"
      role="tablist"
      aria-label="Open sessions"
      className="no-scrollbar absolute inset-x-0 z-40 flex gap-1 overflow-x-auto border-b border-neutral-900/80 bg-black/80 px-4 pb-2 pt-2 backdrop-soft"
      // Sits just below the status/nav bar, clear of the home indicator.
      style={{ top: 'calc(env(safe-area-inset-top) + 3.5rem)' }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Switch to ${tab.title}`}
            title={tab.title}
            onClick={() => onSelect(tab.id)}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors duration-300 md:text-[11px] ${
              isActive
                ? 'border-white bg-white/10 text-white'
                : 'border-neutral-800 text-neutral-500 hover:border-neutral-500 hover:text-white'
            }`}
          >
            {/* Active-tab marker (tiny square, like a favicon slot). */}
            <span
              aria-hidden="true"
              className={`inline-block h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                isActive ? 'bg-white' : 'bg-neutral-700'
              }`}
            />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
