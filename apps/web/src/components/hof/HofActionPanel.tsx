import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Info, Plus } from "lucide-react";
import Link from "next/link";
import { FieldStatusBadge } from "@/components/ui/Badge";
import { Card, SectionTitle } from "@/components/ui/Card";
import type { FieldStatus } from "@seedle/core";

export interface HofActionField {
  id: string;
  name: string;
  status?: FieldStatus;
  areaHa?: number;
  crop?: string | null;
  usage?: string | null;
  selectedVarietyId?: string | null;
}

export interface HofActionPanelProps {
  fields: HofActionField[];
  farmName?: string;
  varieties?: Map<string, string>;
  className?: string;
}

interface ActionCardItem {
  id: string;
  fieldId: string;
  fieldName: string;
  status: "status-urgent" | "status-problem" | "status-action" | "status-ok";
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
}

export function HofActionPanel({
  fields,
  varieties = new Map(),
  className = "",
}: HofActionPanelProps) {
  // Generate prioritized operational action items by field status
  const items: ActionCardItem[] = fields.map((f) => {
    const status = f.status ?? "status-ok";
    const vName = f.selectedVarietyId ? varieties.get(f.selectedVarietyId) : undefined;

    switch (status) {
      case "status-urgent":
        return {
          id: `act-${f.id}`,
          fieldId: f.id,
          fieldName: f.name,
          status: "status-urgent",
          title: `Hitzewelle & Trockenstress: ${f.name}`,
          message: `Nächste Woche kommt eine Hitzewelle, bewässere deine Felder auf ${f.name} und prüfe den Bodenfeuchte-Verlauf.`,
          actionHref: `/feld/${f.id}`,
          actionLabel: "Schlag prüfen",
        };
      case "status-problem":
        return {
          id: `act-${f.id}`,
          fieldId: f.id,
          fieldName: f.name,
          status: "status-problem",
          title: `Sortenwahl offen: ${f.name}`,
          message: `Für die Saison 2027 ist noch keine Sorte gewählt. Hohes Ertragsrisiko bei Trockenheit — jetzt standortoptimierte Sorten vergleichen.`,
          actionHref: f.usage ? `/feld/${f.id}/ranking` : `/feld/${f.id}/anbau`,
          actionLabel: "Zum Sorten-Ranking",
        };
      case "status-action":
        return {
          id: `act-${f.id}`,
          fieldId: f.id,
          fieldName: f.name,
          status: "status-action",
          title: `Aktion nötig: ${f.name}`,
          message: `Aussaat vorbereiten: Saatgut ${vName ? `für ${vName}` : "für 2027"} ist eingeplant. Verfügbarkeit und Konditionen beim Landhandel sichern.`,
          actionHref: `/feld/${f.id}`,
          actionLabel: "Schlag ansehen",
        };
      case "status-ok":
      default:
        return {
          id: `act-${f.id}`,
          fieldId: f.id,
          fieldName: f.name,
          status: "status-ok",
          title: `Alles im Plan: ${f.name}`,
          message: `Sorte ${vName ?? "ist"} festgelegt. Standortdaten und Anbauplan für 2027 sind vollständig und witterungsstabil vorbereitet.`,
          actionHref: `/feld/${f.id}`,
          actionLabel: "Details öffnen",
        };
    }
  });

  // Sortierung: Dringend -> Problem -> Aktion -> Alles im Plan
  const statusPrio: Record<string, number> = {
    "status-urgent": 1,
    "status-problem": 2,
    "status-action": 3,
    "status-ok": 4,
  };

  items.sort((a, b) => statusPrio[a.status] - statusPrio[b.status]);

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <SectionTitle>Was zu tun ist</SectionTitle>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sand-100 text-muted">
          {items.length} {items.length === 1 ? "Hinweis" : "Hinweise"}
        </span>
      </div>

      <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-0.5">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">
            <p>Noch keine Schläge angelegt.</p>
            <Link
              href="/feld/neu"
              className="mt-2 inline-flex items-center gap-1 font-semibold text-leaf-700 hover:underline"
            >
              <Plus className="size-4" /> Ersten Schlag anlegen
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <ActionCard key={item.id} item={item} />
          ))
        )}
      </div>
    </Card>
  );
}

function ActionCard({ item }: { item: ActionCardItem }) {
  const styles = {
    "status-urgent": {
      card: "border-status-urgent/40 bg-status-urgent-soft/90 text-status-urgent-text ring-1 ring-status-urgent/25",
      icon: <AlertCircle className="size-4 text-status-urgent shrink-0 mt-0.5" />,
      link: "text-status-urgent-text hover:text-status-urgent font-bold",
    },
    "status-problem": {
      card: "border-status-problem/40 bg-status-problem-soft/90 text-status-problem-text ring-1 ring-status-problem/25",
      icon: <AlertTriangle className="size-4 text-status-problem shrink-0 mt-0.5" />,
      link: "text-status-problem-text hover:text-status-problem font-bold",
    },
    "status-action": {
      card: "border-status-action/40 bg-status-action-soft/90 text-status-action-text ring-1 ring-status-action/25",
      icon: <Info className="size-4 text-status-action shrink-0 mt-0.5" />,
      link: "text-status-action-text hover:text-status-action font-bold",
    },
    "status-ok": {
      card: "border-status-ok/40 bg-status-ok-soft/90 text-status-ok-text ring-1 ring-status-ok/25",
      icon: <CheckCircle2 className="size-4 text-status-ok shrink-0 mt-0.5" />,
      link: "text-status-ok-text hover:text-status-ok font-bold",
    },
  }[item.status];

  return (
    <div
      className={`rounded-xl border p-3.5 transition hover:shadow-soft flex flex-col justify-between gap-2.5 ${styles.card}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {styles.icon}
            <span className="text-xs font-bold uppercase tracking-wider truncate">
              {item.fieldName}
            </span>
          </div>
          <FieldStatusBadge status={item.status} className="shrink-0 text-[11px]" />
        </div>
        <div className="font-semibold text-sm leading-snug">{item.title}</div>
        <p className="mt-1 text-xs opacity-90 leading-relaxed">{item.message}</p>
      </div>

      <div className="pt-2 border-t border-current/15 flex items-center justify-end">
        <Link
          href={item.actionHref}
          className={`inline-flex items-center gap-1 text-xs transition ${styles.link}`}
        >
          <span>{item.actionLabel}</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
