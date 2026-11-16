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
import { DemoBadge } from "@/components/ui/Badge";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Kennzahl, KennzahlLeiste } from "@/components/ui/Kennzahl";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { StatusMarker, type StatusName } from "@/components/ui/StatusMarker";
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
/** Urgency as Feldfarben marker: today urgent, this week attention, in view open task. */
const DRINGLICH: Record<FieldHint["dringlichkeit"], { label: string; status: StatusName }> = {
  heute: { label: "Heute", status: "status-urgent" },
  "diese-woche": { label: "Diese Woche", status: "status-problem" },
  "im-blick": { label: "Im Blick", status: "status-action" },
};
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
  const heuteWetter = view.wetter[0];

  return (
    <>
      <PageHeader
        back={{ href: "/", label: "Startseite" }}
        eyebrow={`${datumLang(view.heute)}${view.demo ? " · Saison-Vorschau" : ""}`}
        title="Dein Feld heute"
        lead={`${field.name} · ${view.variety.name} · ${num(field.areaHa)} ha`}
        aside={view.demo ? <DemoBadge /> : undefined}
      />

      {/* Field switch as a segmented control */}
      {mitSorte.length > 1 ? (
        <nav aria-label="Feld wählen" className="-mt-4 mb-10 flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {mitSorte.map((f) => {
            const aktiv = f.id === field.id;
            return (
              <Link
                key={f.id}
                href={`/heute?feld=${f.id}`}
                aria-current={aktiv ? "page" : undefined}
                className={`inline-flex h-control-sm shrink-0 items-center rounded-control px-4 text-small font-semibold transition-colors ${
                  aktiv ? "bg-selected text-on-selected" : "text-fg ring-1 ring-inset ring-control hover:bg-action-subtle"
                }`}
              >
                {f.name}
              </Link>
            );
          })}
        </nav>
      ) : null}

      <div className="space-y-14">
        {neu ? (
          <div className="flex items-start gap-4 border-y border-divider py-5">
            <SprossAvatar size={52} mood="freut" className="shrink-0" />
            <div>
              <p className="font-semibold">Gute Wahl! {view.variety.name} ist deine Sorte für {view.heute.slice(0, 4)}.</p>
              <p className="mt-1 max-w-measure text-fg-muted">
                Ab der Aussaat begleiten wir sie hier jeden Tag. Damit du siehst, wie das aussieht, zeigen wir dir die Saison schon jetzt, am{" "}
                {datumLang(view.heute)} {view.heute.slice(0, 4)}.
              </p>
            </div>
          </div>
        ) : null}

        {/* Main statement: the most important hint, under the strong rule */}
        {wichtig ? (
          <section aria-label="Heute wichtig" className="border-t border-rule">
            <Hinweis hint={wichtig} gross />
          </section>
        ) : null}

        {/* Key figures: stage, days since sowing, today's weather */}
        <KennzahlLeiste>
          <Kennzahl wert={view.stadium.bbch} label={`BBCH, ${view.stadium.name}`} />
          <Kennzahl wert={view.stadium.tageSeitAussaat} label="Tage seit der Aussaat" />
          {heuteWetter ? (
            <Kennzahl wert={num(heuteWetter.tMaxC)} einheit=" °C" label={`Heute, nachts ${num(heuteWetter.tMinC)} °C`} />
          ) : null}
          {heuteWetter ? (
            <Kennzahl
              wert={num(heuteWetter.niederschlagMm)}
              einheit=" mm"
              label="Regen heute"
              wertClassName={heuteWetter.niederschlagMm > 0 ? "text-rain" : ""}
            />
          ) : null}
        </KennzahlLeiste>

        {/* Wetter */}
        <section aria-labelledby="wetter">
          <SectionTitle hint={`${field.env.region}`}>
            <span id="wetter">Wetter, 7 Tage</span>
          </SectionTitle>
          <WetterStreifen tage={view.wetter} />
        </section>

        {/* Stadium: sowing to harvest, today marked */}
        <section aria-labelledby="mais">
          <SectionTitle hint={`Tag ${view.stadium.tageSeitAussaat} seit der Aussaat`}>
            <span id="mais">Dein Mais</span>
          </SectionTitle>
          <p className="text-figure-m text-fg">
            {view.stadium.name} <span className="text-body font-semibold text-fg-muted">· BBCH {view.stadium.bbch}</span>
          </p>
          <div className="mt-6 px-1.5">
            <div className="relative h-0.5 bg-data-track">
              <div className="absolute inset-y-0 left-0 bg-action" style={{ width: `${view.stadium.fortschritt * 100}%` }} />
              <span
                aria-hidden
                className="absolute -top-[7px] -ml-2 size-4 rounded-full border-[3px] border-canvas bg-action"
                style={{ left: `${view.stadium.fortschritt * 100}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-caption text-fg-muted">
              <span>Aussaat</span>
              <span>Blüte</span>
              <span>Ernte</span>
            </div>
          </div>
        </section>

        {/* Foto-Auftrag and question side by side on wide screens */}
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          <Card>
            <div className="text-small text-fg-muted">Foto-Auftrag für heute</div>
            <h2 className="mt-1 text-heading text-fg">{view.fotoAuftrag.titel}</h2>
            <p className="mt-2 max-w-measure text-fg-muted">{view.fotoAuftrag.anleitung}</p>
            <ButtonLink
              id="foto-upload"
              data-spross-target="foto-upload"
              data-spross-label="Foto machen"
              href={`/heute/foto?feld=${field.id}`}
              className="mt-5"
            >
              <Camera className="size-5" aria-hidden /> Foto machen
            </ButtonLink>
          </Card>

          {/* Mehrwert-Frage */}
          {!beregnungBekannt ? (
            <Card>
              <div className="flex items-start gap-4">
                <SprossAvatar size={40} className="shrink-0" />
                <div className="flex-1">
                  <h2 className="text-subheading text-fg">Kannst du dieses Feld beregnen?</h2>
                  <p className="mt-1 text-fg-muted">Dann sagen wir dir genau, wann sich das Wasser lohnt.</p>
                  <AnswerQuestionForm fieldId={field.id} />
                </div>
              </div>
            </Card>
          ) : null}
        </div>

        {/* Vergleich */}
        <section aria-labelledby="vergleich">
          <SectionTitle hint={`${view.vergleich.anzahlVergleichsbetriebe} ähnliche Betriebe`}>
            <span id="vergleich">Du im Vergleich</span>
          </SectionTitle>
          <p className="max-w-measure text-subheading text-fg">{view.vergleich.aussage}</p>
          <div className="mt-6 max-w-measure px-1.5">
            <div className="relative h-2 bg-data-track">
              <span
                aria-hidden
                className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-canvas bg-data"
                style={{ left: `${view.vergleich.perzentil}%` }}
              />
            </div>
          </div>
          <p className="mt-5 max-w-measure text-fg-muted">{view.vergleich.hebel}</p>
        </section>

        {/* Weitere Hinweise */}
        {weitere.length > 0 ? (
          <section aria-labelledby="im-blick">
            <h2 id="im-blick" className="mb-4 text-heading text-fg">
              Außerdem im Blick
            </h2>
            <ul className="divide-y divide-divider border-t border-rule">
              {weitere.map((h) => (
                <li key={h.id}>
                  <Hinweis hint={h} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Tagebuch */}
        <section aria-labelledby="tagebuch">
          <SectionTitle hint={view.tagebuch.length > 0 ? `${view.tagebuch.length} Einträge` : undefined}>
            <span id="tagebuch">Dein Feldtagebuch</span>
          </SectionTitle>
          {view.tagebuch.length === 0 ? (
            <p className="max-w-measure text-fg-muted">Dein Tagebuch füllt sich mit jedem Foto. Daraus lernen wir, wie sich {view.variety.name} auf deinem Feld wirklich macht.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-divider pt-6 sm:grid-cols-3 lg:grid-cols-4">
              {view.tagebuch.map((o) => (
                <li key={o.id} className="min-w-0">
                  {o.photoPath ? (
                    <Image
                      src={`/api/v1/observations/${o.id}/photo`}
                      alt={o.finding?.titel ?? "Foto"}
                      width={320}
                      height={220}
                      unoptimized
                      className="h-32 w-full rounded-control object-cover"
                    />
                  ) : null}
                  <div className="mt-2 truncate text-small font-semibold">{o.finding?.titel ?? o.note ?? "Notiz"}</div>
                  <div className="text-caption tabular-nums text-fg-muted">{o.createdAt.toLocaleDateString("de-DE")}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

/** One hint as a flat row: icon, urgency marker, title, text, next step. Only urgent rows are tinted. */
function Hinweis({ hint, gross = false }: { hint: FieldHint; gross?: boolean }) {
  const Icon = HINWEIS_ICON[hint.art];
  const d = DRINGLICH[hint.dringlichkeit];
  const dringend = d.status === "status-urgent";
  const Titel = gross ? "h2" : "h3";
  return (
    <div className={`flex items-start gap-4 ${gross ? "py-6" : "py-5"} ${dringend ? "bg-status-urgent-soft px-4" : ""}`}>
      <Icon className={`mt-1 shrink-0 text-link ${gross ? "size-7" : "size-5"}`} strokeWidth={1.8} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {gross ? <span className="text-small text-fg-muted">Heute wichtig</span> : null}
          <StatusMarker status={d.status} label={d.label} />
        </div>
        <Titel className={`mt-1 text-fg ${gross ? "text-heading" : "text-subheading"}`}>{hint.titel}</Titel>
        <p className="mt-1 max-w-measure text-fg-muted">{hint.text}</p>
        <p className="mt-2 max-w-measure font-semibold">{hint.naechsterSchritt}</p>
        {hint.menschFragen ? (
          <CallTeamButton className={`${buttonClass("secondary", "sm")} mt-4`}>
            <Phone className="size-4" aria-hidden /> Mit dem Team besprechen
          </CallTeamButton>
        ) : null}
      </div>
    </div>
  );
}

/** 7-day forecast as columns between hairlines; rain in the rain role, sun and cloud in sunshine. */
function WetterStreifen({ tage }: { tage: WeatherDay[] }) {
  return (
    <div className="overflow-x-auto [scrollbar-width:none]">
      <ol className="grid min-w-[560px] grid-cols-7 border-t border-rule">
        {tage.map((d, i) => {
          const Icon = WETTER_ICON[d.lage];
          const tag = i === 0 ? "Heute" : new Date(`${d.datum}T12:00:00Z`).toLocaleDateString("de-DE", { weekday: "short" });
          const nass = d.lage === "regen" || d.lage === "gewitter" || d.niederschlagMm > 0;
          return (
            <li
              key={d.datum}
              className={`flex flex-col gap-1.5 border-b border-divider py-3.5 ${i > 0 ? "border-l pl-3" : "pr-3"} ${i === 0 ? "bg-highlight pl-3" : ""}`}
            >
              <span className="text-caption font-bold">{tag}</span>
              <Icon className={`size-6 ${nass ? "text-rain" : "text-sunshine"}`} strokeWidth={1.6} aria-label={d.lage} />
              <span className="text-figure-m tabular-nums">{num(d.tMaxC)}°</span>
              <span className="text-caption tabular-nums text-fg-muted">{num(d.tMinC)}°</span>
              <span className={`text-caption tabular-nums ${d.niederschlagMm > 0 ? "text-rain" : "text-fg-muted"}`}>{num(d.niederschlagMm)} mm</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
