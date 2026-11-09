/** Trait score scale 1-9 as a dot indicator; higher score = superior expression. */
export function TraitScale({ label, wert, hinweis }: { label: string; wert: number; hinweis?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hinweis ? <div className="text-xs text-muted">{hinweis}</div> : null}
      </div>
      <div className="flex shrink-0 gap-1" role="img" aria-label={`${wert} von 9`}>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={`size-2.5 rounded-full ${i < wert ? "bg-leaf-500" : "bg-line"}`} />
        ))}
      </div>
    </div>
  );
}
