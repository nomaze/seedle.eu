/** Trait score scale 1-9 as a dot indicator; higher score = superior expression. */
export function TraitScale({ label, wert, hinweis }: { label: string; wert: number; hinweis?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="text-small text-fg">{label}</div>
        {hinweis ? <div className="text-caption text-fg-muted">{hinweis}</div> : null}
      </div>
      <div className="inline-grid shrink-0 grid-cols-9 gap-[3px]" role="img" aria-label={`${wert} von 9`}>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={`size-2.5 ${i < wert ? "bg-data" : "border border-data"}`} />
        ))}
      </div>
    </div>
  );
}
