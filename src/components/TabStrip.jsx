/**
 * TabStrip — the persistent "browser tab bar".
 * ------------------------------------------------------------------
 * Shows OPEN TABS (the active one highlighted) plus a `+` to open a new
 * tab — exactly like browser chrome. In the desktop shell these map to
 * real embedded webviews (see App.jsx / native.js); in the web preview
 * they demo the mock sessions.
 *
 * Panels (Home/Tabs/Hist/Bkmk/Cfg) are NOT switched here — that's
 * TopNav's job. Ctrl+Tab cycles these tabs (browser semantics).
 */
/**
 * @param {{
 *   items: Array<{key:string,label:string,title:string,isHome?:boolean}>,
 *   activeKey: string,
 *   onSelect: (key: string) => void,
 *   onNewTab?: () => void,
 * }} props
 */
export default function TabStrip({ items, activeKey, onSelect, onNewTab }) {
  if (!items || items.length === 0) return null;

  return (
    <div
      data-testid="tabstrip"
      role="tablist"
      aria-label="Open tabs"
      className="no-scrollbar absolute inset-x-0 z-40 flex items-center gap-1 overflow-x-auto border-b border-neutral-900/80 bg-black/80 px-4 pb-2 pt-2 backdrop-soft"
      style={{ top: 'calc(env(safe-area-inset-top) + 3.5rem)' }}
    >
      {items.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Switch to ${tab.title}`}
            title={tab.title}
            onClick={() => onSelect(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors duration-300 md:text-[11px] ${
              isActive
                ? 'border-white bg-white/10 text-white'
                : 'border-neutral-800 text-neutral-500 hover:border-neutral-500 hover:text-white'
            }`}
          >
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

      {/* New-tab affordance (desktop shell only). */}
      {onNewTab && (
        <button
          type="button"
          onClick={onNewTab}
          aria-label="New tab (Ctrl+T)"
          title="New tab (Ctrl+T)"
          className="flex shrink-0 items-center border border-dashed border-neutral-800 px-2 py-1 font-mono text-[11px] text-neutral-500 transition-colors hover:border-white hover:text-white"
        >
          +
        </button>
      )}
    </div>
  );
}
