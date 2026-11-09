"use client";

import { useLanguage } from "@/components/shell/LanguageContext";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, SectionTitle } from "@/components/ui/Card";

export function ImpressumContent() {
  const { locale } = useLanguage();
  const isDe = locale === "de";

  return (
    <div className="space-y-6">
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
      <Card className="space-y-4">
        <SectionTitle hint={isDe ? "Dienstanbieter" : "Service Provider"}>
          {isDe ? "1. Angaben gemäß § 5 DDG" : "1. Information pursuant to § 5 DDG"}
        </SectionTitle>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1 text-sm text-ink">
            <p className="text-base font-bold text-ink">NoMaze GmbH</p>
            <p>Theresienstr. 148D</p>
            <p>80333 München</p>
            <p>{isDe ? "Deutschland" : "Germany"}</p>
          </div>

          <div className="space-y-1 text-sm text-ink">
            <p className="font-semibold text-muted">
              {isDe ? "Vertreten durch die Geschäftsführer:" : "Represented by Managing Directors:"}
            </p>
            <p className="font-medium text-ink">Jean-Pascal Lutze, Finn Gaida</p>
          </div>
        </div>
      </Card>

      {/* Kontakt & Register */}
      <Card className="space-y-4">
        <SectionTitle hint={isDe ? "Handelsregister" : "Commercial Register"}>
          {isDe ? "2. Kontakt & Registereintrag" : "2. Contact & Commercial Register"}
        </SectionTitle>
        <div className="grid gap-6 sm:grid-cols-2 text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-muted">{isDe ? "Kontakt:" : "Contact:"}</p>
            <p className="text-ink">
              E-Mail:{" "}
              <a
                href="mailto:contact@nomaze.com"
                className="font-medium text-leaf-700 underline underline-offset-2 transition hover:text-leaf-800"
              >
                contact@nomaze.com
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-muted">{isDe ? "Registereintrag:" : "Commercial Register:"}</p>
            <p className="text-ink">
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

        <div className="border-t border-line/60 pt-4 text-sm">
          <p className="font-semibold text-muted">
            {isDe ? "Umsatzsteuer-Identifikationsnummer:" : "VAT Identification Number:"}
          </p>
          <p className="mt-1 text-ink">
            {isDe
              ? "Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:"
              : "VAT identification number pursuant to § 27 a of the German VAT Act:"}{" "}
            <strong className="tracking-wide">DE358734250</strong>
          </p>
        </div>
      </Card>

      {/* Consumer arbitration (§ 36 VSBG) */}
      <Card className="space-y-3 text-sm leading-relaxed text-ink">
        <SectionTitle hint={isDe ? "Verbraucherschlichtung" : "Consumer Arbitration"}>
          {isDe ? "3. Verbraucherstreitbeilegung (§ 36 VSBG)" : "3. Consumer Dispute Resolution (§ 36 VSBG)"}
        </SectionTitle>
        <p className="text-xs text-muted">
          {isDe
            ? "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."
            : "We are neither obligated nor willing to participate in dispute resolution proceedings before a consumer arbitration board."}
        </p>
      </Card>

      {/* Liability for content and links */}
      <Card className="space-y-4 text-sm leading-relaxed text-ink">
        <SectionTitle hint="Disclaimer">
          {isDe ? "4. Haftung für Inhalte und Links" : "4. Liability for Content and Links"}
        </SectionTitle>
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-ink">
              {isDe ? "Haftung für Inhalte" : "Liability for Content"}
            </h3>
            <p className="mt-1 text-xs text-muted">
              {isDe
                ? "Als Diensteanbieter sind wir gemäß § 7 Abs.1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen."
                : "As a service provider, we are responsible for our own content on these pages in accordance with general legislation pursuant to § 7 (1) DDG. According to §§ 8 to 10 DDG, however, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity."}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink">
              {isDe ? "Haftung für Links" : "Liability for Links"}
            </h3>
            <p className="mt-1 text-xs text-muted">
              {isDe
                ? "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich."
                : "Our website contains links to external third-party websites over whose content we have no influence. Therefore, we cannot assume any liability for this external content. The respective provider or operator of the linked pages is always responsible for their content."}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink">
              {isDe ? "Urheberrecht" : "Copyright"}
            </h3>
            <p className="mt-1 text-xs text-muted">
              {isDe
                ? "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung der NoMaze GmbH."
                : "The content and works created by the site operators on these pages are subject to German copyright law. Duplication, processing, distribution, and any type of exploitation outside the limits of copyright law require the written consent of NoMaze GmbH."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}