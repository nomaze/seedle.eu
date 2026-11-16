import { ArrowRight, Database, MapPin } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { MotivFeldmosaik } from "@/components/motive/Feldmosaik";
import { NurMit } from "@/components/shell/DemoContext";
import { AskSprossButton } from "@/components/spross/AskSpross";
import { SprossAvatar } from "@/components/spross/SprossAvatar";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getDictionary } from "@/lib/i18n";
import { listFields } from "@/server/services/fields";
import { currentUser } from "@/server/session";
import { getServerLocale } from "@/server/i18n";

/**
 * Landing page: the self-drawing field mosaic across the full width (your field highlighted),
 * headline below it, three steps separated by dividers, partners. Full width between the page margins.
 */
export default async function StartPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);

  const highlightPhrase = locale === "de" ? "Deine beste Sorte" : "Your best variety";
  const heroTitle2 = t.landing.heroTitle2;
  const highlightIndex = heroTitle2.indexOf(highlightPhrase);

  return (
    <div>
      <div className="-mx-gutter -mt-6 border-b border-divider sm:-mt-8">
        <MotivFeldmosaik variante="band" seed={11} className="h-[220px] w-full sm:h-[320px] lg:h-[380px]" />
      </div>

      <section className="py-section">
        <h1 className="text-display max-w-5xl text-fg">
          {t.landing.heroTitle1}
          <br />
          {highlightIndex >= 0 ? (
            <>
              {heroTitle2.slice(0, highlightIndex)}
              <span
                className="text-[var(--color-text-highlight)]"
                style={{ color: "var(--color-text-highlight, #2E7D4F)" }}
              >
                {highlightPhrase}
              </span>
              {heroTitle2.slice(highlightIndex + highlightPhrase.length)}
            </>
          ) : (
            <span style={{ color: "var(--color-text-highlight, #2E7D4F)" }}>{heroTitle2}</span>
          )}
        </h1>
        <p className="mt-6 max-w-measure text-lead text-fg-muted">{t.landing.heroSubtitle()}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink
            href="/feld/neu"
            data-spross-target="feld-button"
            data-spross-label={t.landing.ctaRecommend}
          >
            <MapPin className="size-5" aria-hidden /> {t.landing.ctaRecommend}
          </ButtonLink>
          <NurMit funktion="stoebern">
            <ButtonLink
              href="/daten"
              variant="secondary"
              data-spross-target="daten-button"
              data-spross-label={t.landing.ctaBrowse}
            >
              <Database className="size-5" aria-hidden /> {t.landing.ctaBrowse}
            </ButtonLink>
          </NurMit>
          <NurMit funktion="anmeldung">
            <Link
              href="/anmelden"
              data-spross-target="login-link"
              data-spross-label={t.landing.ctaLogin}
              className="px-2 font-semibold text-link underline decoration-link/40 underline-offset-4 hover:decoration-link"
            >
              {t.landing.ctaLogin}
            </Link>
          </NurMit>
        </div>
      </section>

      <section aria-labelledby="ablauf" className="border-t border-divider py-section">
        <h2 id="ablauf" className="text-heading whitespace-pre-line text-fg">
          {t.landing.stepsTitle}
        </h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-0">
          {[
            [t.landing.step1Title, t.landing.step1Desc],
            [t.landing.step2Title, t.landing.step2Desc],
            [t.landing.step3Title, t.landing.step3Desc],
          ].map(([titel, text], i) => (
            <li
              key={titel}
              className="flex flex-col gap-3 md:border-l md:border-divider md:px-8 md:first:border-l-0 md:first:pl-0 md:last:pr-0"
            >
              <span className="text-figure-l tabular-nums text-motif-accent" aria-hidden>
                {i + 1}
              </span>
              <h3 className="text-[1.1875rem] font-bold text-fg">{titel}</h3>
              <p className="text-fg-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <Suspense fallback={null}>
        <Weitermachen />
      </Suspense>

      <NurMit funktion="spross">
        <section className="flex flex-col gap-6 border-t border-divider py-10 sm:flex-row sm:items-center sm:gap-10">
          <SprossAvatar size={88} />
          <div className="min-w-0">
            <h2 className="text-heading text-fg">{t.landing.sprossTitle}</h2>
            <p className="mt-3 max-w-2xl text-fg-muted">{t.landing.sprossText}</p>
            <AskSprossButton className={`${buttonClass("secondary")} mt-5`}>
              {t.landing.sprossCta} <ArrowRight className="size-4" aria-hidden />
            </AskSprossButton>
          </div>
        </section>
      </NurMit>
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
    <Card className="py-2">
      <h2 className="text-heading mb-2 text-fg">{t.landing.continueTitle}</h2>
      <ul className="divide-y divide-divider">
        {felder.slice(0, 3).map((f) => {
          const [href, schritt] = f.selectedVarietyId
            ? [`/heute?feld=${f.id}`, t.landing.continueToday]
            : f.usage
              ? [`/feld/${f.id}/ranking`, t.landing.continueRanking]
              : [`/feld/${f.id}`, t.landing.continueVarieties];
          return (
            <li key={f.id}>
              <Link href={href} className="flex items-center justify-between gap-3 py-3 hover:text-link">
                <span>
                  <span className="font-semibold">{f.name}</span>
                  <span className="block text-small text-fg-muted">
                    {f.env.region} · {f.areaHa.toLocaleString(locale === "de" ? "de-DE" : "en-US")} ha
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-small font-semibold text-link">
                  {schritt} <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
