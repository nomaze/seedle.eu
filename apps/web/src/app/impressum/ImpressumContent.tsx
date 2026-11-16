"use client";

import { useLanguage } from "@/components/shell/LanguageContext";
import { PageHeader } from "@/components/shell/PageHeader";
import { SectionTitle } from "@/components/ui/Card";

/** Editorial section: divider on top, section spacing, full width. */
const ABSCHNITT = "border-t border-divider py-section";
/** Columns separated by vertical hairlines on wide screens. */
const SPALTE = "lg:border-l lg:border-divider lg:px-10 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0";
const LINK = "font-semibold text-link underline decoration-link/40 underline-offset-4 hover:decoration-link";

export function ImpressumContent() {
  const { locale } = useLanguage();
  const isDe = locale === "de";

  return (
    <div>
      <PageHeader
        back={{ href: "/", label: isDe ? "Startseite" : "Home" }}
        eyebrow={isDe ? "Rechtliche Angaben" : "Legal Notice"}
        title={isDe ? "Impressum" : "Legal Imprint"}
        lead={
          isDe
            ? "Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG, ehemals § 5 TMG) für seedle.eu und die NoMaze GmbH."
            : "Information pursuant to § 5 Digital Services Act (DDG, formerly § 5 TMG) for seedle.eu and NoMaze GmbH."
        }
      />

      {/* Dienstanbieter & Vertretung */}
      <section className={ABSCHNITT}>
        <SectionTitle hint={isDe ? "Dienstanbieter" : "Service Provider"}>
          {isDe ? "1. Angaben gemäß § 5 DDG" : "1. Information pursuant to § 5 DDG"}
        </SectionTitle>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-0">
          <address className={`not-italic text-fg ${SPALTE}`}>
            <p className="text-subheading">NoMaze GmbH</p>
            <p>Theresienstr. 148D</p>
            <p>80333 München</p>
            <p>{isDe ? "Deutschland" : "Germany"}</p>
          </address>

          <div className={SPALTE}>
            <p className="text-small text-fg-muted">
              {isDe ? "Vertreten durch die Geschäftsführer:" : "Represented by Managing Directors:"}
            </p>
            <p className="mt-1 font-semibold text-fg">Jean-Pascal Lutze, Finn Gaida</p>
          </div>
        </div>
      </section>

      {/* Kontakt & Register */}
      <section className={ABSCHNITT}>
        <SectionTitle hint={isDe ? "Handelsregister" : "Commercial Register"}>
          {isDe ? "2. Kontakt & Registereintrag" : "2. Contact & Commercial Register"}
        </SectionTitle>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-0">
          <div className={SPALTE}>
            <p className="text-small text-fg-muted">{isDe ? "Kontakt:" : "Contact:"}</p>
            <p className="mt-1 text-fg">
              E-Mail:{" "}
              <a href="mailto:contact@nomaze.com" className={LINK}>
                contact@nomaze.com
              </a>
            </p>
          </div>

          <div className={SPALTE}>
            <p className="text-small text-fg-muted">{isDe ? "Registereintrag:" : "Commercial Register:"}</p>
            <p className="mt-1 text-fg">
              {isDe ? "Eintragung im Handelsregister" : "Registered in the Commercial Register"}:
              <br />
              {isDe ? "Registergericht: " : "Register Court: "}
              <strong>Amtsgericht München</strong> (Local Court of Munich)
              <br />
              {isDe ? "Registernummer: " : "Register Number: "}
              <strong>HRB 280013</strong>
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-divider pt-6">
          <p className="text-small text-fg-muted">
            {isDe ? "Umsatzsteuer-Identifikationsnummer:" : "VAT Identification Number:"}
          </p>
          <p className="mt-1 max-w-measure text-fg">
            {isDe
              ? "Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:"
              : "VAT identification number pursuant to § 27 a of the German VAT Act:"}{" "}
            <strong className="tabular-nums">DE358734250</strong>
          </p>
        </div>
      </section>

      {/* Consumer arbitration (§ 36 VSBG) */}
      <section className={ABSCHNITT}>
        <SectionTitle hint={isDe ? "Verbraucherschlichtung" : "Consumer Arbitration"}>
          {isDe ? "3. Verbraucherstreitbeilegung (§ 36 VSBG)" : "3. Consumer Dispute Resolution (§ 36 VSBG)"}
        </SectionTitle>
        <p className="max-w-measure text-fg-muted">
          {isDe
            ? "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."
            : "We are neither obligated nor willing to participate in dispute resolution proceedings before a consumer arbitration board."}
        </p>
      </section>

      {/* Liability for content and links */}
      <section className={ABSCHNITT}>
        <SectionTitle hint="Disclaimer">
          {isDe ? "4. Haftung für Inhalte und Links" : "4. Liability for Content and Links"}
        </SectionTitle>
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-0">
          <div className={SPALTE}>
            <h3 className="text-subheading text-fg">
              {isDe ? "Haftung für Inhalte" : "Liability for Content"}
            </h3>
            <p className="mt-2 text-small text-fg-muted">
              {isDe
                ? "Als Diensteanbieter sind wir gemäß § 7 Abs.1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen."
                : "As a service provider, we are responsible for our own content on these pages in accordance with general legislation pursuant to § 7 (1) DDG. According to §§ 8 to 10 DDG, however, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity."}
            </p>
          </div>

          <div className={SPALTE}>
            <h3 className="text-subheading text-fg">
              {isDe ? "Haftung für Links" : "Liability for Links"}
            </h3>
            <p className="mt-2 text-small text-fg-muted">
              {isDe
                ? "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich."
                : "Our website contains links to external third-party websites over whose content we have no influence. Therefore, we cannot assume any liability for this external content. The respective provider or operator of the linked pages is always responsible for their content."}
            </p>
          </div>

          <div className={SPALTE}>
            <h3 className="text-subheading text-fg">
              {isDe ? "Urheberrecht" : "Copyright"}
            </h3>
            <p className="mt-2 text-small text-fg-muted">
              {isDe
                ? "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung der NoMaze GmbH."
                : "The content and works created by the site operators on these pages are subject to German copyright law. Duplication, processing, distribution, and any type of exploitation outside the limits of copyright law require the written consent of NoMaze GmbH."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
