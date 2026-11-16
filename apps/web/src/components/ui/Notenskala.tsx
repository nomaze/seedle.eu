/**
 * Grades 1–9 from the Beschreibende Sortenliste as nine boxes (design system "Notenskala").
 * Filled boxes in the data colour, empty ones outlined.
 */
export interface Note {
  label: string;
  note: number;
}

export function Notenskala({
  noten,
  klein = false,
  quelle = true,
  className = "",
}: {
  noten: Note[];
  klein?: boolean;
  quelle?: boolean;
  className?: string;
}) {
  const box = klein ? "size-2" : "size-2.5";
  return (
    <div className={className}>
      <dl className="grid max-w-md grid-cols-[minmax(0,1fr)_auto_1.5rem] items-center gap-x-4 gap-y-2 text-small">
        {noten.map(({ label, note }) => {
          const wert = Math.max(0, Math.min(9, Math.round(note)));
          return (
            <div key={label} className="contents">
              <dt className="text-fg-muted">{label}</dt>
              <dd className={`m-0 inline-grid grid-cols-9 ${klein ? "gap-0.5" : "gap-[3px]"}`} aria-label={`${label}: Note ${wert} von 9`}>
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} aria-hidden className={`${box} ${i < wert ? "bg-data" : "border border-data"}`} />
                ))}
              </dd>
              <dd className="m-0 text-right text-figure-s tabular-nums text-fg">{wert}</dd>
            </div>
          );
        })}
      </dl>
      {quelle ? (
        <p className="mt-2 text-caption text-fg-muted">Noten 1 bis 9 aus der Beschreibenden Sortenliste des Bundessortenamts.</p>
      ) : null}
    </div>
  );
}
