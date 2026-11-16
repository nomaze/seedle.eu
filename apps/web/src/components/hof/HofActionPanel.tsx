import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { Feldumriss } from "@/components/ui/Feldumriss";
import { STATUS_PRIO, StatusMarker } from "@/components/ui/StatusMarker";
import type { FieldStatus, Polygon } from "@seedle/core";

export interface HofActionField {
  id: string;
  name: string;
  status?: FieldStatus;
  areaHa?: number;
  crop?: string | null;
  usage?: string | null;
  selectedVarietyId?: string | null;
  geometry?: Polygon | null;
}

export interface HofActionPanelProps {
  fields: HofActionField[];
  farmName?: string;
  varieties?: Map<string, string>;
  className?: string;
}

interface ActionItem {
  id: string;
  fieldId: string;
  fieldName: string;
  geometry?: Polygon | null;
  status: "status-urgent" | "status-problem" | "status-action" | "status-ok";
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
}

/**
 * "Was zu tun ist": one flat row per field, sorted by urgency (design system "StatusMarker").
 * Field outline as icon, status as shape plus word, only urgent rows are tinted.
 */
export function HofActionPanel({
  fields,
  varieties = new Map(),
  className = "",
}: HofActionPanelProps) {
  const items: ActionItem[] = fields.map((f) => {
    const status = f.status ?? "status-ok";
    const vName = f.selectedVarietyId ? varieties.get(f.selectedVarietyId) : undefined;
    const common = { id: `act-${f.id}`, fieldId: f.id, fieldName: f.name, geometry: f.geometry };

    switch (status) {
      case "status-urgent":
        return {
          ...common,
          status: "status-urgent",
          title: `Hitzewelle & Trockenstress: ${f.name}`,
          message: `Nächste Woche kommt eine Hitzewelle, bewässere deine Felder auf ${f.name} und prüfe den Bodenfeuchte-Verlauf.`,
          actionHref: `/feld/${f.id}`,
          actionLabel: "Schlag prüfen",
        };
      case "status-problem":
        return {
          ...common,
          status: "status-problem",
          title: `Sortenwahl offen: ${f.name}`,
          message: `Für die Saison 2027 ist noch keine Sorte gewählt. Hohes Ertragsrisiko bei Trockenheit, jetzt standortoptimierte Sorten vergleichen.`,
          actionHref: f.usage ? `/feld/${f.id}/ranking` : `/feld/${f.id}/anbau`,
          actionLabel: "Zum Sorten-Ranking",
        };
      case "status-action":
        return {
          ...common,
          status: "status-action",
          title: `Aktion nötig: ${f.name}`,
          message: `Aussaat vorbereiten: Saatgut ${vName ? `für ${vName}` : "für 2027"} ist eingeplant. Verfügbarkeit und Konditionen beim Landhandel sichern.`,
          actionHref: `/feld/${f.id}`,
          actionLabel: "Schlag ansehen",
        };
      case "status-ok":
      default:
        return {
          ...common,
          status: "status-ok",
          title: `Alles im Plan: ${f.name}`,
          message: `Sorte ${vName ?? "ist"} festgelegt. Standortdaten und Anbauplan für 2027 sind vollständig und witterungsstabil vorbereitet.`,
          actionHref: `/feld/${f.id}`,
          actionLabel: "Details öffnen",
        };
    }
  });

  items.sort((a, b) => STATUS_PRIO[a.status] - STATUS_PRIO[b.status]);

  return (
    <section aria-labelledby="hof-todo" className={`flex flex-col ${className}`}>
      <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-3">
        <h2 id="hof-todo" className="text-heading text-fg">
          Was zu tun ist
        </h2>
        <span className="text-small text-fg-muted">
          {items.length} {items.length === 1 ? "Hinweis" : "Hinweise"}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="border-b border-divider py-6 text-small text-fg-muted">
          <p>Noch keine Schläge angelegt.</p>
          <Link
            href="/feld/neu"
            className="mt-2 inline-flex items-center gap-1 font-semibold text-link hover:underline"
          >
            <Plus className="size-4" /> Ersten Schlag anlegen
          </Link>
        </div>
      ) : (
        <ul className="flex-1">
          {items.map((item) => (
            <ActionRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ActionRow({ item }: { item: ActionItem }) {
  const urgent = item.status === "status-urgent";
  return (
    <li className={`border-b border-divider ${urgent ? "-mx-3 bg-status-urgent-soft px-3" : ""}`}>
      <Link
        href={item.actionHref}
        className="group grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3.5 gap-y-1 py-4 text-fg"
      >
        <span className="row-span-3 pt-0.5">
          <Feldumriss geometry={item.geometry} size={32} strokeWidth={2} />
        </span>
        <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="font-bold">{item.fieldName}</span>
          <StatusMarker status={item.status} className="text-[13px]" />
        </span>
        <span className="text-[0.9375rem] leading-snug">{item.message}</span>
        <span className="inline-flex items-center gap-1 text-small font-semibold text-link group-hover:underline">
          {item.actionLabel}
          <ArrowRight className="size-3.5" aria-hidden />
        </span>
      </Link>
    </li>
  );
}
