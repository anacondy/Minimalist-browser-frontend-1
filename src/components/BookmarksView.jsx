/**
 * BookmarksView — responsive card grid of saved links.
 * ------------------------------------------------------------------
 * - 1 column on phones, 2 on ≥md, 3 on ≥xl — never a fixed 6-card
 *   grid that overflowed on small screens.
 * - Cards are buttons: clicking opens the bookmark in a new tab.
 * - 100% width in the dock-safe scroll area; text truncates gracefully.
 */
import { Globe } from 'lucide-react';
import { openExternalUrl, prettifyUrl } from '../utils.js';

/**
 * @param {{
 *   items: Array<{id:number,title:string,url:string}>,
 *   onBack: () => void,
 * }} props
 */
export default function BookmarksView({ items, onBack }) {
  return (
    // Blank-area click → home (cards stopPropagation below).
    <div
      data-testid="surface-bookmarks"
      onClick={onBack}
      className="absolute inset-0 flex flex-col items-center pb-44 pt-28"
    >
      <div
        data-scroll-root
        className="no-scrollbar w-full max-h-[70dvh] max-w-4xl overflow-y-auto px-5 pb-24"
      >
        {items.length === 0 ? (
          <p className="mt-20 text-center font-mono text-xs tracking-widest text-neutral-500 md:text-sm">
            NO BOOKMARKS FOUND.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openExternalUrl(item.url);
                }}
                title={`Open ${item.url}`}
                className="group flex items-center gap-4 rounded-xl border border-transparent p-4 text-left transition-all duration-300 hover:border-neutral-800"
              >
                {/* Icon disc — transform/opacity only on hover. */}
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-neutral-800 transition-colors duration-500 group-hover:bg-white group-hover:text-black md:h-16 md:w-16">
                  <Globe size={20} strokeWidth={1.5} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-bold tracking-tight text-neutral-300 transition-colors group-hover:text-white md:text-lg">
                    {item.title}
                  </span>
                  <span className="mt-1 block truncate font-mono text-[10px] tracking-widest text-neutral-600 md:text-xs">
                    {prettifyUrl(item.url)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
