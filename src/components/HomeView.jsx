/**
 * HomeView — the "SYS®" start page.
 * ------------------------------------------------------------------
 * Pure typography: no images, no network requests — effectively zero
 * layout cost. The big display title uses a fluid clamp() so it scales
 * gracefully from a 320 px phone to a 4K monitor, and the whole block
 * is centred with min-h-0-safe padding so the dock never covers it.
 */
export default function HomeView() {
  return (
    <div className="absolute inset-0 flex min-h-0 flex-col items-center justify-center px-4 pb-40 pt-24 md:pb-48">
      <div className="text-center">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500 md:text-xs md:tracking-[0.35em]">
          CATALOGUE BR/1.0
        </p>

        {/* Fluid display size: clamp() lives in index.css (--fluid-display). */}
        <h1
          className="font-black leading-none tracking-tighter text-white"
          style={{ fontSize: 'var(--fluid-display)' }}
        >
          SYS®
        </h1>

        <div className="mt-6 space-y-1 font-mono text-[10px] uppercase tracking-[0.1em] text-neutral-400 md:text-xs">
          <p>HERE FOR THE WEB.</p>
          <p>JAIPUR, RAJASTHAN</p>
          <p>WORLDWIDE © 2026</p>
        </div>
      </div>
    </div>
  );
}
