import type { FieldHint, WeatherDay } from "@seedle/core";
import { Bug, Camera, Cloud, CloudLightning, CloudRain, CloudSun, Droplets, Leaf, Phone, Sprout, Sun } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AnswerQuestionForm } from "@/components/heute/AnswerQuestionForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { CallTeamButton } from "@/components/spross/AskSpross";
import { SprossAvatar } from "@/components/spross/SprossAvatar";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { datumLang, num } from "@/lib/format";
import { currentUser } from "@/server/session";
import { listFields } from "@/server/services/fields";
import { factsFor } from "@/server/services/knowledge";
import { todayView } from "@/server/services/season";

export const metadata: Metadata = { title: "Dein Feld heute" };

export default function HeutePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Heute />
    </Suspense>
  );
}

const HINWEIS_ICON = { wasser: Droplets, krankheit: Leaf, schaedling: Bug, wachstum: Sprout, foto: Camera };
const DRINGLICH = { heute: { label: "Heute", tone: "poppy" as const }, "diese-woche": { label: "Diese Woche", tone: "bee" as const }, "im-blick": { label: "Im Blick", tone: "sand" as const } };
const WETTER_ICON = { sonnig: Sun, heiter: CloudSun, wolkig: Cloud, regen: CloudRain, gewitter: CloudLightning };

async function Heute() {
  const user = await currentUser();
  const felder = await listFields(user.id);
  const mitSorte = felder.filter((f) => f.selectedVarietyId);

  if (mitSorte.length === 0) {
    const erstes = felder[0];
    return (
      <>
        <PageHeader
          back={{ href: "/", label: "Startseite" }}
          title="Dein Feld heute"
          lead="Sobald du für ein Feld eine Sorte gewählt hast, siehst du hier jeden Tag, wie sich dein Mais macht: Wetter, Hinweise, Fotos und dein Fortschritt."
        />
        <ButtonLink href={erstes ? (erstes.usage ? `/feld/${erstes.id}/ranking` : `/feld/${erstes.id}`) : "/feld/neu"}>
          {erstes ? "Sorte für dein Feld finden" : "Feld auswählen"}
        </ButtonLink>
      </>
    );
  }

  const field = mitSorte[0]!;
  const view = await todayView(field);
  if (!view) return null;
  const facts = await factsFor(user.id);
  const beregnungBekannt = facts.some((f) => /beregn/i.test(f.text));
  const [wichtig, ...weitere] = view.hinweise;
  const neu = false;

  return (
    <>
      <PageHeader
        back={{ href: "/", label: "Startseite" }}
        eyebrow={`${datumLang(view.heute)}${view.demo ? " · Saison-Vorschau" : ""}`}
        title="Dein Feld heute"
        lead={`${field.name} · ${view.variety.name} · ${num(field.areaHa)} ha`}
        aside={view.demo ? <DemoBadge /> : undefined}
      />

      {mitSorte.length > 1 ? (
        <nav aria-label="Feld wählen" className="-mt-2 mb-5 flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {mitSorte.map((f) => (
            <Link
              key={f.id}
              href={`/heute?feld=${f.id}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 ${f.id === field.id ? "bg-ink text-white ring-ink" : "bg-white/90 ring-line"}`}
            >
              {f.name}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="space-y-5">
        {neu ? (
          <div className="flex animate-rise items-start gap-3 rounded-card bg-leaf-50/95 p-5 ring-1 ring-leaf-200">
            <SprossAvatar size={52} mood="freut" className="shrink-0" />
            <div>
              <p className="font-semibold">Gute Wahl! {view.variety.name} ist deine Sorte für {view.heute.slice(0, 4)}.</p>
              <p className="mt-1 text-sm text-muted">
                Ab der Aussaat begleiten wir sie hier jeden Tag. Damit du siehst, wie das aussieht, zeigen wir dir die Saison schon jetzt, am{" "}
                {datumLang(view.heute)} {view.heute.slice(0, 4)}.
              </p>
            </div>
          </div>
        ) : null}

        {/* Wichtigster Hinweis */}
        {wichtig ? <HinweisKarte hint={wichtig} gross /> : null}

        {/* Wetter */}
        <Card>
          <SectionTitle hint={`${field.env.region}`}>Wetter, 7 Tage</SectionTitle>
          <WetterStreifen tage={view.wetter} />
        </Card>

        {/* Stadium */}
        <Card>
          <SectionTitle hint={`Tag ${view.stadium.tageSeitAussaat} seit der Aussaat`}>Dein Mais</SectionTitle>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold">{view.stadium.name}</span>
            <Badge tone="leaf">BBCH {view.stadium.bbch}</Badge>
          </div>
          <div className="mt-5">
            <div className="relative h-3 rounded-full bg-line/70">
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-leaf-300 to-leaf-500" style={{ width: `${view.stadium.fortschritt * 100}%` }} />
              <div
                className="absolute top-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow ring-1 ring-leaf-300"
                style={{ left: `${view.stadium.fortschritt * 100}%` }}
              >
                <Sprout className="size-4 text-leaf-600" />
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>Aussaat</span>
              <span>Blüte</span>
              <span>Ernte</span>
            </div>
          </div>
        </Card>

        {/* Foto-Auftrag */}
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-bee-soft text-bee-text ring-1 ring-bee/40">
            <Camera className="size-6" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-medium text-muted">Foto-Auftrag für heute</div>
            <div className="text-lg font-semibold">{view.fotoAuftrag.titel}</div>
            <p className="text-sm text-muted">{view.fotoAuftrag.anleitung}</p>
          </div>
          <ButtonLink
            id="foto-upload"
            data-spross-target="foto-upload"
            data-spross-label="Foto machen"
            href={`/heute/foto?feld=${field.id}`}
            className="shrink-0"
          >
            Foto machen
          </ButtonLink>
        </Card>

        {/* Mehrwert-Frage */}
        {!beregnungBekannt ? (
          <Card>
            <div className="flex items-start gap-3">
              <SprossAvatar size={40} className="shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Kannst du dieses Feld beregnen?</p>
                <p className="text-sm text-muted">Dann sagen wir dir genau, wann sich das Wasser lohnt.</p>
                <AnswerQuestionForm fieldId={field.id} />
              </div>
            </div>
          </Card>
        ) : null}

        {/* Vergleich */}
        <Card>
          <SectionTitle hint={`${view.vergleich.anzahlVergleichsbetriebe} ähnliche Betriebe`}>Du im Vergleich</SectionTitle>
          <p className="text-lg font-semibold">{view.vergleich.aussage}</p>
          <div className="mt-4">
            <div className="relative h-3 rounded-full bg-gradient-to-r from-sand-200 via-leaf-100 to-leaf-300">
              <div
                className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-leaf-700 shadow"
                style={{ left: `${view.vergleich.perzentil}%` }}
              />
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">{view.vergleich.hebel}</p>
        </Card>

        {/* Weitere Hinweise */}
        {weitere.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Außerdem im Blick</h2>
            {weitere.map((h) => (
              <HinweisKarte key={h.id} hint={h} />
            ))}
          </div>
        ) : null}

        {/* Tagebuch */}
        <Card>
          <SectionTitle hint={view.tagebuch.length > 0 ? `${view.tagebuch.length} Einträge` : undefined}>Dein Feldtagebuch</SectionTitle>
          {view.tagebuch.length === 0 ? (
            <p className="text-sm text-muted">Dein Tagebuch füllt sich mit jedem Foto. Daraus lernen wir, wie sich {view.variety.name} auf deinem Feld wirklich macht.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {view.tagebuch.map((o) => (
                <li key={o.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
                  {o.photoPath ? (
                    <Image src={`/api/v1/observations/${o.id}/photo`} alt={o.finding?.titel ?? "Foto"} width={320} height={220} unoptimized className="h-28 w-full object-cover" />
                  ) : null}
                  <div className="p-2.5">
                    <div className="truncate text-sm font-medium">{o.finding?.titel ?? o.note ?? "Notiz"}</div>
                    <div className="text-xs text-muted">{o.createdAt.toLocaleDateString("de-DE")}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function HinweisKarte({ hint, gross = false }: { hint: FieldHint; gross?: boolean }) {
  const Icon = HINWEIS_ICON[hint.art];
  const d = DRINGLICH[hint.dringlichkeit];
  return (
    <section className={`rounded-card bg-white/92 shadow-soft ring-1 backdrop-blur-sm ${gross ? "p-5 ring-leaf-300 sm:p-6" : "p-4 ring-line"}`}>
      <div className="flex items-start gap-4">
        <span className={`flex shrink-0 items-center justify-center rounded-full bg-sand-100 text-leaf-800 ring-1 ring-sand-200 ${gross ? "size-12" : "size-10"}`}>
          <Icon className={gross ? "size-6" : "size-5"} />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {gross ? <span className="text-sm font-medium text-muted">Heute wichtig</span> : null}
            <Badge tone={d.tone}>{d.label}</Badge>
          </div>
          <h3 className={`mt-1 font-semibold ${gross ? "text-xl" : "text-base"}`}>{hint.titel}</h3>
          <p className="mt-1 text-muted">{hint.text}</p>
          <p className="mt-2 font-medium">{hint.naechsterSchritt}</p>
          {hint.menschFragen ? (
            <CallTeamButton className={`${buttonClass("secondary", "sm")} mt-3`}>
              <Phone className="size-4" /> Mit dem Team besprechen
            </CallTeamButton>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function WetterStreifen({ tage }: { tage: WeatherDay[] }) {
  return (
    <ol className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      {tage.map((d, i) => {
        const Icon = WETTER_ICON[d.lage];
        const tag = i === 0 ? "Heute" : new Date(`${d.datum}T12:00:00Z`).toLocaleDateString("de-DE", { weekday: "short" });
        return (
          <li key={d.datum} className={`flex min-w-[4.5rem] flex-1 flex-col items-center rounded-2xl px-2 py-3 ring-1 ${i === 0 ? "bg-sand-100 ring-sand-300" : "bg-white ring-line"}`}>
            <span className="text-xs font-semibold">{tag}</span>
            <Icon className={`my-2 size-6 ${d.lage === "sonnig" || d.lage === "heiter" ? "text-sun" : "text-air-600"}`} />
            <span className="text-sm font-semibold tabular">{d.tMaxC}°</span>
            <span className="text-xs text-muted tabular">{d.tMinC}°</span>
            <span className={`mt-1 text-xs tabular ${d.niederschlagMm > 0 ? "text-air-700" : "text-muted"}`}>{num(d.niederschlagMm)} mm</span>
          </li>
        );
      })}
    </ol>
  );
}
