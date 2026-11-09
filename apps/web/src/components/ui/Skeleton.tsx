/** Page loading skeleton placeholder preserving layout stability. */
export function PageSkeleton() {
  return (
    <div className="animate-pulse" aria-busy aria-label="Lädt">
      <div className="h-9 w-40 rounded-full bg-white/80" />
      <div className="mt-6 h-9 w-3/4 rounded-xl bg-white/80" />
      <div className="mt-3 h-5 w-1/2 rounded-lg bg-white/70" />
      <div className="mt-8 space-y-3">
        <div className="h-24 rounded-card bg-white/80" />
        <div className="h-24 rounded-card bg-white/70" />
        <div className="h-24 rounded-card bg-white/60" />
      </div>
    </div>
  );
}
