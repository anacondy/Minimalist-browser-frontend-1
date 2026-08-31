/**
 * HistoryView — cast-list style history entries.
 * ------------------------------------------------------------------
 * - Scroll area is capped (60dvh) and scrollbar-free; list rows use
 *   transform-based hover so no layout is recalculated on hover.
 * - Clicking an entry "restores" it: literal URLs open directly,
 *   anything else opens as a Google search.
 * - Long URLs wrap on narrow screens (break-words) instead of
 *   pushing horizontal scroll.
 */
import { openSessionTab } from '../native.js';
import { prettifyUrl, resolveHistoryTarget } from '../utils.js';

/**
 * @param {{
 *   items: Array<{id:number,role:string,name:string,isActive:boolean}>,
 *   onBack: () => void,
 * }} props
 */
export default function HistoryView({ items, onBack }) {
  return (
    // Blank-area click → home (rows stopPropagation below).
    <div
      data-testid="surface-history"
      onClick={onBack}
      className="absolute inset-0 flex flex-col items-center justify-center px-4 pb-44 pt-28"
    >
      <div className="no-scrollbar w-full max-h-[60dvh] space-y-4 overflow-y-auto pb-12 text-center">
        {items.length === 0 ? (
          <p className="mt-20 font-mono text-xs tracking-widest text-neutral-500 md:text-sm">
            NO HISTORY FOUND.
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openSessionTab(resolveHistoryTarget(item.name), item.name);
              }}
              title="Open in new tab"
              className={`block w-full cursor-pointer break-words py-1 text-base transition-transform duration-300 hover:scale-[1.025] md:text-2xl ${
                item.isActive
                  ? 'text-green-500'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span
                className={`mr-3 font-medium ${
                  item.isActive ? 'text-green-600' : 'text-neutral-600'
                }`}
              >
                {item.role}
              </span>
              <span className="font-bold">{prettifyUrl(item.name)}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
