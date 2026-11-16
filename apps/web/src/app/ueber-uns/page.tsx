import { existsSync } from "node:fs";
import { join } from "node:path";
import { ArrowRight, ChevronLeft, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MotivFeldmosaik } from "@/components/motive/Feldmosaik";
import { CallTeamButton } from "@/components/spross/AskSpross";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { withBasePath } from "@/lib/basePath";
import { TEAM } from "@/lib/team";

export const metadata: Metadata = {
  title: "Über uns · Von der Raumfahrt und KI-Forschung auf deinen Acker",
  description:
    "Lerne Jean-Pascal Lutze, Finn Gaida und das Münchner NoMaze-Team hinter Seedle kennen: Von Robotik am DLR und Machine Learning an der TU München zu feldgenauen Modellen der Umweltinteraktion für deinen eigenen Hof.",
};

interface FounderProfile {
  initials: string;
  name: string;
  role: string;
  focus: string;
  imageSrc: string | null;
  imageAlt: string;
  quote: string;
  milestones: readonly { label: string; value: string }[];
  storyParagraphs: readonly string[];
  personalNote: string;
  email: string;
}

/**
 * Resolves Finn Gaida's real portrait image `/team/finn-gaida.jpg` across both server and static-export builds.
 */
function resolveFinnPortraitSrc(): string | null {
  try {
    const candidates = [
      join(process.cwd(), "public", "team", "finn-gaida.jpg"),
      join(process.cwd(), "apps", "web", "public", "team", "finn-gaida.jpg"),
    ];
    if (candidates.some((p) => existsSync(p))) {
      return withBasePath("/team/finn-gaida.jpg");
    }
  } catch {
    // Fallback to static public path below when node:fs is unavailable.
  }
  return withBasePath("/team/finn-gaida.jpg");
}

const FOUNDERS: readonly FounderProfile[] = [
  {
    initials: "JP",
    name: "Jean-Pascal Lutze",
    role: "Gründer & CEO",
    focus: "Robotik, Raumfahrt & Strategie der Umweltinteraktion",
    imageSrc: withBasePath("/team/jean-pascal-lutze.jpg"),
    imageAlt: "Jean-Pascal Lutze · Gründer und CEO von NoMaze und Seedle",
    quote:
      "Mich hat schon als Mechatroniker fasziniert, wie große Maschinen auf dem Feld arbeiten. Heute bauen wir mit derselben Ingenieurs-Präzision Werkzeuge für die wichtigste Maschine der Natur: die Genetik deiner Pflanzen.",
    milestones: [
      { label: "Handwerk & Wurzeln", value: "Gelernter Mechatroniker mit früher Leidenschaft für große Maschinen" },
      {
        label: "Studium (B.Sc. & M.Sc.)",
        value: "Robotics (B.Sc.) sowie Robotics, Cognition, Intelligence (M.Sc. an der TU München / TUM)",
      },
      {
        label: "Raumfahrt-Forschung",
        value:
          "Deutsches Zentrum für Luft- und Raumfahrt (DLR), Oberpfaffenhofen westlich von München · Bachelor-Praktikum und Forschung parallel zum Master",
      },
      { label: "Wissenschaftlicher Beitrag", value: "Papers & Patente in On-Orbit Assembly, Task & Motion Optimization" },
    ],
    storyParagraphs: [
      "Jean-Pascal hat von der Pike auf als gelernter Mechatroniker angefangen. Große Maschinen und handfeste Technik haben ihn schon früh begeistert. Doch schnell war ihm klar: Er wollte Maschinen nicht nur zusammenbauen, sondern sie von Grund auf selbst entwerfen, berechnen und konstruieren.",
      "Er studierte Robotics (B.Sc.) und Robotics, Cognition, Intelligence (M.Sc. an der TU München / TUM). Seine Leidenschaft für Space Tech führte ihn ans Deutsche Zentrum für Luft- und Raumfahrt (DLR) westlich von München (Oberpfaffenhofen): Dort absolvierte er sein Bachelor-Praktikum und forschte parallel zum gesamten Masterstudium an On-Orbit Assembly, Task and Motion Optimization für Raumfahrtsysteme. Aus diesen Arbeiten gingen wissenschaftliche Papers und Patente hervor.",
    ],
    personalNote: "Für eine technische Diskussion ist Jean-Pascal immer zu haben.",
    email: "jean-pascal.lutze@nomaze.com",
  },
  {
    initials: "FG",
    name: "Finn Gaida",
    role: "Gründer & CTO",
    focus: "KI-Architektur, GxE-Modelle & Plattform",
    imageSrc: resolveFinnPortraitSrc(),
    imageAlt: "Finn Gaida · Gründer und CTO von NoMaze und Seedle",
    quote:
      "Die beste KI ist die, die man gar nicht als komplizierte Technik wahrnimmt: Du tippst auf deinen Schlag, und in Sekunden steckt die Erfahrung aus tausenden Umwelt- und Genetik-Datenpunkten in einer klaren Antwort.",
    milestones: [
      { label: "Früher Software-Pionier", value: "Mit 14 Jahren erste eigene Apps entwickelt und veröffentlicht" },
      { label: "Studium (B.Sc. & M.Sc.)", value: "Software Engineering / Informatik an der TU München (TUM) & UnternehmerTUM" },
      {
        label: "Praxis-KI im Alltag",
        value: "Machine Learning im HealthTech-Bereich bei Kaia Health · verlässliche KI für tausende Patientinnen und Patienten",
      },
      {
        label: "Rolle bei NoMaze & Seedle",
        value: "CTO und Co-Founder: Chefarchitekt unserer Modelle zur Umweltinteraktion (Genotyp × Umwelt) und der Seedle-Plattform",
      },
    ],
    storyParagraphs: [
      "Finn begann als App-Entwickler bereits mit 14 Jahren und veröffentlichte früh seine ersten eigenen Apps, angetrieben von dem Wunsch, komplexe Technologie für Menschen intuitiv und unmittelbar nützlich zu machen.",
      "Er studierte Software Engineering / Informatik an der TU München (TUM) und entwickelte anschließend bei Kaia Health im HealthTech-Bereich produktive Machine-Learning-Systeme, die täglich tausenden Patientinnen und Patienten verlässlich halfen. Heute verantwortet er als CTO und Co-Founder von NoMaze unsere Modelle zur Umweltinteraktion (Genotyp × Umwelt) und die Seedle-Plattform und übersetzt Millionen von Versuchs-, Boden- und Wetterdatenpunkten in klare, ehrliche Sortenempfehlungen in Sekunden.",
    ],
    personalNote:
      "Finn steht im Team für ruhige Präzision, eine große Liebe für klare, saubere Produkte und echte Nähe zu den Menschen, die unsere Technologie im Alltag nutzen.",
    email: "finn.gaida@nomaze.com",
  },
] as const;

const KENNZAHLEN = [
  { wert: "2022", einheit: "München", label: "Gründung der NoMaze GmbH nach dem Impuls aus Weihenstephan" },
  { wert: "10", einheit: "Jahre", label: "historische Wetterreihen und regionale Klimamodelle je Ackerschlag" },
  { wert: "3", einheit: "Modelle", label: "kombiniert aus Pflanzenbau-Wissensbaum, LSV-Statistik und ML-Umweltinteraktion" },
  { wert: "0 €", einheit: "für Höfe", label: "dauerhaft kostenlos und unabhängig für Landwirtinnen und Landwirte" },
] as const;

const MUNICH_DISCIPLINES = [
  "Genetik-Experten & Quantitative Züchter",
  "Mathematiker & Biometriker",
  "Physiker & Klimamodellierer",
  "Robotiker & KI-Forscher",
  "Software-Ingenieure",
  "Biologen & Agrar-Praktiker",
] as const;

const TRUST_PROMISES = [
  {
    title: "Neutrale Empfehlung nach Ackerleistung",
    text: "Kein Züchter und kein Händler kann sich bei uns Platz 1 kaufen. Das Ranking wird ausschließlich aus der agronomischen Leistung auf deinem Boden, deiner Fruchtfolge und den lokalen Klimaszenarien berechnet.",
    label: "Unabhängig & werbefrei im Ranking",
  },
  {
    title: "Feldgenau statt Großregion",
    text: "Pauschale PDF-Tabellen für ein ganzes Bundesland reichen nicht. Wir berücksichtigen deinen konkreten Schlag: Bodenart, Wasserspeicherfähigkeit (nFK), mehrjähriges Standortwetter, Bodenbearbeitung und deine Wachstumsziele.",
    label: "Schlagspezifische GxE-Auswertung",
  },
  {
    title: "Von Agrar- & KI-Praktikern gebaut",
    text: "Hinter Seedle stehen keine anonymen Algorithmen, sondern ein nahbares Team aus Ingenieuren, Wissenschaftlern und Agrar-Praktikern in München. Wenn du Fragen hast, erreichst du uns jederzeit direkt am Telefon.",
    label: "Direkter Draht zum Team",
  },
] as const;

/** Portrait or, without a real photo, the initials on a quiet surface. */
function Portrait({
  founder,
  className,
  initialsClass,
  sizes,
  priority = false,
}: {
  founder: FounderProfile;
  className: string;
  initialsClass: string;
  sizes: string;
  priority?: boolean;
}) {
  if (founder.imageSrc) {
    return (
      <Image
        src={withBasePath(founder.imageSrc)}
        alt={founder.imageAlt}
        width={800}
        height={800}
        sizes={sizes}
        unoptimized
        priority={priority}
        className={`block w-full rounded-panel object-cover object-[50%_15%] ${className}`}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={`Platzhalter für das Foto von ${founder.name}`}
      className={`grid w-full place-items-center rounded-panel bg-highlight font-extrabold tracking-[-0.05em] text-fg-muted ${className} ${initialsClass}`}
    >
      {founder.initials}
    </div>
  );
}

/**
 * About page (`/ueber-uns`): big statement, "Unser Weg" as a self-drawing line, key figures,
 * the founders as editorial rows (portrait, big quote, story, milestones), the Weihenstephan origin,
 * reference partners set like credits, the Munich team as field plots, three promises and a call to action.
 */
export default function UeberUnsPage() {
  return (
    <div>
      {/* Hero: statement and the two founders at a glance */}
      <section className="pb-14 pt-2">
        <Link
          href="/"
          className="-ml-1 inline-flex min-h-touch items-center gap-1 rounded-control px-1 text-small text-fg-muted transition-colors hover:text-fg"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Startseite
        </Link>
        <p className="mt-5 text-fg-muted">Über uns · NoMaze GmbH aus München</p>
        <h1 className="mt-3 max-w-6xl text-title sm:text-display text-fg">
          Von der Raumfahrt und KI-Forschung auf deinen Acker.
        </h1>
        <div className="mt-10 flex flex-wrap items-end gap-x-16 gap-y-10">
          <p className="min-w-0 max-w-[42rem] flex-[999_1_32rem] text-lead text-fg-muted sm:text-[1.3125rem]">
            Wir sind Jean-Pascal, Finn und das Münchner Team von NoMaze. Wir bringen weltklasse Pflanzen-Genetik und
            Umweltinteraktion direkt zu Landwirtinnen und Landwirten: praxisnah, verständlich und unabhängig auf deinen
            Hof.
          </p>
          <div className="grid flex-[1_1_22rem] grid-cols-2 gap-4 sm:gap-5">
            {FOUNDERS.map((f) => (
              <figure key={f.name}>
                <Portrait
                  founder={f}
                  priority={true}
                  className="aspect-square"
                  initialsClass="text-[2.5rem] sm:text-[3.5rem]"
                  sizes="(min-width: 1024px) 220px, 45vw"
                />
                <figcaption className="mt-2.5 text-small">
                  <b className="text-fg">{f.name}</b>
                  <br />
                  <span className="text-fg-muted">{f.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Key figures */}
      <dl className="grid grid-cols-2 border-t border-rule border-b border-divider lg:grid-cols-4">
        {KENNZAHLEN.map((k, i) => (
          <div
            key={k.label}
            className={`flex flex-col-reverse gap-1.5 border-divider py-5 pr-4 ${i % 2 === 1 ? "border-l pl-4" : ""} ${
              i >= 2 ? "border-t lg:border-t-0" : ""
            } lg:pl-6 lg:first:pl-0 ${i > 0 ? "lg:border-l" : ""}`}
          >
            <dt className="text-small text-fg-muted">{k.label}</dt>
            <dd className="text-figure-l tabular-nums text-fg">
              {k.wert}
              {k.einheit ? <span className="ml-1.5 text-[0.42em] font-bold tracking-normal">{k.einheit}</span> : null}
            </dd>
          </div>
        ))}
      </dl>

      {/* Founders: editorial rows, the second one mirrored on desktop via lg:order-last */}
      <section aria-labelledby="founders-heading" className="pt-section">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <p className="text-fg-muted">Die Gründer hinter NoMaze &amp; Seedle</p>
            <h2 id="founders-heading" className="mt-2 text-title text-fg">
              Zwei Münchner Ingenieure mit einer gemeinsamen Mission
            </h2>
          </div>
          <span className="text-small text-fg-muted">Wer wir sind: Züchter-Wissen direkt für deinen Acker.</span>
        </div>

        {FOUNDERS.map((founder, idx) => (
          <article
            key={founder.name}
            className={`mt-10 flex flex-wrap gap-x-16 gap-y-10 border-t border-rule pt-10 ${
              idx > 0 ? "lg:mt-16" : ""
            }`}
          >
            <figure
              className={`max-w-[32.5rem] flex-[1_1_22rem] ${
                idx % 2 === 1 ? "lg:order-last" : ""
              }`}
            >
              <Portrait
                founder={founder}
                priority={false}
                className="aspect-[4/5]"
                initialsClass="text-[7.5rem]"
                sizes="(min-width: 1024px) 520px, 100vw"
              />
              <figcaption className="mt-2.5 text-caption text-fg-muted">
                {founder.imageSrc ? "NoMaze GmbH · München" : "Echtes Foto folgt · NoMaze GmbH · München"}
              </figcaption>
            </figure>

            <div className="min-w-0 flex-[999_1_34rem]">
              <p className="text-caption font-semibold text-link">{founder.focus}</p>
              <h3 className="mt-1.5 text-title text-fg">{founder.name}</h3>
              <p className="mt-1 text-subheading text-fg-muted">{founder.role}</p>
              <blockquote className="mt-8 max-w-3xl text-[1.3125rem] font-semibold leading-[1.35] tracking-[-0.015em] text-fg sm:text-[1.6875rem]">
                <span aria-hidden className="font-extrabold text-motif-accent">
                  „
                </span>
                {founder.quote}
                <span aria-hidden className="font-extrabold text-motif-accent">
                  “
                </span>
              </blockquote>
              <div className="mt-8 grid gap-6 md:grid-cols-2 md:gap-10">
                {founder.storyParagraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)} className="text-body text-fg">
                    {paragraph}
                  </p>
                ))}
              </div>
              <p className="mt-5 max-w-3xl text-body text-fg-muted">{founder.personalNote}</p>
              <dl className="mt-7 grid border-t border-divider text-[0.9375rem] md:grid-cols-2 md:gap-x-10">
                {founder.milestones.map((m) => (
                  <div key={m.label} className="border-b border-divider py-3">
                    <dt className="text-caption text-fg-muted">{m.label}</dt>
                    <dd className="mt-0.5 text-fg">{m.value}</dd>
                  </div>
                ))}
              </dl>
              <a
                href={`mailto:${founder.email}`}
                className="mt-4 inline-flex min-h-touch items-center gap-2 font-semibold text-link underline decoration-link/40 underline-offset-4 hover:decoration-link"
              >
                <Mail className="size-4" aria-hidden />
                {founder.email}
              </a>
            </div>
          </article>
        ))}
      </section>

      {/* Origin: the sentence that started it, the story and the question */}
      <section aria-labelledby="origin-story" className="mt-section border-t border-rule pb-section pt-12">
        <p className="text-fg-muted">Unsere Gründungsgeschichte · Ein Kontakt aus Weihenstephan, 2022</p>
        <p className="mt-4 max-w-6xl text-[2.5rem] font-extrabold leading-[1.02] tracking-[-0.04em] text-fg sm:text-[4rem]">
          <span aria-hidden className="text-motif-accent">
            „
          </span>
          Macht doch mal was wirklich Sinnvolles mit eurer Technologie!
          <span aria-hidden className="text-motif-accent">
            “
          </span>
        </p>
        <h2 id="origin-story" className="mt-14 text-heading text-fg">
          Vom Impuls in Weihenstephan (2022) zu Seedle
        </h2>
        <div className="mt-5 flex flex-wrap gap-x-16 gap-y-10">
          <div className="grid min-w-0 flex-[999_1_32rem] content-start gap-5 md:grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] md:gap-x-10">
            <p>
              Alles begann im Jahr <strong>2022</strong> mit einem ehrlichen Satz eines Kontakts aus{" "}
              <strong>Weihenstephan</strong>, der uns als junge Münchner Forscher direkt herausforderte. Dieser Satz
              hat uns nicht mehr losgelassen.
            </p>
            <p>
              Als wir tiefer in die Pflanzenzüchtung eintauchten, packte uns sofort die Faszination: Wie lässt sich
              die <strong>DNA von Pflanzen</strong> mathematisch entschlüsseln, und wie interagiert diese Genetik mit
              der echten, hochkomplexen <strong>Umwelt aus Boden, Wasser und Witterung (Genotyp × Umwelt / GxE)</strong>?
            </p>
            <p>
              Noch 2022 gründeten wir die <strong>NoMaze GmbH</strong> in München, um für Pflanzenzüchter{" "}
              <strong>Kreuzungsvorhersagen mit Umweltinteraktion</strong> zu entwickeln. Unsere Modelle helfen Züchtern
              dabei, aus Millionen möglicher Elternlinien genau jene Sorten zu identifizieren, die unter realen
              Klimabedingungen stabil abliefern.
            </p>
          </div>
          <aside className="flex-[1_1_22rem] border-t-[3px] border-rule pt-5">
            <p className="text-[0.9375rem] text-fg-muted">Doch von Anfang an trugen wir eine Frage in uns:</p>
            <p className="mt-2.5 text-[1.5rem] font-bold leading-[1.3] tracking-[-0.015em] text-fg">
              „Wie können wir diese extrem hilfreiche Technologie auch der breiten Gesellschaft und vor allem dem
              Landwirt als Endnutzer direkt zugutekommen lassen?“
            </p>
            <p className="mt-4">
              Die Antwort auf genau diese Frage ist <strong>Seedle</strong>: Das Wissen aus der Spitzenzüchtung gehört
              nicht hinter verschlossene Labortüren, sondern als ehrliches, neutrales Werkzeug direkt auf deinen
              Schlag.
            </p>
          </aside>
        </div>
      </section>

      {/* Team in Munich: disciplines as field plots */}
      <section aria-labelledby="munich-team-heading" className="border-t border-rule pb-section pt-12">
        <div className="min-w-0">
          <p className="text-fg-muted">Unser Team in München · Theresienstraße</p>
          <h2 id="munich-team-heading" className="mt-2 max-w-4xl text-title text-fg">
            Interdisziplinäre Forschung und echter Stolz auf die Landwirtschaft
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 md:gap-x-10">
            <p>
              Hinter NoMaze und Seedle steht heute ein eng zusammengeschweißtes, interdisziplinäres Team im Herzen von{" "}
              <strong>München</strong>: Bei uns arbeiten Genetik-Experten, Mathematiker, Physiker, Robotiker,
              Software-Ingenieure und Biologen jeden Tag Seite an Seite an denselben Modellen.
            </p>
            <p className="text-fg-muted">
              Was uns dabei jeden Morgen antreibt, ist echte Dankbarkeit: Wir sind unglaublich stolz darauf, in{" "}
              <strong className="text-fg">einer der besten, bodenständigsten und wichtigsten Industrien der Welt</strong>{" "}
              arbeiten zu dürfen. Dass uns Züchter und Landwirte vom ersten Tag an so viel Vertrauen geschenkt haben,
              sehen wir nicht als selbstverständlich an. Wir zahlen dieses Vertrauen mit ehrlicher Arbeit,
              wissenschaftlicher Sorgfalt und kompromissloser Neutralität zurück.
            </p>
          </div>
          <h3 className="mt-9 text-[0.9375rem] font-bold text-fg">Disziplinen in unserem Münchner Team</h3>
          <ul className="mt-3 grid grid-cols-2 border-l border-t border-divider border-t-rule md:grid-cols-3">
            {MUNICH_DISCIPLINES.map((discipline, i) => (
              <li
                key={discipline}
                className={`min-h-24 border-b border-r border-divider px-4 py-5 text-[1.0625rem] font-bold leading-snug text-fg sm:px-5 sm:text-[1.1875rem] ${
                  i === MUNICH_DISCIPLINES.length - 1 ? "bg-highlight" : ""
                }`}
              >
                {discipline}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Three promises with big numerals */}
      <section aria-labelledby="trust-promises" className="border-t border-rule pb-section pt-12">
        <p className="text-fg-muted">Unser Ehrenwort an dich</p>
        <h2 id="trust-promises" className="mt-2 text-title text-fg">
          Warum du unserer Empfehlung vertrauen kannst
        </h2>
        <ol className="mt-9 grid gap-10 lg:grid-cols-3 lg:gap-0">
          {TRUST_PROMISES.map((p, i) => (
            <li
              key={p.title}
              className="flex flex-col gap-3 lg:border-l lg:border-divider lg:px-10 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
            >
              <span aria-hidden className="text-[4rem] font-extrabold leading-[0.9] tracking-[-0.05em] text-motif-accent">
                {i + 1}
              </span>
              <h3 className="text-[1.3125rem] font-extrabold tracking-[-0.015em] text-fg">{p.title}</h3>
              <p className="text-fg-muted">{p.text}</p>
              <p className="text-caption font-semibold text-link">{p.label}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Call to action beside the self-drawing field */}
      <section aria-labelledby="cta-heading" className="flex flex-wrap items-center gap-x-16 gap-y-10 border-t border-rule pb-12 pt-12">
        <div className="max-w-[40rem] flex-[1_1_30rem]">
          <p className="text-fg-muted">Bereit für deinen eigenen Schlag?</p>
          <h2 id="cta-heading" className="mt-2 text-title text-fg">
            Teste es jetzt auf deinem eigenen Schlag
          </h2>
          <p className="mt-4 text-lead text-fg-muted">
            Wähle deinen Schlag auf dem Satellitenbild, prüfe die automatisch erkannten Bodendaten und erhalte in unter
            60 Sekunden deine Sortenempfehlung für 2027.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <ButtonLink href="/feld/neu">
              <MapPin className="size-5" aria-hidden />
              <span>Teste es jetzt auf deinem eigenen Schlag</span>
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <CallTeamButton className={buttonClass("secondary")}>
              <Phone className="size-4" aria-hidden />
              <span>{TEAM.name} sprechen</span>
            </CallTeamButton>
          </div>
        </div>
        <div className="min-w-0 flex-[1_1_26rem]">
          <MotivFeldmosaik variante="flach" seed={11} className="h-auto w-full" />
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-divider pt-6 text-small text-fg-muted">
        <span>
          <strong className="text-fg">NoMaze GmbH</strong> · Theresienstr. 148D · 80333 München · Für Landwirte
          kostenlos
        </span>
        <span>Erreichbarkeit: {TEAM.erreichbar}</span>
      </div>
    </div>
  );
}
