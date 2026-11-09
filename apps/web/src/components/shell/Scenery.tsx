/**
 * Ambient background scenery: abstracted sky and field horizons.
 * Subtle gradients and lighting providing depth behind page content and motifs.
 * Design specifications: docs/DESIGN.md.
 */
export function Scenery() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-sand-200)_0%,var(--color-sand-100)_26%,var(--color-sand-50)_52%,var(--color-sand-25)_100%)]" />

      {/* Radial ambient lighting */}
      <div className="absolute -right-[12vw] -top-[22vw] size-[58vw] rounded-full bg-[radial-gradient(circle,var(--color-licht)_0%,transparent_68%)]" />

      {/* Skyline horizon lines */}
      <div className="absolute -left-[10vw] top-[15vh] h-0.5 w-[70vw] rounded-full bg-[linear-gradient(90deg,transparent,#fff_30%,#fff_70%,transparent)]" />
      <div className="absolute left-[40vw] top-[22vh] h-0.5 w-[50vw] rounded-full bg-[linear-gradient(90deg,transparent,#fff_30%,#fff_70%,transparent)] opacity-70" />

      {/* Field horizon curves */}
      <svg className="absolute inset-x-0 bottom-0 h-[22vh] w-full" viewBox="0 0 1440 260" preserveAspectRatio="none">
        <defs>
          <linearGradient id="feldband" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-sand-25)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--color-leaf-100)" stopOpacity="0.85" />
            <stop offset="1" stopColor="var(--color-leaf-200)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1440" height="260" fill="url(#feldband)" />
        <g fill="none" stroke="var(--color-leaf-300)" strokeLinecap="round" vectorEffect="non-scaling-stroke">
          <path d="M0 176 C 480 156, 960 156, 1440 176" strokeWidth="1.3" opacity="0.6" vectorEffect="non-scaling-stroke" />
          <path d="M0 206 C 480 182, 960 182, 1440 206" strokeWidth="1.7" opacity="0.65" vectorEffect="non-scaling-stroke" />
          <path d="M0 244 C 480 214, 960 214, 1440 244" strokeWidth="2.2" opacity="0.7" vectorEffect="non-scaling-stroke" />
        </g>
        <circle cx="210" cy="203" r="3.4" fill="var(--color-poppy)" opacity="0.8" />
        <circle cx="1140" cy="178" r="2.6" fill="var(--color-poppy)" opacity="0.7" />
        <circle cx="760" cy="229" r="3.8" fill="var(--color-bee)" opacity="0.85" />
      </svg>
    </div>
  );
}
