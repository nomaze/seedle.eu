"use client";

import { Check, Info, Lock, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useDemo } from "@/components/shell/DemoContext";
import { useLanguage } from "@/components/shell/LanguageContext";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { AUTH0_CONFIG } from "@/lib/auth-config";
import {
  DEMO_STANDARD,
  MARKEN,
  MARKEN_INFO,
  UMWELT_PRESETS,
  type AuthModus,
  type DemoEinstellungen,
  type Marke,
} from "@/lib/demo";

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {gespeichert ? (
        <div className="flex animate-rise items-center gap-3 rounded-card bg-leaf-50 px-4 py-3.5 font-medium text-leaf-800 ring-1 ring-leaf-200">
          <Check className="size-5 shrink-0 text-leaf-600" />
          <span>
            Gespeichert. Die Demo nutzt jetzt <strong>{MARKEN_INFO[marke].demoLabel ?? MARKEN_INFO[marke].titel}</strong> am Stand vom{" "}
            <strong>{datum}</strong> (Login-Modus: <strong>{authModus === "auth0" ? "Offizieller NoMaze Auth0" : "Simulierter Demo-Login"}</strong>).
          </span>
        </div>
      ) : null}

      {/* Sektion 1: Design / Marke */}
      <Card className="space-y-4">
        <SectionTitle hint="5 Design-Varianten">1. Design & Marke</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MARKEN.map((m) => {
            const info = MARKEN_INFO[m];
            const checked = marke === m;
            return (
              <label
                key={m}
                className={`flex cursor-pointer flex-col justify-between rounded-2xl p-4 ring-1 transition ${
                  checked ? "bg-leaf-50/70 ring-2 ring-leaf-600" : "bg-white ring-line hover:ring-leaf-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={info.icon} alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg object-contain" />
                      <span className="font-bold text-ink">{info.demoLabel ?? info.name}</span>
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
                      className="size-4 text-leaf-600"
                    />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted">{info.beschreibung}</p>
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Sektion 2: Authentifizierung / Login-Modus */}
      <Card className="space-y-4">
        <SectionTitle hint="Dual-Mode Authentifizierung">2. Authentifizierung / Login-Modus</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Option A: Simulierter Demo-Login */}
          <label
            className={`flex cursor-pointer flex-col justify-between rounded-2xl p-4 ring-1 transition ${
              authModus === "fake"
                ? "bg-leaf-50/70 ring-2 ring-leaf-600"
                : "bg-white ring-line hover:ring-leaf-300"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-ink">
                  <ShieldCheck className="size-5 text-leaf-700" />
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
                  className="size-4 text-leaf-600"
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Sofortiger Zugang ohne Backend oder Redirects. Perfekt für risikofreie Vorführungen
                (1-Klick „Als Musterhof fortfahren“ oder 6-stelliger Test-Code <code className="rounded bg-cream-200 px-1 py-0.5 text-ink">123456</code>).
              </p>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-leaf-800">
              <span className="size-2 rounded-full bg-leaf-500" /> Standard für zero-friction Demo
            </div>
          </label>

          {/* Option B: Offizieller NoMaze Auth0 Login */}
          <label
            className={`flex cursor-pointer flex-col justify-between rounded-2xl p-4 ring-1 transition ${
              authModus === "auth0"
                ? "bg-leaf-50/70 ring-2 ring-leaf-600"
                : "bg-white ring-line hover:ring-leaf-300"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-ink">
                  <Lock className="size-5 text-leaf-800" />
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
                  className="size-4 text-leaf-600"
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Echtes Enterprise Single Sign-On via <strong>auth.nomaze.com</strong>.
                OIDC PKCE S256 Flow, Passwordless Email OTP sowie Event-Voucher Registrierung über NoMaze Single Sign-On (OAuth 2.0 PKCE).
              </p>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-leaf-900">
              <span className="size-2 rounded-full bg-leaf-700" /> Live Auth0 Tenant Integration
            </div>
          </label>
        </div>

        {/* Live Auth0 Technical Specs Inspector */}
        {authModus === "auth0" && (
          <div className="rounded-xl border border-leaf-300 bg-leaf-50/60 p-3.5 text-xs text-ink/90">
            <div className="flex items-center gap-1.5 font-semibold text-leaf-900">
              <Info className="size-4" />
              <span>Aktive Auth0-Konfiguration (auth.nomaze.com)</span>
            </div>
            <div className="mt-2 grid gap-1.5 font-mono text-[11px] sm:grid-cols-2">
              <div>
                <span className="text-muted">Issuer:</span> {AUTH0_CONFIG.issuer}
              </div>
              <div>
                <span className="text-muted">Domain:</span> {AUTH0_CONFIG.domain}
              </div>
              <div>
                <span className="text-muted">Client ID:</span> {AUTH0_CONFIG.clientId}
              </div>
              <div>
                <span className="text-muted">Audience:</span> {AUTH0_CONFIG.audience}
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted">Flows:</span> OAuth 2.0 PKCE S256 + Passwordless Email OTP (/passwordless/start) + Partner Voucher
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Sektion 3: Funktionen */}
      <Card className="space-y-4">
        <SectionTitle hint="Einzeln schaltbar">3. Funktionen ein- oder ausschalten</SectionTitle>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line p-3 hover:bg-cream-100">
            <div>
              <span className="font-semibold text-ink">Saatgut-Kauf & Händler-Vermittlung</span>
              <p className="text-xs text-muted">Button „Saatgut anfragen“ auf Sortensteckbriefen</p>
            </div>
            <input
              type="checkbox"
              checked={saatgutKauf}
              onChange={(e) => setSaatgutKauf(e.target.checked)}
              className="mt-1 size-5 rounded text-leaf-600"
            />
          </label>
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line p-3 hover:bg-cream-100">
            <div>
              <span className="font-semibold text-ink">Spross Copilot</span>
              <p className="text-xs text-muted">Interaktiver Assistent für Sorten- und Anbaufragen</p>
            </div>
            <input
              type="checkbox"
              checked={spross}
              onChange={(e) => setSpross(e.target.checked)}
              className="mt-1 size-5 rounded text-leaf-600"
            />
          </label>
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line p-3 hover:bg-cream-100">
            <div>
              <span className="font-semibold text-ink">Team-Anruf</span>
              <p className="text-xs text-muted">Rückruf-Anfrage an das NoMaze-Agrar-Team</p>
            </div>
            <input
              type="checkbox"
              checked={teamAnruf}
              onChange={(e) => setTeamAnruf(e.target.checked)}
              className="mt-1 size-5 rounded text-leaf-600"
            />
          </label>
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line p-3 hover:bg-cream-100">
            <div>
              <span className="font-semibold text-ink">Sorten-Stöbern (/daten) anzeigen</span>
              <p className="text-xs text-muted">
                Öffentlichen Versuchsdaten-Explorer auf der Startseite einblenden
              </p>
            </div>
            <input
              type="checkbox"
              data-testid="toggle-stoebern"
              checked={stoebern}
              onChange={(e) => setStoebern(e.target.checked)}
              className="mt-1 size-5 rounded text-leaf-600"
            />
          </label>
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line p-3 hover:bg-cream-100">
            <div>
              <span className="font-semibold text-ink">Anmeldung & Konto-Sicherung anzeigen</span>
              <p className="text-xs text-muted">
                Login-Button im Header, Konto-Abfrage nach Feldauswahl und Anmeldelink einblenden
              </p>
            </div>
            <input
              type="checkbox"
              data-testid="toggle-anmeldung"
              checked={anmeldung}
              onChange={(e) => setAnmeldung(e.target.checked)}
              className="mt-1 size-5 rounded text-leaf-600"
            />
          </label>
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line p-3 hover:bg-cream-100">
            <div>
              <span className="font-semibold text-ink">{t.shell.demoBackendStatusTitle}</span>
              <p className="text-xs text-muted">{t.shell.demoBackendStatusHelp}</p>
            </div>
            <input
              type="checkbox"
              data-testid="toggle-backend-status-badge"
              checked={showBackendStatusBadge}
              onChange={(e) => setShowBackendStatusBadge(e.target.checked)}
              className="mt-1 size-5 rounded text-leaf-600"
            />
          </label>
        </div>
      </Card>

      {/* Sektion 4: Simulationsdatum */}
      <Card className="space-y-4">
        <SectionTitle hint="Saison-Zeitpunkt">4. Zeitreise & Wachstumsstadium</SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {UMWELT_PRESETS.map((p) => (
            <button
              key={p.datum}
              type="button"
              onClick={() => setDatum(p.datum)}
              className={`rounded-xl border p-2.5 text-left text-xs transition ${
                datum === p.datum ? "border-leaf-600 bg-leaf-50 font-bold" : "border-line bg-white hover:border-leaf-300"
              }`}
            >
              <span className="block font-semibold">{p.label}</span>
              <span className="text-muted">{p.datum}</span>
            </button>
          ))}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
            Individuelles Datum (YYYY-MM-DD)
          </label>
          <input
            type="text"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-leaf-600 focus:outline-none max-w-xs"
          />
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4 pt-2">
        <Button type="submit" variant="primary">
          Einstellungen übernehmen
        </Button>
        <button
          type="button"
          onClick={handleReset}
          className={buttonClass("quiet", "sm", "flex items-center gap-1.5")}
        >
          <RotateCcw className="size-4" /> Auf Standard zurücksetzen
        </button>
      </div>
    </form>
  );
}
