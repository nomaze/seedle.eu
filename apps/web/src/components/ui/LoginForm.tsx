"use client";

import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/shell/AuthContext";
import { useDemo } from "@/components/shell/DemoContext";
import { getSafeRedirect } from "@/lib/redirect";
import { Button } from "./Button";

export function LoginForm({
  startEmail = "",
  ziel = "/hof",
}: {
  startEmail?: string;
  ziel?: string;
  nurBestaetigen?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryZiel = searchParams.get("ziel") || ziel;
  const queryEmail = searchParams.get("email") || startEmail;
  const safeZiel = getSafeRedirect(queryZiel, "/hof");

  const { authModus } = useDemo();
  const auth = useAuth();

  // Mode-independent form states
  const [email, setEmail] = useState(queryEmail);
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState<"otp" | "sso" | "voucher">("otp");

  // Voucher registration fields
  const [voucherKey, setVoucherKey] = useState("");
  const [voucherName, setVoucherName] = useState("");
  const [voucherCompany, setVoucherCompany] = useState("");

  // Workflow states
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // -------------------------------------------------------------
  // FAKE MODE HANDLERS
  // -------------------------------------------------------------
  const handleFakeOneClick = () => {
    auth.loginFake("musterhof@seedle.eu", "Musterhof");
    router.push(safeZiel);
  };

  const handleFakeOtpRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setFeedback({ type: "error", message: "Bitte gib eine E-Mail-Adresse ein." });
      return;
    }
    setOtpSent(true);
    setFeedback({
      type: "info",
      message: "Simulierter 6-stelliger Code: 123456 (oder beliebige 6 Ziffern)",
    });
  };

  const handleFakeOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6 && code.trim() !== "123456") {
      setFeedback({ type: "error", message: "Bitte gib einen 6-stelligen Code ein (z. B. 123456)." });
      return;
    }
    auth.loginFake(email, email.split("@")[0]);
    router.push(safeZiel);
  };

  // -------------------------------------------------------------
  // AUTH0 MODE HANDLERS
  // -------------------------------------------------------------
  const handleAuth0OtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setFeedback({ type: "error", message: "Bitte gib eine gültige Arbeits- oder Betriebs-E-Mail ein." });
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);

    const res = await auth.requestPasswordlessOtp(email);
    setIsSubmitting(false);

    if (res.ok) {
      setOtpSent(true);
      setFeedback({
        type: "success",
        message: `Ein 6-stelliger Einmalcode wurde via auth.nomaze.com an ${email} gesendet.`,
      });
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Fehler beim Anfordern des Codes via Auth0.",
      });
    }
  };

  const handleAuth0OtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setFeedback({ type: "error", message: "Bitte gib den 6-stelligen Code ein." });
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);

    const res = await auth.verifyPasswordlessOtp(email, code);
    setIsSubmitting(false);

    if (res.ok) {
      router.push(safeZiel);
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Ungültiger oder abgelaufener Code.",
      });
    }
  };

  const handleAuth0Sso = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await auth.loginWithAuth0Redirect(email || undefined);
    } catch (err) {
      setIsSubmitting(false);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Auth0 Redirect fehlgeschlagen.",
      });
    }
  };

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherKey.trim() || !email.trim() || !voucherName.trim()) {
      setFeedback({ type: "error", message: "Bitte fülle alle Pflichtfelder für die Voucher-Registrierung aus." });
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);

    const res = await auth.registerWithVoucher({
      voucherKey,
      email,
      name: voucherName,
      company: voucherCompany,
    });
    setIsSubmitting(false);

    if (res.ok) {
      setFeedback({ type: "success", message: "Voucher erfolgreich aktiviert!" });
      setTimeout(() => router.push(safeZiel), 600);
    } else {
      setFeedback({ type: "error", message: res.error || "Voucher ungültig." });
    }
  };

  // =============================================================
  // RENDER: FAKE DEMO MODE
  // =============================================================
  if (authModus === "fake") {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-leaf-200 bg-leaf-50/70 p-4 text-xs text-ink/80 leading-relaxed">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-bold text-leaf-800">
              <ShieldCheck className="size-4 text-leaf-700" /> Simulierter Demo-Login
            </span>
            <Link
              href="/demo"
              className="text-[11px] font-semibold text-leaf-700 underline hover:text-leaf-900"
            >
              Modus in /demo wechseln
            </Link>
          </div>
          <p className="mt-1.5 text-muted">
            Öffentliche Vorschau von <strong>seedle.eu</strong>. Schneller Sofortzugang ohne Passwort
            und ohne Speicherung personenbezogener Daten.
          </p>
        </div>

        {feedback && (
          <div
            className={`rounded-xl p-3 text-xs font-medium ${
              feedback.type === "error"
                ? "border border-red-200 bg-red-50 text-red-800"
                : "border border-leaf-300 bg-leaf-100 text-leaf-900"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {!otpSent ? (
          <div className="space-y-4">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full justify-center"
              onClick={handleFakeOneClick}
            >
              1-Klick: Als Musterhof fortfahren
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-line" />
              <span className="absolute bg-white px-2 text-[11px] font-medium uppercase text-muted">
                oder beliebige E-Mail testen
              </span>
            </div>

            <form onSubmit={handleFakeOtpRequest} className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-ink">E-Mail-Adresse</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@seedle.eu"
                  className="mt-1 h-11 w-full rounded-xl bg-white px-4 text-sm ring-1 ring-line outline-none transition focus:ring-2 focus:ring-leaf-400"
                />
              </label>

              <Button type="submit" variant="secondary" size="md" className="w-full justify-center">
                Simulierten 6-stelligen Code anfordern
              </Button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleFakeOtpVerify} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-ink">6-stelliger Einmalcode</span>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="mt-1 h-12 w-full rounded-xl bg-white px-4 text-center font-mono text-xl tracking-widest ring-1 ring-line outline-none transition focus:ring-2 focus:ring-leaf-400"
              />
            </label>

            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="md" className="flex-1 justify-center">
                Code bestätigen & Anmelden
              </Button>
              <Button
                type="button"
                variant="quiet"
                size="md"
                onClick={() => setOtpSent(false)}
              >
                Zurück
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // =============================================================
  // RENDER: AUTH0 MODE (auth.nomaze.com)
  // =============================================================
  return (
    <div className="space-y-5">
      {/* Auth0 Mode Badge */}
      <div className="rounded-2xl border border-leaf-300 bg-leaf-50/80 p-4 text-xs text-ink/90 leading-relaxed">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 font-bold text-leaf-900">
            <Lock className="size-4 text-leaf-800" /> Offizieller NoMaze Auth0 Login
          </span>
          <Link
            href="/demo"
            className="text-[11px] font-semibold text-leaf-700 underline hover:text-leaf-900"
          >
            Modus in /demo wechseln
          </Link>
        </div>
        <p className="mt-1.5 text-muted">
          Enterprise Single Sign-On via <strong>auth.nomaze.com</strong> (OIDC Authorization Code Flow mit PKCE S256 & Passwordless Email OTP).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-cream-100 p-1 text-xs font-semibold text-muted">
        <button
          type="button"
          onClick={() => {
            setActiveTab("otp");
            setOtpSent(false);
            setFeedback(null);
          }}
          className={`flex-1 rounded-lg py-2 transition ${
            activeTab === "otp" ? "bg-white text-ink shadow-sm" : "hover:text-ink"
          }`}
        >
          Passwordless OTP
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("sso");
            setFeedback(null);
          }}
          className={`flex-1 rounded-lg py-2 transition ${
            activeTab === "sso" ? "bg-white text-ink shadow-sm" : "hover:text-ink"
          }`}
        >
          NoMaze SSO (PKCE)
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("voucher");
            setFeedback(null);
          }}
          className={`flex-1 rounded-lg py-2 transition ${
            activeTab === "voucher" ? "bg-white text-ink shadow-sm" : "hover:text-ink"
          }`}
        >
          Voucher Code
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-xl p-3 text-xs font-medium leading-relaxed ${
            feedback.type === "error"
              ? "border border-red-200 bg-red-50 text-red-800"
              : feedback.type === "success"
              ? "border border-leaf-300 bg-leaf-100 text-leaf-900"
              : "border border-sky-200 bg-sky-50 text-sky-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* TAB 1: Passwordless OTP Flow */}
      {activeTab === "otp" && (
        <>
          {!otpSent ? (
            <form onSubmit={handleAuth0OtpRequest} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-ink">Arbeits- oder Betriebs-E-Mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@betrieb.de"
                  required
                  className="mt-1 h-11 w-full rounded-xl bg-white px-4 text-sm ring-1 ring-line outline-none transition focus:ring-2 focus:ring-leaf-400"
                />
              </label>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full justify-center"
              >
                {isSubmitting ? "Sende OTP via auth.nomaze.com …" : "Einmalcode anfordern (Passwordless)"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAuth0OtpVerify} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-ink">
                  6-stelliger Code gesendet an {email}
                </span>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  required
                  className="mt-1 h-12 w-full rounded-xl bg-white px-4 text-center font-mono text-xl tracking-widest ring-1 ring-line outline-none transition focus:ring-2 focus:ring-leaf-400"
                />
              </label>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  className="flex-1 justify-center"
                >
                  {isSubmitting ? "Prüfe Code …" : "Code verifizieren & Anmelden"}
                </Button>
                <Button
                  type="button"
                  variant="quiet"
                  size="md"
                  onClick={() => setOtpSent(false)}
                >
                  Zurück
                </Button>
              </div>
            </form>
          )}
        </>
      )}

      {/* TAB 2: NoMaze SSO (PKCE Universal Login) */}
      {activeTab === "sso" && (
        <div className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            Nutze den offiziellen Single Sign-On Account deines Unternehmens oder Züchter-Verbands
            über das NoMaze Identity Center (PKCE S256).
          </p>

          <label className="block">
            <span className="text-xs font-semibold text-ink">E-Mail (optional für Vorbelegung)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@saatzucht-beispiel.de"
              className="mt-1 h-11 w-full rounded-xl bg-white px-4 text-sm ring-1 ring-line outline-none transition focus:ring-2 focus:ring-leaf-400"
            />
          </label>

          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            onClick={handleAuth0Sso}
            className="w-full justify-center"
          >
            {isSubmitting ? "Leite weiter zu auth.nomaze.com …" : "Mit NoMaze Single Sign-On anmelden"}
          </Button>

          <div className="rounded-xl border border-line bg-cream-50 p-3 text-[11px] text-muted">
            <div className="font-semibold text-ink">Redirect-Ziel:</div>
            <code>https://auth.nomaze.com/authorize?client_id={auth.auth0Config.clientId}</code>
          </div>
        </div>
      )}

      {/* TAB 3: Event / Voucher Registration */}
      {activeTab === "voucher" && (
        <form onSubmit={handleVoucherSubmit} className="space-y-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-leaf-800">
            <Sparkles className="size-4" />
            <span>Event- oder Züchter-Einladungscode einlösen</span>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-ink">Voucher / Einladungscode *</span>
            <input
              type="text"
              value={voucherKey}
              onChange={(e) => setVoucherKey(e.target.value)}
              placeholder="z. B. DEMO-MESSE-2026"
              required
              className="mt-1 h-11 w-full rounded-xl bg-white px-4 font-mono uppercase text-sm ring-1 ring-line outline-none transition focus:ring-2 focus:ring-leaf-400"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink">Dein Name *</span>
              <input
                type="text"
                value={voucherName}
                onChange={(e) => setVoucherName(e.target.value)}
                placeholder="Dr. Julia Meyer"
                required
                className="mt-1 h-11 w-full rounded-xl bg-white px-4 text-sm ring-1 ring-line outline-none transition focus:ring-2 focus:ring-leaf-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink">Betrieb / Unternehmen</span>
              <input
                type="text"
                value={voucherCompany}
                onChange={(e) => setVoucherCompany(e.target.value)}
                placeholder="Gut Hohenstein"
                className="mt-1 h-11 w-full rounded-xl bg-white px-4 text-sm ring-1 ring-line outline-none transition focus:ring-2 focus:ring-leaf-400"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-ink">Geschäftliche E-Mail *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="j.meyer@gut-hohenstein.de"
              required
              className="mt-1 h-11 w-full rounded-xl bg-white px-4 text-sm ring-1 ring-line outline-none transition focus:ring-2 focus:ring-leaf-400"
            />
          </label>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            className="w-full justify-center"
          >
            {isSubmitting ? "Aktiviere Voucher …" : "Voucher aktivieren & Anmelden"}
          </Button>
        </form>
      )}
    </div>
  );
}
