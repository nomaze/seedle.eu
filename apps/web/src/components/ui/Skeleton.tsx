/**
 * Page loading skeleton placeholder preserving layout stability: back link, title, lead,
 * then flat sections separated by dividers (same rhythm as PageHeader and Card).
 */
export function PageSkeleton() {
  return (
    <div className="animate-pulse" aria-busy aria-label="Lädt">
      <div className="mt-3 h-5 w-32 rounded-control bg-highlight" />
      <div className="mt-6 h-12 w-3/4 max-w-3xl rounded-control bg-highlight" />
      <div className="mt-4 h-5 w-full max-w-measure rounded-control bg-highlight" />
      <div className="mt-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 border-t border-divider py-6">
            <div className="h-6 w-48 rounded-control bg-highlight" />
            <div className="h-4 w-full max-w-measure rounded-control bg-highlight" />
            <div className="h-4 w-2/3 max-w-measure rounded-control bg-highlight" />
          </div>
        ))}
      </div>
    </div>
  );
}
