import type React from "react";
import { ArrowRight, Check, ChevronLeft, CornerUpLeft, MapPin, Phone, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MotivFeldmosaik, MotivLabor } from "@/components/motive/Feldmosaik";
import { CallTeamButton } from "@/components/spross/AskSpross";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { TEAM } from "@/lib/team";

export const metadata: Metadata = {
  title: "Warum kostenlos? · Seedle für Landwirte dauerhaft 0 €",
  description:
    "Warum Seedle für Landwirte heute und in Zukunft 0 € kostet: Geschäftsmodell, G×E×M Labor-Feld-Lücke und strikte Datenschutz-Trennung.",
};

/** The four questions everyone asks, each answered in one line and linked to its section. */
const FRAGEN = [
  { frage: "„Wo ist der Haken?“", antwort: "Züchter und Input-Firmen bezahlen, nicht du.", ziel: "#wer-zahlt", abschnitt: "1 · Wer bezahlt die Rechnung?" },
  { frage: "„Kommt nächstes Jahr das teure Abo?“", antwort: "Nein. Jedes Tool für Landwirte bleibt kostenlos.", ziel: "#zukunft", abschnitt: "4 · Unser Versprechen" },
  { frage: "„Werden meine Hofdaten verkauft?“", antwort: "Nein. Kein Adress-, Kontakt- oder Datenhandel.", ziel: "#datenschutz", abschnitt: "3 · Pflanzen-Biologie ja, Betriebsdaten nein" },
  { frage: "„Ist das versteckte Werbung?“", antwort: "Nein. 0 % Einfluss auf dein Ranking.", ziel: "#datenschutz", abschnitt: "3 · Pflanzen-Biologie ja, Betriebsdaten nein" },
] as const;

/** Stations of the fair value loop; `pfeil` and `pfeilSub` label the directed arrow to the next station, and `rueckPfeil` labels the return arrow to the previous station. */
const KREISLAUF = [
  {
    nummer: "1",
    titel: "Pflanzenzüchter",
    untertitel: "Züchter & Input-Firmen (Biologicals / Chemicals)",
    pfeil: "B2B-Forschungsbudget",
    pfeilSub: "Züchter bezahlen NoMaze für KI-Züchtungsmodelle",
    rueckPfeil: "Vorhersagen (G×E-Vorhersagen für die Züchtung)",
    rueckPfeilSub: "NoMaze liefert präzise In-Silico-Vorhersagen zurück an die Züchter",
    betont: false,
  },
  {
    nummer: "2",
    titel: "NoMaze Forschung",
    untertitel: "NoMaze In-Silico · G×E×M Simulation",
    pfeil: "Finanziert & baut Seedle",
    pfeilSub: "Querfinanzierung der Plattform & Infrastruktur",
    rueckPfeil: null,
    rueckPfeilSub: null,
    betont: false,
  },
  {
    nummer: "3",
    titel: "Seedle Plattform",
    untertitel: "Alle Tools kostenlos & neutral auf deinem Schlag",
    pfeil: "Nutzt den Landwirten (0 €)",
    pfeilSub: "Unabhängige Sortenempfehlung für deinen Schlag",
    rueckPfeil: null,
    rueckPfeilSub: null,
    betont: true,
  },
  {
    nummer: "4",
    titel: "Landwirte in der Praxis",
    untertitel: "0 € · heute und dauerhaft für deinen Hof",
    pfeil: null,
    pfeilSub: null,
    rueckPfeil: null,
    rueckPfeilSub: null,
    betont: false,
  },
] as const;

const GEM = [
  {
    buchstabe: "G",
    name: "Genotyp.",
    text: "Sorten-DNA: Reifeverhalten, Wurzeltiefe, Krankheitsresistenzen und genetisches Ertragspotenzial.",
  },
  {
    buchstabe: "E",
    name: "Umwelt.",
    text: "Klima & Boden: wechselnde Bodenhorizonte, Frühjahrskälte, Hitze- und Trockenstress in der Blüte, Starkregen, pH-Wert und Wasserhaltefähigkeit (nFK).",
  },
  {
    buchstabe: "M",
    name: "Management.",
    text: "Feld-Management, Biologicals & Chemicals im Zeitverlauf: Saatzeitpunkt, Bestandesdichte, Bodenbearbeitung (Pflug, Mulchsaat, Direktsaat) und vor allem: Wie reagieren Biostimulanzien, Mikrobiome oder chemische Pflanzenschutzmittel zu exakt welchen Wachstumsstadien (BBCH) und Wetterfenstern auf welche Genetik?",
  },
] as const;

const JA = [
  "Welche Sorte / Genetik auf welchem Bodentyp und in welchem Mikroklima wächst.",
  "Wie die Pflanze auf Trockenstress, Kälte, Bodenbearbeitung und Aussaatzeitpunkt reagiert.",
  "Wie Biologicals oder Pflanzenschutzmittel zu unterschiedlichen Zeitpunkten (BBCH-Stadien) mit der Sorte interagieren.",
  "Reale Ertrags-, Qualitäts- und Standfestigkeitsergebnisse der Pflanze am Saisonende.",
] as const;

const NEIN = [
  {
    titel: "Kein Adress- oder Kontakthandel:",
    text: "Dein Name, deine E-Mail und deine Telefonnummer werden niemals an Saatguthändler, Züchter-Vertriebler oder Dritte verkauft.",
  },
  {
    titel: "Keine Finanz- oder Betriebsdaten:",
    text: "Uns interessieren weder Pachtpreise, Kontostände, Buchhaltung noch Förderanträge.",
  },
  {
    titel: "Keine Weitergabe an Ämter oder Nachbarn:",
    text: "Einzelne Schlagdaten werden niemals an Behörden, Kontrollen oder Dritte durchgereicht.",
  },
] as const;

const TOOLS = [
  { name: "1-Klick-Schlagerkennung" },
  { name: "Sorten-Ranking" },
  { name: "Küchentisch-Vergleichsblatt" },
  { name: "Feld-Scouting" },
  { name: "Sprach- und Input-Tools", zukuenftig: true },
] as const;

/**
 * Numbered section: big numeral with topic and label in a narrow column, title and content beside it.
 * On phones the numeral sits next to the topic line above the title.
 */
function Abschnitt({
  nummer,
  id,
  thema,
  label,
  titel,
  children,
}: {
  nummer: number;
  id: string;
  thema: string;
  label: string;
  titel: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 border-t border-rule pb-section pt-6 lg:flex-row lg:gap-12 lg:pt-12">
      <div className="flex items-end gap-3 lg:block lg:w-[12.5rem] lg:flex-none">
        <p aria-hidden className="text-[4.5rem] font-extrabold leading-[0.82] tracking-[-0.06em] text-motif-accent lg:text-[7.5rem]">
          {nummer}
        </p>
        <div className="lg:mt-3">
          <p className="text-small font-bold text-fg">{thema}</p>
          <p className="text-caption font-semibold text-link">{label}</p>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <h2 id={id} className="max-w-[56rem] scroll-mt-24 text-title text-fg">
          {titel}
        </h2>
        {children}
      </div>
    </section>
  );
}

/** Fair value loop: four stations joined by explicit directed vector arrows + return feedback arrow from farmers back to NoMaze. */
function Kreislauf(): React.JSX.Element {
  return (
    <figure
      aria-labelledby="kreislauf-text"
      data-testid="fair-value-loop-diagram"
      className="mt-8 lg:mt-12"
    >
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        {KREISLAUF.map((station, i) => {
          const pfeil = station.pfeil;
          const pfeilSub = station.pfeilSub;
          const rueckPfeil = station.rueckPfeil;
          const rueckPfeilSub = station.rueckPfeilSub;
          const betont = station.betont;
          const isTargetStation = station.nummer === "2";
          return (
            <div key={station.titel} className="contents">
              <div
                data-testid={`kreislauf-node-${station.nummer}`}
                className={`einblenden relative flex flex-col justify-between rounded-panel px-4 py-4 lg:min-w-0 lg:flex-1 lg:p-5 ${
                  betont
                    ? "border-2 border-action bg-highlight"
                    : isTargetStation
                      ? "border-2 border-motif-accent bg-surface"
                      : "border border-control bg-surface"
                }`}
                style={{ animationDelay: `${i * 0.25}s` }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-highlight text-caption font-extrabold text-link tabular-nums">
                      {station.nummer}
                    </span>
                    {isTargetStation ? (
                      <span className="text-[11px] font-bold text-link">
                        ← Ziel des Daten-Rückflusses
                      </span>
                    ) : null}
                  </div>
                  <b className="mt-2 block text-fg lg:text-subheading">{station.titel}</b>
                  <span className="mt-1 block text-small text-fg-muted">
                    {station.untertitel}
                  </span>
                </div>
              </div>

              {pfeil ? (
                <div
                  data-testid={`kreislauf-arrow-${i + 1}`}
                  className="flex flex-col justify-center gap-2.5 py-2.5 pl-4 lg:w-44 lg:flex-none lg:px-2 lg:py-0"
                >
                  {/* Forward directed arrow (Station i -> Station i+1) */}
                  <div className="flex items-center gap-3 lg:flex-col lg:gap-1">
                    {/* Mobile vertical downward arrow SVG */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 44"
                      className="h-10 w-6 shrink-0 text-link lg:hidden"
                    >
                      <line
                        x1="12"
                        y1="2"
                        x2="12"
                        y2="32"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />
                      <polygon points="6,29 12,41 18,29" fill="currentColor" />
                    </svg>

                    <div className="min-w-0 lg:text-center">
                      <span className="block text-caption font-bold text-fg lg:leading-tight">
                        {pfeil}
                      </span>
                      {pfeilSub ? (
                        <span className="mt-0.5 block text-[11px] text-fg-muted lg:leading-snug">
                          {pfeilSub}
                        </span>
                      ) : null}
                    </div>

                    {/* Desktop horizontal right-pointing arrow SVG */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 112 22"
                      className="hidden h-5 w-full text-link lg:block"
                    >
                      <line
                        x1="4"
                        y1="11"
                        x2="96"
                        y2="11"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />
                      <polygon points="93,4 108,11 93,18" fill="currentColor" />
                    </svg>
                  </div>

                  {/* Reverse directed arrow (Station 2 NoMaze -> Station 1 Breeders: Predictions) */}
                  {rueckPfeil ? (
                    <div
                      data-testid={`kreislauf-arrow-${i + 1}-reverse`}
                      className="flex items-center gap-3 border-t border-divider pt-2 lg:flex-col lg:gap-1"
                    >
                      {/* Mobile vertical upward arrow SVG */}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 44"
                        className="h-10 w-6 shrink-0 text-motif-accent lg:hidden"
                      >
                        <line
                          x1="12"
                          y1="42"
                          x2="12"
                          y2="12"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        />
                        <polygon points="6,15 12,3 18,15" fill="currentColor" />
                      </svg>

                      {/* Desktop horizontal left-pointing arrow SVG */}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 112 22"
                        className="hidden h-5 w-full text-motif-accent lg:block"
                      >
                        <line
                          x1="108"
                          y1="11"
                          x2="16"
                          y2="11"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        />
                        <polygon points="19,4 4,11 19,18" fill="currentColor" />
                      </svg>

                      <div className="min-w-0 lg:text-center">
                        <span className="block text-caption font-bold text-link lg:leading-tight">
                          {rueckPfeil}
                        </span>
                        {rueckPfeilSub ? (
                          <span className="mt-0.5 block text-[11px] text-fg-muted lg:leading-snug">
                            {rueckPfeilSub}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Return Arrow 4: From Station 4 (farmers in practice) back to Station 2 (NoMaze research) */}
      <div data-testid="kreislauf-arrow-4-return" className="mt-3 lg:mt-1">
        {/* Desktop SVG loop from center of Station 4 (x=895) down, left, and UP into center of Station 2 (x=355) */}
        <svg
          aria-hidden="true"
          data-testid="kreislauf-return-arrow-svg"
          viewBox="0 0 1000 58"
          preserveAspectRatio="none"
          className="hidden h-14 w-full text-motif-accent lg:block"
        >
          {/* Start indicator dot under Station 4 */}
          <circle cx="895" cy="6" r="4.5" fill="currentColor" />
          {/* Directed return path: down from Station 4, left to Station 2, and up into Station 2 */}
          <path
            d="M 895 6 L 895 44 Q 895 52 885 52 L 365 52 Q 355 52 355 44 L 355 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          {/* Leftward direction chevron along the horizontal return bar */}
          <polygon points="635,45 619,52 635,59" fill="currentColor" />
          {/* Upward arrowhead pointing directly into Station 2 */}
          <polygon points="346,18 355,2 364,18" fill="currentColor" />
        </svg>

        <div className="rounded-panel border-2 border-motif-accent bg-surface px-4 py-3 lg:mx-auto lg:max-w-3xl lg:text-center">
          <div className="inline-flex flex-wrap items-center gap-2 text-small font-bold text-link">
            <CornerUpLeft className="size-4 shrink-0" aria-hidden="true" />
            <span>
              Rückkopplung (Landwirte in der Praxis → zurück zu NoMaze Forschung): Spielen anonymisierte G×E-Felddaten zurück zu NoMaze
            </span>
          </div>
          <p className="mt-1 text-caption text-fg-muted">
            Verbessert die Standort- und Umweltmodelle ohne Preisgabe privater Hofdaten · Anonymisierte Pflanzen- &amp; Umwelt-Erkenntnisse schließen die Labor-Feld-Lücke
          </p>
        </div>
      </div>

      <figcaption id="kreislauf-text" className="mt-3 max-w-[42.5rem] text-caption text-fg-muted lg:mt-4">
        Der faire Wert-Kreislauf: B2B-Forschung finanziert die Technologie, der Praxisnutzen für Landwirte bleibt
        dauerhaft frei.
      </figcaption>
    </figure>
  );
}

/**
 * Why-free page (`/warum-wir-das-machen` and `/warum-kostenlos`): the claim and a huge 0 €, the four questions everyone asks,
 * then four numbered sections: who pays (value loop), lab vs. field (self-drawing plots, P = G × E × M),
 * what we use and what never (yes/no table) and the promise that every farmer tool stays free.
 */
export default function WarumWirDasMachenPage(): React.JSX.Element {
  return (
    <div>
      {/* Hero: the claim and the number */}
      <section className="pb-7 pt-2 lg:pb-14">
        <Link
          href="/"
          className="-ml-1 inline-flex min-h-touch items-center gap-1 rounded-control px-1 text-small text-fg-muted transition-colors hover:text-fg"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Startseite
        </Link>
        <div className="mt-3 grid gap-y-5 lg:mt-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:gap-x-16 lg:gap-y-7">
          <div>
            <p className="text-small text-fg-muted sm:text-body">Warum kostenlos? · Offene Karten &amp; Geschäftsmodell</p>
            <h1 className="mt-2 max-w-[61rem] text-balance text-title sm:text-display text-fg lg:mt-3">
              Warum Seedle für Landwirte heute und in Zukunft 0 € kostet.
            </h1>
          </div>
          <div className="flex items-end gap-4 border-t-[3px] border-rule pt-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:block lg:self-end lg:pt-4">
            <p className="text-[7.5rem] font-extrabold leading-[0.8] tracking-[-0.06em] text-fg lg:text-[13.75rem]">
              0<span className="ml-[0.04em] text-[0.55em]">€</span>
            </p>
            <p className="text-small text-fg-muted lg:mt-4 lg:text-[1.0625rem]">
              für dich als Landwirt, heute und dauerhaft. Kein Abo, keine versteckte Gebühr und kein Freischalten von
              „Pro“-Funktionen.
            </p>
          </div>
          <p className="max-w-[42.5rem] text-[1.0625rem] text-fg-muted lg:col-start-1 lg:row-start-2 lg:text-[1.3125rem]">
            Wenn in der Landwirtschaft etwas kostenlos ist, fragt sich jeder zu Recht: Wo ist der Haken? Hier ist unsere
            ehrliche Antwort und die genaue Logik, warum wir jedes Tool, das deinem Betrieb hilft, dauerhaft kostenlos
            entwickeln.
          </p>
        </div>
      </section>

      {/* The four questions everyone asks, with short answers that link down */}
      <section aria-labelledby="fragen" className="border-t border-rule pb-7 pt-3.5 lg:pb-16 lg:pt-6">
        <h2 id="fragen" className="text-small font-bold text-fg-muted">
          Die vier Fragen, die sich jeder stellt
        </h2>
        <ol className="mt-2 grid lg:mt-6 lg:grid-cols-4">
          {FRAGEN.map((f) => (
            <li
              key={f.frage}
              className="flex flex-col gap-1 border-b border-divider py-3.5 lg:gap-2.5 lg:border-b-0 lg:border-l lg:px-8 lg:py-0 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
            >
              <p className="text-[1.1875rem] font-bold leading-[1.3] text-fg lg:text-[1.3125rem]">{f.frage}</p>
              <p className="text-fg-muted lg:text-[1.0625rem]">{f.antwort}</p>
              <a
                href={f.ziel}
                className="mt-1 self-start text-small font-semibold text-link underline decoration-link/40 underline-offset-4 hover:decoration-link lg:mt-auto lg:text-[0.9375rem]"
              >
                {f.abschnitt}
              </a>
            </li>
          ))}
        </ol>
      </section>

      {/* 1. Who pays */}
      <Abschnitt
        nummer={1}
        id="wer-zahlt"
        thema="Wer bezahlt die Rechnung?"
        label="B2B statt Landwirt-Abo"
        titel="Züchter & Input-Forschung statt Landwirte."
      >
        <div className="mt-4 grid gap-x-12 gap-y-3 lg:mt-6 lg:grid-cols-2">
          <p className="text-fg">
            Unsere zahlenden B2B-Kunden bei NoMaze sind <strong>Pflanzenzüchter (Pflanzenzüchtung)</strong> und{" "}
            <strong>Input-Unternehmen (Biologicals &amp; Pflanzenschutz / Chemicals)</strong>. Bevor sie Millionen Euro
            und 8 bis 10 Jahre in neue Kreuzungen oder neue biologische bzw. chemische Wirkstrukturen investieren, wollen
            sie wissen:
          </p>
          <p className="text-[1.1875rem] font-bold leading-[1.35] tracking-[-0.015em] text-fg lg:text-[1.5rem] lg:leading-[1.3]">
            „Wie performt diese Pflanzengenetik oder dieser Input wirklich auf echten Betrieben unter echtem Stress?“
          </p>
        </div>

        <Kreislauf />

        <div className="mt-8 grid border-t border-rule lg:mt-12 lg:grid-cols-2">
          <div className="border-b border-divider py-3.5 lg:border-b-0 lg:pb-0 lg:pr-10 lg:pt-6">
            <h3 className="text-[1.0625rem] font-bold text-fg lg:text-subheading">Was Züchter &amp; Input-Firmen bezahlen</h3>
            <p className="mt-1.5 text-[0.9375rem] text-fg-muted lg:mt-2 lg:text-body">
              NoMaze liefert In-Silico-Simulationen und belastbare Feld-Erkenntnisse für Forschung &amp; Entwicklung:
              Welche Genetik, welcher biologische Wirkstoff oder welches Pflanzenschutzmittel unter welchen Bedingungen
              stabil funktioniert.
            </p>
          </div>
          <div className="py-3.5 lg:border-l lg:border-divider lg:pb-0 lg:pl-10 lg:pt-6">
            <h3 className="text-[1.0625rem] font-bold text-fg lg:text-subheading">Was du als Landwirt bezahlst</h3>
            <p className="mt-1 text-[2.5rem] font-extrabold leading-none tracking-[-0.04em] text-fg lg:mt-1.5 lg:text-[3.25rem]">
              0 €
            </p>
            <p className="mt-1.5 text-[0.9375rem] text-fg-muted lg:mt-2 lg:text-body">
              Heute und dauerhaft. Kein Abo, keine versteckte Gebühr und kein Freischalten von „Pro“-Funktionen. Die
              Werkzeuge, die deinem Betrieb helfen, bleiben kostenlos.
            </p>
          </div>
        </div>
      </Abschnitt>

      {/* 2. Lab vs. field: two self-drawing illustrations, then the formula */}
      <Abschnitt
        nummer={2}
        id="labor-feld"
        thema="Die Lücke zwischen Labor und echtem Acker"
        label="G × E × M · Wissenschaft & Praxis"
        titel="Warum echte Felddaten für belastbare Empfehlungen unverzichtbar sind."
      >
        <p className="mt-4 max-w-[45rem] text-fg lg:mt-6">
          Wir können viel <em>in silico</em>, im Gewächshaus oder auf kleinen, einheitlichen Versuchsparzellen
          simulieren. Aber zwischen kontrollierten Laborversuchen und einem echten 30-Hektar-Schlag liegt eine große
          Lücke. Um diese Lücke zu schließen, arbeiten wir Hand in Hand mit Landwirten, als Partner auf Augenhöhe.
        </p>

        <figure className="mt-8 lg:mt-10">
          <div className="grid border-t border-rule sm:grid-cols-2">
            <div className="pt-4 sm:pr-8">
              <p className="font-bold text-fg">Labor-Versuch</p>
              <p className="mb-3 mt-0.5 text-small text-fg-muted">
                Gewächshaus, kleine einheitliche Parzellen, kontrollierte Bedingungen
              </p>
              <MotivLabor className="block h-auto w-full" />
            </div>
            <div className="mt-6 border-t border-divider pt-4 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-8">
              <p className="font-bold text-fg">Echter Acker</p>
              <p className="mb-3 mt-0.5 text-small text-fg-muted">
                Ein 30-Hektar-Schlag: wechselnde Böden, Wetter, Bearbeitung, Inputs
              </p>
              <MotivFeldmosaik variante="flach" seed={5} className="block h-auto w-full" />
            </div>
          </div>
          <figcaption className="mt-3 max-w-[45rem] text-caption text-fg-muted">
            Labor-Versuch vs. echter Acker (G × E × M): Kontrollierte Bedingungen erklären nicht alles. Reale Felder
            schließen die Lücke.
          </figcaption>
        </figure>

        <div className="mt-10 border-t border-rule pt-6 lg:mt-14">
          <h3 className="text-small font-bold text-fg-muted lg:text-[0.9375rem]">Die technische Formel</h3>
          <p
            className="mt-2 text-[3.5rem] font-extrabold leading-[0.95] tracking-[-0.05em] text-fg sm:text-[5rem] lg:text-[7rem]"
          >
            P = G <span className="text-motif-accent">×</span> E <span className="text-motif-accent">×</span> M
          </p>
          <p className="mt-4 max-w-[45rem] text-fg-muted">
            Der beobachtete Phänotyp (P), also das, was auf deinem Acker wirklich passiert, entsteht aus dem
            Zusammenspiel von Genetik, Umwelt und Management im Zeitverlauf.
          </p>
          <dl className="mt-6 grid border-t border-divider lg:mt-7 lg:grid-cols-3">
            {GEM.map((g) => (
              <div
                key={g.buchstabe}
                className="border-b border-divider py-5 lg:border-b-0 lg:border-l lg:px-8 lg:pb-0 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
              >
                <dt className="text-[3.25rem] font-extrabold leading-none tracking-[-0.04em] text-fg">{g.buchstabe}</dt>
                <dd className="mt-2 text-fg">
                  <strong>{g.name}</strong> {g.text}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-7 max-w-[45rem] text-fg">
            Wenn wir wissen, wo welche Sorte unter welchen Umwelt- und Managementbedingungen wächst, lernen unsere
            Modelle, wie Genetik und Inputs in der Natur tatsächlich interagieren, und liefern dir eine ehrliche,
            standortspezifische Empfehlung.
          </p>
        </div>
      </Abschnitt>

      {/* 3. Privacy: yes and no, row by row (rows line up on desktop through subgrid) */}
      <Abschnitt
        nummer={3}
        id="datenschutz"
        thema="Pflanzen-Biologie JA · Private Betriebsdaten NEIN"
        label="Privacy Firewall"
        titel="Klare Trennung: Was wir nutzen und was uns niemals interessiert."
      >
        <p className="mt-4 max-w-[45rem] text-fg lg:mt-6">
          Für bessere Modelle brauchen wir Signale von der Pflanze und ihrem Umfeld, nicht deine privaten Hof- und
          Betriebsgeheimnisse. Die Grenze ist glasklar.
        </p>
        <div className="mt-8 lg:mt-9 lg:grid lg:grid-cols-2 lg:grid-rows-[auto_repeat(4,auto)]">
          <div className="lg:row-span-5 lg:grid lg:grid-rows-subgrid">
            <h3 className="border-b border-rule pb-3 text-[1.1875rem] font-extrabold tracking-[-0.015em] text-fg lg:pr-8 lg:text-[1.3125rem]">
              Ja · Was uns wissenschaftlich hilft
            </h3>
            <ul className="lg:row-span-4 lg:grid lg:grid-rows-subgrid">
              {JA.map((punkt) => (
                <li key={punkt} className="flex gap-3 border-b border-divider py-4 text-fg lg:pr-8">
                  <Check className="mt-0.5 size-5 shrink-0 text-link" strokeWidth={2.4} aria-hidden />
                  <span>{punkt}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-10 lg:row-span-5 lg:mt-0 lg:grid lg:grid-rows-subgrid">
            <h3 className="border-b border-rule pb-3 text-[1.1875rem] font-extrabold tracking-[-0.015em] text-fg lg:border-l lg:border-l-divider lg:pl-8 lg:text-[1.3125rem]">
              Nein · Dein privates Hof- &amp; Betriebsgeheimnis bleibt 100 % geschützt
            </h3>
            <ul className="lg:row-span-4 lg:grid lg:grid-rows-subgrid">
              {NEIN.map((punkt) => (
                <li key={punkt.titel} className="flex gap-3 border-b border-divider py-4 text-fg lg:border-l lg:pl-8">
                  <X className="mt-0.5 size-5 shrink-0 text-fg-muted" strokeWidth={2.4} aria-hidden />
                  <span>
                    <strong>{punkt.titel}</strong> {punkt.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Abschnitt>

      {/* 4. Promise: every tool, 0 €, then talk to us */}
      <Abschnitt
        nummer={4}
        id="zukunft"
        thema="Jedes Tool für Landwirte bleibt dauerhaft kostenlos"
        label="Unser Versprechen"
        titel="Je nützlicher Seedle im Alltag ist, desto besser schließen wir die Lücke gemeinsam."
      >
        <ul aria-label="Tools für Landwirte" className="mt-8 border-t border-rule lg:mt-9 lg:grid lg:grid-cols-5">
          {TOOLS.map((tool) => {
            const zukuenftig = "zukuenftig" in tool && tool.zukuenftig;
            return (
              <li
                key={tool.name}
                className="flex items-baseline justify-between gap-4 border-b border-divider py-3.5 lg:block lg:border-b-0 lg:border-l lg:px-5 lg:py-[1.125rem] lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
              >
                <p className="font-bold text-fg">
                  {tool.name}
                  {zukuenftig ? <span className="ml-2 text-caption font-normal text-fg-muted lg:hidden">zukünftig</span> : null}
                </p>
                <p
                  className={`text-[1.5rem] font-extrabold leading-none tracking-[-0.03em] lg:mt-1.5 lg:text-[2rem] ${
                    zukuenftig ? "text-fg-muted" : "text-fg"
                  }`}
                >
                  0 €
                </p>
                {zukuenftig ? <p className="mt-1 hidden text-caption text-fg-muted lg:block">zukünftig</p> : null}
              </li>
            );
          })}
        </ul>
        <p className="mt-7 max-w-[45rem] text-fg">
          Ob 1-Klick-Schlagerkennung, Sorten-Ranking, Küchentisch-Vergleichsblatt, Feld-Scouting oder zukünftige
          Sprach- und Input-Tools:{" "}
          <strong>alle kommenden Tools für Landwirte auf Seedle bleiben zu 100 % kostenlos</strong>. Je hilfreicher
          Seedle in deiner täglichen Arbeit ist, desto besser können wir gemeinsam die Lücke zwischen Wissenschaft und
          Praxis schließen.
        </p>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-x-12 gap-y-6 border-t-[3px] border-rule pt-6 lg:mt-12">
          <div className="max-w-[40rem]">
            <h3 className="text-[1.625rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-fg lg:text-[2rem]">
              Sag uns, welches Tool du als Nächstes brauchst
            </h3>
            <p className="mt-2.5 text-fg-muted">
              Sprich direkt mit Jean-Pascal, Stani &amp; Finn: Dein Feedback bestimmt, was wir als Nächstes bauen.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <ButtonLink href="/feld/neu">
              <MapPin className="size-5" aria-hidden />
              <span>Persönliche Empfehlung starten</span>
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <CallTeamButton className={buttonClass("secondary")}>
              <Phone className="size-4" aria-hidden />
              <span>{TEAM.name} sprechen</span>
            </CallTeamButton>
          </div>
        </div>
      </Abschnitt>
    </div>
  );
}
