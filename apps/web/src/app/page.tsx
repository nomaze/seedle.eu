import { ArrowRight, Database, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, Suspense } from "react";
import { MotivBoden, MotivParzellen, MotivSchlag, MotivWuchs } from "@/components/motive/Motive";
import { NurMit } from "@/components/shell/DemoContext";
import { AskSprossButton } from "@/components/spross/AskSpross";
import { SprossAvatar } from "@/components/spross/SprossAvatar";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getDictionary } from "@/lib/i18n";
import { PARTNER } from "@/lib/partners";
import { listFields } from "@/server/services/fields";
import { trialResultCount } from "@/server/services/recommendations";
import { currentUser } from "@/server/session";
import { getServerLocale } from "@/server/i18n";

/**
 * Landing page: wide canvas layout (.seite-breit). Each section
 * features background illustration motifs: field parcels, trials, phenology stages, soil.
 */
export default async function StartPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const versuche = trialResultCount();

  return (
    <div className="seite-breit space-y-16 sm:space-y-24">
      <section className="relative flex min-h-[calc(82dvh-4rem)] flex-col justify-center py-8 sm:py-12">
        <div className="pointer-events-none absolute -right-[38vw] top-1/2 w-[120vw] -translate-y-1/2 opacity-70 sm:-right-[6vw] sm:w-[min(58vw,800px)] sm:opacity-100">
          <MotivSchlag />
        </div>
        <div className="relative">
          <h1 className="text-[3rem] font-extrabold leading-[0.95] tracking-[-0.045em] text-ink sm:text-7xl lg:text-[clamp(3rem,calc((100vw-29rem)/10),6.5rem)]">
            {t.landing.heroTitle1}
            <br />
            <span className="text-leaf-700">{t.landing.heroTitle2}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium text-muted sm:text-xl">
            {t.landing.heroSubtitle(versuche)}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink
              href="/feld/neu"
              data-spross-target="feld-button"
              data-spross-label={t.landing.ctaRecommend}
              className="h-14 px-7 text-[1.0625rem] shadow-lift"
            >
              <MapPin className="size-5" /> {t.landing.ctaRecommend}
            </ButtonLink>
            <NurMit funktion="stoebern">
              <ButtonLink
                href="/daten"
                variant="secondary"
                data-spross-target="daten-button"
                data-spross-label={t.landing.ctaBrowse}
                className="h-14 px-7 text-[1.0625rem]"
              >
                <Database className="size-5 text-leaf-700" /> {t.landing.ctaBrowse}
              </ButtonLink>
            </NurMit>
            <NurMit funktion="anmeldung">
              <Link
                href="/anmelden"
                data-spross-target="login-link"
                data-spross-label={t.landing.ctaLogin}
                className="px-3 text-[0.95rem] font-bold text-leaf-800 underline decoration-leaf-300 decoration-[1.5px] underline-offset-4 hover:decoration-leaf-600"
              >
                {t.landing.ctaLogin}
              </Link>
            </NurMit>
          </div>
        </div>

        {/*
          Partners: seamless marquee ribbon across full width (.laufband in globals.css).
          List is duplicated for infinite continuous scroll; second instance is hidden from screen readers.
        */}
        <div className="relative mt-12 sm:mt-16">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">{t.landing.partnersTitle}</h2>
          <div className="laufband mt-4">
            <div className="laufband-spur">
              {[0, 1].map((kopie) => (
                <ul key={kopie} aria-hidden={kopie === 1 || undefined} className="laufband-kopie flex shrink-0 items-center gap-x-12 pr-12">
                  {PARTNER.map((p) => {
                    return (
                      <li
                        key={p.name}
                        title={`${p.name} (${p.art})`}
                        className="flex h-10 shrink-0 items-center opacity-80 hover:opacity-100 transition-opacity"
                      >
                        {p.logo ? (
                          <Image
                            src={p.logo}
                            alt={p.name}
                            width={140}
                            height={42}
                            className={`${p.hoch ? "h-10" : "h-7"} w-auto`}
                          />
                        ) : (
                          <span className="max-w-[8rem] text-sm font-bold leading-tight text-[#4b5a51]">
                            {p.name}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ))}
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-muted">
            {t.landing.partnersNeutrality}
          </p>
        </div>
      </section>

      <Suspense fallback={null}>
        <Weitermachen />
      </Suspense>

      <section aria-labelledby="ablauf" className="relative">
        <div className="pointer-events-none absolute -top-8 right-0 w-[70vw] opacity-50 sm:-top-12 sm:w-[min(40vw,480px)] sm:opacity-100">
          <MotivParzellen beimScrollen />
        </div>
        <div className="relative">
          <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-leaf-700">{t.landing.stepsEyebrow}</div>
          <h2 id="ablauf" className="mt-2.5 text-[2rem] font-extrabold leading-none tracking-[-0.035em] sm:text-5xl whitespace-pre-line">
            {t.landing.stepsTitle}
          </h2>
          <ol className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-3">
            {[
              [t.landing.step1Title, t.landing.step1Desc],
              [t.landing.step2Title, t.landing.step2Desc],
              [t.landing.step3Title, t.landing.step3Desc],
            ].map(([titel, text], i) => (
              <li key={titel} className="rounded-3xl bg-white/88 p-6 shadow-soft ring-1 ring-line backdrop-blur-sm sm:p-7">
                <div className="text-6xl font-extrabold leading-none tracking-[-0.05em] text-leaf-600">{i + 1}</div>
                <div className="mt-4 text-2xl font-extrabold tracking-tight">{titel}</div>
                <p className="mt-1.5 font-medium text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <NurMit funktion="spross">
        <section className="relative grid items-center gap-7 overflow-hidden rounded-[2rem] bg-ink px-6 pb-40 pt-8 text-white sm:grid-cols-[auto_1fr] sm:gap-9 sm:p-12">
          <div
            className="pointer-events-none absolute -bottom-1.5 right-0 w-full opacity-50 sm:-right-2.5 sm:w-[min(54%,560px)] sm:opacity-55"
            style={{ "--motiv-farbe": "var(--color-leaf-400)" } as CSSProperties}
          >
            <MotivWuchs beimScrollen />
          </div>
          <div className="relative flex size-24 items-center justify-center rounded-full bg-white/8 ring-1 ring-white/12 sm:size-32">
            <SprossAvatar size={96} />
          </div>
          <div className="relative">
            <h2 className="text-[2rem] font-extrabold leading-none tracking-[-0.035em] sm:text-5xl">{t.landing.sprossTitle}</h2>
            <p className="mt-4 max-w-2xl text-lg font-medium text-white/88">
              {t.landing.sprossText}
            </p>
            <AskSprossButton className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-ink transition hover:bg-leaf-50">
              {t.landing.sprossCta} <ArrowRight className="size-4 text-leaf-700" />
            </AskSprossButton>
          </div>
        </section>
      </NurMit>

      <div aria-hidden className="h-28 sm:h-40">
        <MotivBoden beimScrollen className="h-full" />
      </div>
    </div>
  );
}

/** Resume workflow component for authenticated users returning to active field parcels. */
async function Weitermachen() {
  const user = await currentUser();
  if (!user.emailVerified) return null;
  const felder = await listFields(user.id);
  if (felder.length === 0) return null;
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return (
    <Card className="mx-auto max-w-3xl">
      <div className="mb-3 text-lg font-semibold">{t.landing.continueTitle}</div>
      <ul className="divide-y divide-line">
        {felder.slice(0, 3).map((f) => {
          const [href, schritt] = f.selectedVarietyId
            ? [`/heute?feld=${f.id}`, t.landing.continueToday]
            : f.usage
              ? [`/feld/${f.id}/ranking`, t.landing.continueRanking]
              : [`/feld/${f.id}`, t.landing.continueVarieties];
          return (
            <li key={f.id}>
              <Link href={href} className="flex items-center justify-between gap-3 py-3 hover:text-leaf-700">
                <span>
                  <span className="font-medium">{f.name}</span>
                  <span className="block text-sm text-muted">
                    {f.env.region} · {f.areaHa.toLocaleString(locale === "de" ? "de-DE" : "en-US")} ha
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-leaf-700">
                  {schritt} <ArrowRight className="size-4" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
