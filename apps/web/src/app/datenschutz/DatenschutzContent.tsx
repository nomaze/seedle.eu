"use client";

import { useLanguage } from "@/components/shell/LanguageContext";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, SectionTitle } from "@/components/ui/Card";

export function DatenschutzContent() {
  const { locale } = useLanguage();
  const isDe = locale === "de";

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/", label: isDe ? "Startseite" : "Home" }}
        eyebrow={isDe ? "Datenschutz & Transparenz" : "Privacy & Transparency"}
        title={isDe ? "Datenschutzerklärung" : "Privacy Policy"}
        lead={
          isDe
            ? "Informationen über die Verarbeitung personenbezogener Daten auf seedle.eu gemäß Art. 13 und 14 der Datenschutz-Grundverordnung (DSGVO) sowie § 25 TDDDG."
            : "Information regarding the processing of personal data on seedle.eu in accordance with Articles 13 and 14 of the General Data Protection Regulation (GDPR) and Section 25 TDDDG."
        }
      />

      {/* 1. Data Controller */}
      <Card className="space-y-4">
        <SectionTitle hint={isDe ? "Verantwortliche Stelle" : "Data Controller"}>
          {isDe ? "1. Verantwortlicher (Art. 4 Nr. 7 DSGVO)" : "1. Controller (Art. 4(7) GDPR)"}
        </SectionTitle>
        <div className="space-y-2 text-sm text-ink leading-relaxed">
          <p className="font-bold">NoMaze GmbH</p>
          <p>Theresienstr. 148D</p>
          <p>80333 München</p>
          <p>{isDe ? "Deutschland" : "Germany"}</p>
          <p className="pt-2">
            E-Mail:{" "}
            <a
              href="mailto:contact@nomaze.com"
              className="font-medium text-leaf-700 underline underline-offset-2 transition hover:text-leaf-800"
            >
              contact@nomaze.com
            </a>
          </p>
        </div>
      </Card>

      {/* 2. Hosting and Content Delivery Network (GitHub Pages & Cloudflare) */}
      <Card className="space-y-4 text-sm text-ink leading-relaxed">
        <SectionTitle hint={isDe ? "Infrastruktur & CDN" : "Infrastructure & CDN"}>
          {isDe
            ? "2. Bereitstellung, Hosting und CDN (GitHub Pages & Cloudflare)"
            : "2. Hosting and Content Delivery Network (GitHub Pages & Cloudflare)"}
        </SectionTitle>
        <p>
          {isDe
            ? "Diese Webapplikation wird als statische Anwendung über GitHub Pages gehostet (GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA) und über das Content Delivery Network / Reverse-Proxy von Cloudflare, Inc. (101 Townsend St, San Francisco, CA 94107, USA) ausgeliefert. Beim Aufruf der Seiten verarbeiten diese Anbieter technisch erforderliche Verbindungsdaten und HTTP-Request-Header (insbesondere IP-Adresse, Datum und Uhrzeit des Abrufs, aufgerufene URL, übertragene Datenmenge, Browsertyp und Betriebssystem) zur sicheren Auslieferung und Abwehr von Angriffen."
            : "This web application is hosted via GitHub Pages (GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA) and delivered through the Content Delivery Network / reverse proxy of Cloudflare, Inc. (101 Townsend St, San Francisco, CA 94107, USA). When accessing pages, these providers process technically required connection metadata and HTTP request headers (including IP address, timestamp, requested URL, transferred data volume, browser type, and operating system) for secure delivery and DDoS mitigation."}
        </p>
        <p className="text-xs text-muted">
          {isDe
            ? "Rechtsgrundlage ist unser berechtigtes Interesse an der sicheren, schnellen und stabilen Bereitstellung unseres Online-Angebots (Art. 6 Abs. 1 lit. f DSGVO). Datenübermittlungen in die USA erfolgen auf Grundlage des EU-U.S. Data Privacy Frameworks bzw. der Standardvertragsklauseln der Europäischen Kommission. Die Speicherdauer der technischen Server- und Sicherheitsprotokolle richtet sich nach den gesetzlichen und betrieblichen Sicherheitsfristen der Infrastrukturbetreiber."
            : "Legal basis is our legitimate interest in the secure, fast, and dependable operation of our online services (Art. 6(1)(f) GDPR). Data transfers to the USA rely on the EU-U.S. Data Privacy Framework and European Commission Standard Contractual Clauses. Log retention periods follow the technical security policies of the respective infrastructure providers."}
        </p>
      </Card>

      {/* 3. Vector Map Tile Service (OpenFreeMap) */}
      <Card className="space-y-4 text-sm text-ink leading-relaxed">
        <SectionTitle hint={isDe ? "Kartenkacheln" : "Vector Map Tiles"}>
          {isDe
            ? "3. Interaktive Kartendarstellung (OpenFreeMap)"
            : "3. Interactive Vector Map Tiles (OpenFreeMap)"}
        </SectionTitle>
        <p>
          {isDe
            ? "Für die interaktive Kartendarstellung (Feldauswahl, Hofübersicht und regionale Übersichtskarten) lädt Ihr Browser ausschließlich Vektorkartenkacheln und Stilbeschreibungen vom offenen Kartendienst OpenFreeMap (tiles.openfreemap.org; Kartendaten © OpenStreetMap contributors unter ODbL-Lizenz). Beim Laden der Karte werden Ihre IP-Adresse sowie die angeforderten Kachelkoordinaten technisch bedingt an tiles.openfreemap.org übermittelt."
            : "For interactive mapping (field boundary selection, farm overview, and regional overview maps), your browser loads vector map tiles and style specifications exclusively from the open map service OpenFreeMap (tiles.openfreemap.org; map data © OpenStreetMap contributors under ODbL). When loading a map, your IP address and requested tile coordinates are transmitted to tiles.openfreemap.org."}
        </p>
        <p className="text-xs text-muted">
          {isDe
            ? "Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer nutzerfreundlichen agrargeografischen Darstellung ohne werbliche Profilbildung)."
            : "Legal basis is Art. 6(1)(f) GDPR (legitimate interest in delivering intuitive agricultural geographic visualization without advertising tracking)."}
        </p>
      </Card>

      {/* 4. Location Search, Reverse Geocoding, and GPS Geolocation (Nominatim) */}
      <Card className="space-y-4 text-sm text-ink leading-relaxed">
        <SectionTitle hint={isDe ? "Ortssuche, Kartenklick & GPS" : "Search, Reverse Geocoding & GPS"}>
          {isDe
            ? "4. Ortssuche, Reverse Geocoding und GPS-Standortermittlung (Nominatim / OpenStreetMap)"
            : "4. Location Search, Reverse Geocoding, and GPS Geolocation (Nominatim / OpenStreetMap)"}
        </SectionTitle>
        <p>
          {isDe
            ? "Wenn Sie in der Feldauswahl oder Standortwahl aktiv eine Orts- bzw. Postleitzahlsuche absenden (Enter oder Suchschaltfläche), werden Ihre Suchanfrage und Ihre IP-Adresse an den Geocoding-Dienst Nominatim der OpenStreetMap Foundation (nominatim.openstreetmap.org, St John's Innovation Centre, Cowley Road, Cambridge CB4 0WS, Vereinigtes Königreich) übermittelt."
            : "When you explicitly submit a place name or postal code search (via Enter or the search button), your search query and IP address are transmitted to the Nominatim geocoding service operated by the OpenStreetMap Foundation (nominatim.openstreetmap.org, St John's Innovation Centre, Cowley Road, Cambridge CB4 0WS, United Kingdom)."}
        </p>
        <p>
          {isDe
            ? "Wichtiger Hinweis zu Kartenklicks und GPS-Standort (Reverse Geocoding): Wenn Sie in der Feldauswahl einen Punkt auf der Karte antippen/anklicken ODER die Schaltfläche „Meinen Standort nutzen“ (Browser-Geolocation-API) bestätigen, werden die ausgewählten bzw. per GPS ermittelten geografischen Koordinaten (Breiten- und Längengrad) zusammen mit Ihrer IP-Adresse an nominatim.openstreetmap.org (Endpunkt /reverse) übermittelt, um automatisch den zugehörigen Ortsnamen bzw. die Postleitzahl für Ihren Schlag aufzulösen."
            : "Important notice regarding map clicks and GPS geolocation (reverse geocoding): When you click/tap a point on the field map OR confirm the 'Use my location' button (browser Geolocation API), the selected or GPS-determined geographic coordinates (latitude and longitude) along with your IP address are transmitted to nominatim.openstreetmap.org (/reverse endpoint) to resolve the corresponding municipality name or postal code for your field."}
        </p>
        <p className="text-xs text-muted">
          {isDe
            ? "Rechtsgrundlage für die Orts- und Koordinatenauflösung über Nominatim ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Zuordnung landwirtschaftlicher Schläge zu Orts- und Klimaregionen; Angemessenheitsbeschluss der EU-Kommission für das Vereinigte Königreich). Rechtsgrundlage für den Zugriff auf den GPS-Standort Ihres Endgeräts ist Ihre ausdrückliche Einwilligung im Browser-Dialog gemäß Art. 6 Abs. 1 lit. a DSGVO i. V. m. § 25 Abs. 1 TDDDG."
            : "Legal basis for geocoding and reverse geocoding via Nominatim is Art. 6(1)(f) GDPR (legitimate interest in mapping agricultural parcels to municipalities and climate regions; UK adequacy decision). Legal basis for accessing your device's GPS location is your explicit consent granted in the browser prompt pursuant to Art. 6(1)(a) GDPR and Section 25(1) TDDDG."}
        </p>
        <p className="rounded-xl bg-sand-50 p-3 text-xs text-ink ring-1 ring-line">
          <strong>{isDe ? "Widerrufsrecht (Art. 7 Abs. 3 DSGVO):" : "Right to Withdraw Consent (Art. 7(3) GDPR):"}</strong>{" "}
          {isDe
            ? "Sie können eine erteilte Einwilligung zur Standortfreigabe jederzeit mit Wirkung für die Zukunft widerrufen, indem Sie die Standortberechtigung für seedle.eu in den Website-Einstellungen Ihres Browsers entziehen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt davon unberührt."
            : "You may withdraw your consent to browser geolocation at any time with effect for the future by revoking location permissions for seedle.eu in your browser's site settings. The lawfulness of processing prior to withdrawal remains unaffected."}
        </p>
      </Card>

      {/* 5. Cookies and Local Browser Storage (Section 25 TDDDG) */}
      <Card className="space-y-4 text-sm text-ink leading-relaxed">
        <SectionTitle hint={isDe ? "Cookies & localStorage" : "Cookies & localStorage"}>
          {isDe
            ? "5. Cookies und lokaler Browserspeicher (§ 25 Abs. 2 Nr. 2 TDDDG)"
            : "5. Cookies and Local Browser Storage (Section 25(2) No. 2 TDDDG)"}
        </SectionTitle>
        <p>
          {isDe
            ? "Wir setzen ausschließlich technisch erforderliche Speichermechanismen ein, um von Ihnen ausdrücklich gewünschte Einstellungen bereitzustellen (§ 25 Abs. 2 Nr. 2 TDDDG, Art. 6 Abs. 1 lit. f DSGVO). Es werden keine Analyse-, Tracking- oder Werbe-Cookies verwendet:"
            : "We exclusively use strictly necessary storage mechanisms to provide settings explicitly requested by you (Section 25(2) No. 2 TDDDG, Art. 6(1)(f) GDPR). No analytics, tracking, or advertising cookies are used:"}
        </p>
        <ul className="list-disc space-y-2 pl-5 text-xs text-muted">
          <li>
            <strong>Cookie <code className="text-ink">sk_lang</code>:</strong>{" "}
            {isDe
              ? "Speichert die gewählte Oberflächensprache (de / en) ausschließlich als First-Party-Browser-Cookie. Speicherdauer: 1 Jahr (max-age=31536000; SameSite=Lax)."
              : "Stores your selected interface language (de / en) solely as a first-party browser cookie. Storage duration: 1 year (max-age=31536000; SameSite=Lax)."}
          </li>
          <li>
            <strong>localStorage <code className="text-ink">seedle_demo_settings_v3</code>, <code className="text-ink">seedle_active_marke</code>, <code className="text-ink">seedle_show_backend_badge</code>:</strong>{" "}
            {isDe
              ? "Speichert lokal in Ihrem Browser die im Menü /demo gewählten Design-, Marken- und Funktionsschalter. Speicherdauer: Dauerhaft lokal auf Ihrem Endgerät, bis Sie die Einstellungen zurücksetzen oder Ihren Browserspeicher löschen."
              : "Stores design theme, active brand, and feature toggles configured in /demo locally in your browser. Storage duration: Persisted locally on your device until you reset demo settings or clear browser storage."}
          </li>
          <li>
            <strong>localStorage <code className="text-ink">seedle_auth_user</code> &amp; <code className="text-ink">seedle_custom_field</code>:</strong>{" "}
            {isDe
              ? "Speichert im Demo- bzw. Anmeldemodus das aktive Nutzerprofil und lokal angelegte Schlaggeometrien im Browser. Speicherdauer: Bis zur Abmeldung („Abmelden“) oder Löschung des Browserspeichers."
              : "Stores the active user session profile and locally created parcel geometries in your browser. Storage duration: Until logout or clearing browser storage."}
          </li>
          <li>
            <strong>localStorage <code className="text-ink">nomaze_telefon</code>:</strong>{" "}
            {isDe
              ? "Sofern Sie in einem Rückruf- oder Saatgutdialog aktiv eine Telefonnummer eingeben, wird diese lokal in Ihrem Browser zwischengespeichert, um Ihnen eine erneute Eingabe zu ersparen. Speicherdauer: Lokal bis zur Löschung Ihres Browserspeichers."
              : "If you actively enter a telephone number in a callback or seed inquiry dialog, it is cached locally in your browser for convenience. Storage duration: Locally until you clear your browser storage."}
          </li>
        </ul>
      </Card>

      {/* 6. Optional Authentication via Auth0 */}
      <Card className="space-y-4 text-sm text-ink leading-relaxed">
        <SectionTitle hint={isDe ? "Optionaler Login" : "Optional Login"}>
          {isDe
            ? "6. Optionale Anmeldung über NoMaze Single Sign-On (Auth0 / Okta)"
            : "6. Optional Authentication via NoMaze Single Sign-On (Auth0 / Okta)"}
        </SectionTitle>
        <p>
          {isDe
            ? "Standardmäßig ist die Nutzung von seedle.eu ohne Anmeldung möglich. Nur wenn Sie den optionalen Auth0-Anmeldemodus aktiv nutzen, stellt Ihr Browser eine Verbindung zu unserem Identity-Provider Auth0 / Okta, Inc. (100 First Street, San Francisco, CA 94105, USA) unter der Domain auth.nomaze.com her, um die Anmeldung per OAuth 2.0 PKCE oder Einmalcode (Passwordless E-Mail-OTP) durchzuführen (Art. 6 Abs. 1 lit. b DSGVO). Sitzungs-Zugriffstoken (Bearer Tokens) werden ausschließlich im flüchtigen Arbeitsspeicher (RAM) des geöffneten Browser-Tabs gehalten und niemals in localStorage oder sessionStorage abgelegt."
            : "By default, seedle.eu can be used without logging in. Only if you actively trigger the optional Auth0 authentication flow does your browser connect to our identity provider Auth0 / Okta, Inc. (100 First Street, San Francisco, CA 94105, USA) under the domain auth.nomaze.com to perform OAuth 2.0 PKCE or passwordless email OTP authentication (Art. 6(1)(b) GDPR). Access tokens are held strictly in volatile browser memory (RAM) for the duration of the page session and are never written to localStorage or sessionStorage."}
        </p>
      </Card>

      {/* 7. Data Subject Rights and Highlighted Right to Object per Art. 21 GDPR */}
      <Card className="space-y-4 text-sm text-ink leading-relaxed">
        <SectionTitle hint={isDe ? "Ihre Rechte" : "Your Rights"}>
          {isDe ? "7. Ihre Rechte als betroffene Person" : "7. Your Rights under GDPR"}
        </SectionTitle>
        <p>
          {isDe
            ? "Nach der Datenschutz-Grundverordnung stehen Ihnen gegenüber dem Verantwortlichen folgende Rechte zu:"
            : "Under the General Data Protection Regulation, you are entitled to the following statutory rights:"}
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-xs text-muted">
          <li>{isDe ? "Recht auf Auskunft (Art. 15 DSGVO)" : "Right of access (Art. 15 GDPR)"}</li>
          <li>{isDe ? "Recht auf Berichtigung (Art. 16 DSGVO)" : "Right to rectification (Art. 16 GDPR)"}</li>
          <li>{isDe ? "Recht auf Löschung (Art. 17 DSGVO)" : "Right to erasure (Art. 17 GDPR)"}</li>
          <li>
            {isDe
              ? "Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)"
              : "Right to restriction of processing (Art. 18 GDPR)"}
          </li>
          <li>{isDe ? "Recht auf Datenübertragbarkeit (Art. 20 DSGVO)" : "Right to data portability (Art. 20 GDPR)"}</li>
          <li>
            {isDe
              ? "Recht auf Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)"
              : "Right to withdraw consent at any time with effect for the future (Art. 7(3) GDPR)"}
          </li>
          <li>
            {isDe
              ? "Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO), insbesondere beim Bayerischen Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach."
              : "Right to lodge a complaint with a supervisory authority (Art. 77 GDPR), in particular the Bavarian Data Protection Authority (BayLDA), Promenade 18, 91522 Ansbach, Germany."}
          </li>
        </ul>

        {/* Art. 21(4) GDPR: Visually highlighted notice on the right to object */}
        <div className="rounded-2xl border-2 border-leaf-600 bg-leaf-50/70 p-4 text-xs leading-relaxed text-ink">
          <p className="font-bold uppercase tracking-wider text-leaf-900">
            {isDe
              ? "Besonderer Hinweis auf Ihr Widerspruchsrecht gemäß Art. 21 DSGVO"
              : "Special Notice on Your Right to Object Pursuant to Art. 21 GDPR"}
          </p>
          <p className="mt-1.5 font-semibold text-ink">
            {isDe
              ? "Soweit wir personenbezogene Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) verarbeiten, haben Sie gemäß Art. 21 Abs. 1 DSGVO das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung Sie betreffender personenbezogener Daten Widerspruch einzulegen."
              : "Where we process personal data on the basis of Art. 6(1)(f) GDPR (legitimate interests), you have the right pursuant to Art. 21(1) GDPR to object, on grounds relating to your particular situation, at any time to the processing of personal data concerning you."}
          </p>
        </div>

        <p className="pt-1 text-xs text-muted">
          {isDe ? "Zur Ausübung Ihrer Rechte genügt eine Mitteilung an: " : "To exercise your rights, please contact: "}
          <a
            href="mailto:contact@nomaze.com"
            className="font-medium text-leaf-700 underline underline-offset-2 hover:text-leaf-800"
          >
            contact@nomaze.com
          </a>
        </p>
      </Card>
    </div>
  );
}
