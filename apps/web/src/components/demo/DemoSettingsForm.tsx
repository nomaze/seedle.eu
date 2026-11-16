"use client";

import { Check, Info, Lock, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { BackendStatusBadge } from "@/components/shell/BackendStatusBadge";
import { useDemo } from "@/components/shell/DemoContext";
import { useLanguage } from "@/components/shell/LanguageContext";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { AUTH0_CONFIG } from "@/lib/auth-config";
import { withBasePath } from "@/lib/basePath";
import {
  DEMO_STANDARD,
  MARKEN,
  MARKEN_INFO,
  UMWELT_PRESETS,
  type AuthModus,
  type DemoEinstellungen,
  type Marke,
} from "@/lib/demo";

/** Option tile (design system): rectangular, control ring; selected with action ring on highlight. */
function optionClass(selected: boolean, padding = "p-4") {
  return `flex cursor-pointer flex-col justify-between rounded-control ${padding} transition-colors ${
    selected ? "bg-highlight ring-2 ring-inset ring-action" : "ring-1 ring-inset ring-control hover:bg-action-subtle"
  }`;
}
/** Checkbox rows like GOV.UK checkboxes: box left, label and hint right, hairlines between rows. */
const TOGGLE_ROW = "flex cursor-pointer items-start gap-3 py-4";
const CHECKBOX = "mt-0.5 size-5 shrink-0 accent-action";

export function DemoSettingsForm({ initialSettings }: { initialSettings: DemoEinstellungen }) {
  const demoContext = useDemo();
  const { t } = useLanguage();
  const [marke, setMarke] = useState<Marke>(demoContext.marke || initialSettings.marke);
  const [saatgutKauf, setSaatgutKauf] = useState(demoContext.saatgutKauf ?? initialSettings.saatgutKauf);
  const [spross, setSpross] = useState(demoContext.spross ?? initialSettings.spross);
  const [teamAnruf, setTeamAnruf] = useState(demoContext.teamAnruf ?? initialSettings.teamAnruf);
  const [stoebern, setStoebern] = useState(demoContext.stoebern ?? initialSettings.stoebern ?? false);
  const [anmeldung, setAnmeldung] = useState(demoContext.anmeldung ?? initialSettings.anmeldung ?? false);
  const [showBackendStatusBadge, setShowBackendStatusBadge] = useState(
    demoContext.showBackendStatusBadge ?? initialSettings.showBackendStatusBadge ?? true,
  );
  const [datum, setDatum] = useState(demoContext.datum || initialSettings.datum);
  const [authModus, setAuthModus] = useState<AuthModus>(demoContext.authModus || initialSettings.authModus || "fake");
  const [gespeichert, setGespeichert] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (demoContext.marke) setMarke(demoContext.marke);
    if (demoContext.saatgutKauf !== undefined) setSaatgutKauf(demoContext.saatgutKauf);
    if (demoContext.spross !== undefined) setSpross(demoContext.spross);
    if (demoContext.teamAnruf !== undefined) setTeamAnruf(demoContext.teamAnruf);
    if (demoContext.stoebern !== undefined) setStoebern(demoContext.stoebern);
    if (demoContext.anmeldung !== undefined) setAnmeldung(demoContext.anmeldung);
    if (demoContext.showBackendStatusBadge !== undefined) {
      setShowBackendStatusBadge(demoContext.showBackendStatusBadge);
    }
    if (demoContext.datum) setDatum(demoContext.datum);
    if (demoContext.authModus) setAuthModus(demoContext.authModus);
  }, [
    demoContext.marke,
    demoContext.saatgutKauf,
    demoContext.spross,
    demoContext.teamAnruf,
    demoContext.stoebern,
    demoContext.anmeldung,
    demoContext.showBackendStatusBadge,
    demoContext.datum,
    demoContext.authModus,
  ]);

  const handleMarkeChange = (m: Marke) => {
    setMarke(m);
    demoContext.setMarke(m);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    demoContext.updateDemo({
      marke,
      saatgutKauf,
      spross,
      teamAnruf,
      stoebern,
      anmeldung,
      showBackendStatusBadge,
      datum,
      authModus,
    });
    setGespeichert(true);
    setTimeout(() => setGespeichert(false), 3000);
  };

  const handleReset = () => {
    setMarke(DEMO_STANDARD.marke);
    setSaatgutKauf(DEMO_STANDARD.saatgutKauf);
    setSpross(DEMO_STANDARD.spross);
    setTeamAnruf(DEMO_STANDARD.teamAnruf);
    setStoebern(DEMO_STANDARD.stoebern);
    setAnmeldung(DEMO_STANDARD.anmeldung);
    setShowBackendStatusBadge(DEMO_STANDARD.showBackendStatusBadge);
    setDatum(DEMO_STANDARD.datum);
    setAuthModus(DEMO_STANDARD.authModus);
    demoContext.resetDemo();
    setGespeichert(true);
    setTimeout(() => setGespeichert(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      {gespeichert ? (
        <div role="status" className="flex items-start gap-3 border-l-4 border-status-ok py-1 pl-3 text-fg">
          <Check className="mt-0.5 size-5 shrink-0 text-status-ok" aria-hidden />
          <span>
            Gespeichert. Die Demo nutzt jetzt <strong>{MARKEN_INFO[marke].demoLabel ?? MARKEN_INFO[marke].titel}</strong> am Stand vom{" "}
            <strong>{datum}</strong> (Login-Modus: <strong>{authModus === "auth0" ? "Offizieller NoMaze Auth0" : "Simulierter Demo-Login"}</strong>).
          </span>
        </div>
      ) : null}

      {/* Sektion 1: Design / Marke */}
      <Card>
        <SectionTitle hint="5 Design-Varianten">1. Design & Marke</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MARKEN.map((m) => {
            const info = MARKEN_INFO[m];
            const checked = marke === m;
            return (
              <label key={m} className={optionClass(checked)}>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={withBasePath(info.icon)} alt="" width={32} height={32} className="size-8 shrink-0 rounded-control object-contain" />
                      <span className="font-semibold text-fg">{info.demoLabel ?? info.name}</span>
                      {info.demoLabel && info.demoLabel !== info.name ? (
                        <span className="sr-only">{info.name}</span>
                      ) : null}
                    </div>
                    <input
                      type="radio"
                      name="marke"
                      value={m}
                      checked={checked}
                      onChange={() => handleMarkeChange(m)}
                      className="size-4 shrink-0 accent-action"
                    />
                  </div>
                  <p className="mt-3 text-small text-fg-muted">{info.beschreibung}</p>
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Sektion 2: Authentifizierung / Login-Modus */}
      <Card>
        <SectionTitle hint="Dual-Mode Authentifizierung">2. Authentifizierung / Login-Modus</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Option A: Simulierter Demo-Login */}
          <label className={optionClass(authModus === "fake")}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold text-fg">
                  <ShieldCheck className="size-5 text-link" aria-hidden />
                  <span>Simulierter Demo-Login</span>
                </div>
                <input
                  type="radio"
                  name="authModus"
                  value="fake"
                  checked={authModus === "fake"}
                  onChange={() => {
                    setAuthModus("fake");
                    demoContext.updateDemo({ authModus: "fake" });
                  }}
                  className="size-4 shrink-0 accent-action"
                />
              </div>
              <p className="mt-2 text-small text-fg-muted">
                Sofortiger Zugang ohne Backend oder Redirects. Perfekt für risikofreie Vorführungen
                (1-Klick „Als Musterhof fortfahren“ oder 6-stelliger Test-Code <code className="font-semibold tabular-nums text-fg">123456</code>).
              </p>
            </div>
            <div className="mt-3 text-caption font-semibold text-fg-muted">Standard für zero-friction Demo</div>
          </label>

          {/* Option B: Offizieller NoMaze Auth0 Login */}
          <label className={optionClass(authModus === "auth0")}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold text-fg">
                  <Lock className="size-5 text-link" aria-hidden />
                  <span>Offizieller NoMaze Auth0</span>
                </div>
                <input
                  type="radio"
                  name="authModus"
                  value="auth0"
                  checked={authModus === "auth0"}
                  onChange={() => {
                    setAuthModus("auth0");
                    demoContext.updateDemo({ authModus: "auth0" });
                  }}
                  className="size-4 shrink-0 accent-action"
                />
              </div>
              <p className="mt-2 text-small text-fg-muted">
                Echtes Enterprise Single Sign-On via <strong>auth.nomaze.com</strong>.
                OIDC PKCE S256 Flow, Passwordless Email OTP sowie Event-Voucher Registrierung über NoMaze Single Sign-On (OAuth 2.0 PKCE).
              </p>
            </div>
            <div className="mt-3 text-caption font-semibold text-fg-muted">Live Auth0 Tenant Integration</div>
          </label>
        </div>

        {/* Live Auth0 technical specs as a summary list */}
        {authModus === "auth0" && (
          <div className="mt-8 max-w-measure">
            <h3 className="flex items-center gap-1.5 text-subheading text-fg">
              <Info className="size-4 text-link" aria-hidden />
              <span>Aktive Auth0-Konfiguration (auth.nomaze.com)</span>
            </h3>
            <dl className="mt-3 grid grid-cols-[7rem_minmax(0,1fr)] border-t border-rule text-small">
              <dt className="border-b border-divider py-2.5 text-fg-muted">Issuer:</dt>
              <dd className="m-0 break-all border-b border-divider py-2.5">{AUTH0_CONFIG.issuer}</dd>
              <dt className="border-b border-divider py-2.5 text-fg-muted">Domain:</dt>
              <dd className="m-0 break-all border-b border-divider py-2.5">{AUTH0_CONFIG.domain}</dd>
              <dt className="border-b border-divider py-2.5 text-fg-muted">Client ID:</dt>
              <dd className="m-0 break-all border-b border-divider py-2.5">{AUTH0_CONFIG.clientId}</dd>
              <dt className="border-b border-divider py-2.5 text-fg-muted">Audience:</dt>
              <dd className="m-0 break-all border-b border-divider py-2.5">{AUTH0_CONFIG.audience}</dd>
              <dt className="border-b border-divider py-2.5 text-fg-muted">Flows:</dt>
              <dd className="m-0 border-b border-divider py-2.5">
                OAuth 2.0 PKCE S256 + Passwordless Email OTP (/passwordless/start) + Partner Voucher
              </dd>
            </dl>
          </div>
        )}
      </Card>

      {/* Sektion 3: Funktionen */}
      <Card>
        <SectionTitle hint="Einzeln schaltbar">3. Funktionen ein- oder ausschalten</SectionTitle>
        <div className="max-w-measure divide-y divide-divider border-t border-rule">
          <label className={TOGGLE_ROW}>
            <input
              type="checkbox"
              checked={saatgutKauf}
              onChange={(e) => setSaatgutKauf(e.target.checked)}
              className={CHECKBOX}
            />
            <div>
              <span className="font-semibold text-fg">Saatgut-Kauf & Händler-Vermittlung</span>
              <p className="text-small text-fg-muted">Button „Saatgut anfragen“ auf Sortensteckbriefen</p>
            </div>
          </label>
          <label className={TOGGLE_ROW}>
            <input
              type="checkbox"
              checked={spross}
              onChange={(e) => setSpross(e.target.checked)}
              className={CHECKBOX}
            />
            <div>
              <span className="font-semibold text-fg">Spross Copilot</span>
              <p className="text-small text-fg-muted">Interaktiver Assistent für Sorten- und Anbaufragen</p>
            </div>
          </label>
          <label className={TOGGLE_ROW}>
            <input
              type="checkbox"
              checked={teamAnruf}
              onChange={(e) => setTeamAnruf(e.target.checked)}
              className={CHECKBOX}
            />
            <div>
              <span className="font-semibold text-fg">Team-Anruf</span>
              <p className="text-small text-fg-muted">Rückruf-Anfrage an das NoMaze-Agrar-Team</p>
            </div>
          </label>
          <label className={TOGGLE_ROW}>
            <input
              type="checkbox"
              data-testid="toggle-stoebern"
              checked={stoebern}
              onChange={(e) => setStoebern(e.target.checked)}
              className={CHECKBOX}
            />
            <div>
              <span className="font-semibold text-fg">Sorten-Stöbern (/daten) anzeigen</span>
              <p className="text-small text-fg-muted">
                Öffentlichen Versuchsdaten-Explorer auf der Startseite einblenden
              </p>
            </div>
          </label>
          <label className={TOGGLE_ROW}>
            <input
              type="checkbox"
              data-testid="toggle-anmeldung"
              checked={anmeldung}
              onChange={(e) => setAnmeldung(e.target.checked)}
              className={CHECKBOX}
            />
            <div>
              <span className="font-semibold text-fg">Anmeldung & Konto-Sicherung anzeigen</span>
              <p className="text-small text-fg-muted">
                Login-Button im Header, Konto-Abfrage nach Feldauswahl und Anmeldelink einblenden
              </p>
            </div>
          </label>
          <label className={TOGGLE_ROW}>
            <input
              type="checkbox"
              data-testid="toggle-backend-status-badge"
              checked={showBackendStatusBadge}
              onChange={(e) => setShowBackendStatusBadge(e.target.checked)}
              className={CHECKBOX}
            />
            <div>
              <span className="font-semibold text-fg">{t.shell.demoBackendStatusTitle}</span>
              <p className="text-small text-fg-muted">{t.shell.demoBackendStatusHelp}</p>
            </div>
          </label>
        </div>
      </Card>

      {/* Sektion 4: Simulationsdatum */}
      <Card>
        <SectionTitle hint="Saison-Zeitpunkt">4. Zeitreise & Wachstumsstadium</SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {UMWELT_PRESETS.map((p) => (
            <button
              key={p.datum}
              type="button"
              aria-pressed={datum === p.datum}
              onClick={() => setDatum(p.datum)}
              className={`${optionClass(datum === p.datum, "p-3")} text-left text-small`}
            >
              <span className="block font-semibold text-fg">{p.label}</span>
              <span className="tabular-nums text-fg-muted">{p.datum}</span>
            </button>
          ))}
        </div>
        <div className="mt-6 max-w-measure">
          <label htmlFor="demo-datum" className="mb-1.5 block text-small font-semibold text-fg">
            Individuelles Datum (YYYY-MM-DD)
          </label>
          <input
            id="demo-datum"
            type="text"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            className="h-control w-full max-w-xs rounded-control border border-control bg-surface px-3 text-body tabular-nums text-fg"
          />
        </div>
      </Card>

      {/* Sektion 5: Backend-Verbindung & Systemstatus */}
      <Card>
        <SectionTitle hint="Live-Diagnose">5. Backend-Verbindung &amp; Systemstatus</SectionTitle>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-small font-semibold text-fg">
              Aktueller Verbindungsstatus zur Agronomie-Engine
            </div>
            <p className="text-small text-fg-muted">
              Prüft live die Verbindung zum Sorten- und Wetter-Backend (Standard im oberen Header ausgeblendet).
            </p>
          </div>
          <div className="rounded-control border border-control bg-canvas px-3 py-1.5">
            <BackendStatusBadge alwaysShow />
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-divider pt-6">
        <Button type="submit" variant="primary">
          Einstellungen übernehmen
        </Button>
        <button
          type="button"
          onClick={handleReset}
          className={buttonClass("quiet", "sm")}
        >
          <RotateCcw className="size-4" aria-hidden /> Auf Standard zurücksetzen
        </button>
      </div>
    </form>
  );
}
