"use client";

import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/shell/AuthContext";
import { useDemo } from "@/components/shell/DemoContext";
import { getSafeRedirect } from "@/lib/redirect";
import { Button } from "./Button";
import { segmentClass } from "@/components/ui/Choice";

/** Form building blocks (design system): labelled inputs on surface, control height and radius. */
const LABEL = "text-small font-semibold text-fg";
const INPUT =
  "mt-1.5 h-control w-full rounded-control border border-control bg-surface px-3 text-body text-fg placeholder:text-fg-muted";
const CODE_INPUT =
  "mt-1.5 h-control w-full rounded-control border border-control bg-surface px-3 text-center text-figure-m tabular-nums tracking-[0.3em] text-fg placeholder:text-fg-muted";
const LINK =
  "text-small font-semibold text-link underline decoration-link/40 underline-offset-4 hover:decoration-link";
/** Feedback as a ruled note: urgent colour for errors, ok colour for success, plain text for info. */
const FEEDBACK_BASE = "border-l-4 py-1 pl-3 text-small font-semibold";
const FEEDBACK_TONE = {
  error: "border-status-urgent text-status-urgent-text",
  success: "border-status-ok text-status-ok-text",
  info: "border-control text-fg",
} as const;

/** Segmented control: rectangular segments side by side, the active one in the selected role. */
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
      <div className="space-y-6">
        <div className="border-b border-divider pb-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5 font-semibold text-fg">
              <ShieldCheck className="size-4 text-link" aria-hidden /> Simulierter Demo-Login
            </span>
            <Link href="/demo" className={LINK}>
              Modus in /demo wechseln
            </Link>
          </div>
          <p className="mt-1.5 text-small text-fg-muted">
            Öffentliche Vorschau von <strong className="text-fg">seedle.eu</strong>. Schneller Sofortzugang ohne Passwort
            und ohne Speicherung personenbezogener Daten.
          </p>
        </div>

        {feedback && <div className={`${FEEDBACK_BASE} ${FEEDBACK_TONE[feedback.type]}`}>{feedback.message}</div>}

        {!otpSent ? (
          <div className="space-y-6">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full justify-center"
              onClick={handleFakeOneClick}
            >
              1-Klick: Als Musterhof fortfahren
            </Button>

            <div className="flex items-center gap-3 text-small text-fg-muted">
              <span aria-hidden className="h-px flex-1 bg-divider" />
              oder beliebige E-Mail testen
              <span aria-hidden className="h-px flex-1 bg-divider" />
            </div>

            <form onSubmit={handleFakeOtpRequest} className="space-y-4">
              <label className="block">
                <span className={LABEL}>E-Mail-Adresse</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@seedle.eu"
                  className={INPUT}
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
              <span className={LABEL}>6-stelliger Einmalcode</span>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className={CODE_INPUT}
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
    <div className="space-y-6">
      {/* Auth0 mode note */}
      <div className="border-b border-divider pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5 font-semibold text-fg">
            <Lock className="size-4 text-link" aria-hidden /> Offizieller NoMaze Auth0 Login
          </span>
          <Link href="/demo" className={LINK}>
            Modus in /demo wechseln
          </Link>
        </div>
        <p className="mt-1.5 text-small text-fg-muted">
          Enterprise Single Sign-On via <strong className="text-fg">auth.nomaze.com</strong> (OIDC Authorization Code Flow mit PKCE S256 & Passwordless Email OTP).
        </p>
      </div>

      {/* Segmented control: login method */}
      <div className="flex gap-1">
        <button
          type="button"
          aria-pressed={activeTab === "otp"}
          onClick={() => {
            setActiveTab("otp");
            setOtpSent(false);
            setFeedback(null);
          }}
          className={segmentClass(activeTab === "otp", "flex-1")}
        >
          Passwordless OTP
        </button>
        <button
          type="button"
          aria-pressed={activeTab === "sso"}
          onClick={() => {
            setActiveTab("sso");
            setFeedback(null);
          }}
          className={segmentClass(activeTab === "sso", "flex-1")}
        >
          NoMaze SSO (PKCE)
        </button>
        <button
          type="button"
          aria-pressed={activeTab === "voucher"}
          onClick={() => {
            setActiveTab("voucher");
            setFeedback(null);
          }}
          className={segmentClass(activeTab === "voucher", "flex-1")}
        >
          Voucher Code
        </button>
      </div>

      {feedback && <div className={`${FEEDBACK_BASE} ${FEEDBACK_TONE[feedback.type]}`}>{feedback.message}</div>}

      {/* TAB 1: Passwordless OTP Flow */}
      {activeTab === "otp" && (
        <>
          {!otpSent ? (
            <form onSubmit={handleAuth0OtpRequest} className="space-y-4">
              <label className="block">
                <span className={LABEL}>Arbeits- oder Betriebs-E-Mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@betrieb.de"
                  required
                  className={INPUT}
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
                <span className={LABEL}>
                  6-stelliger Code gesendet an {email}
                </span>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  required
                  className={CODE_INPUT}
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
          <p className="text-small text-fg-muted">
            Nutze den offiziellen Single Sign-On Account deines Unternehmens oder Züchter-Verbands
            über das NoMaze Identity Center (PKCE S256).
          </p>

          <label className="block">
            <span className={LABEL}>E-Mail (optional für Vorbelegung)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@saatzucht-beispiel.de"
              className={INPUT}
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

          <div className="border-t border-divider pt-3 text-caption text-fg-muted">
            <div className="font-semibold text-fg">Redirect-Ziel:</div>
            <code className="break-all">https://auth.nomaze.com/authorize?client_id={auth.auth0Config.clientId}</code>
          </div>
        </div>
      )}

      {/* TAB 3: Event / Voucher Registration */}
      {activeTab === "voucher" && (
        <form onSubmit={handleVoucherSubmit} className="space-y-4">
          <div className="flex items-center gap-1.5 text-small font-semibold text-fg">
            <Sparkles className="size-4 text-link" aria-hidden />
            <span>Event- oder Züchter-Einladungscode einlösen</span>
          </div>

          <label className="block">
            <span className={LABEL}>Voucher / Einladungscode *</span>
            <input
              type="text"
              value={voucherKey}
              onChange={(e) => setVoucherKey(e.target.value)}
              placeholder="z. B. DEMO-MESSE-2026"
              required
              className={`${INPUT} uppercase tracking-wide`}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Dein Name *</span>
              <input
                type="text"
                value={voucherName}
                onChange={(e) => setVoucherName(e.target.value)}
                placeholder="Dr. Julia Meyer"
                required
                className={INPUT}
              />
            </label>
            <label className="block">
              <span className={LABEL}>Betrieb / Unternehmen</span>
              <input
                type="text"
                value={voucherCompany}
                onChange={(e) => setVoucherCompany(e.target.value)}
                placeholder="Gut Hohenstein"
                className={INPUT}
              />
            </label>
          </div>

          <label className="block">
            <span className={LABEL}>Geschäftliche E-Mail *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="j.meyer@gut-hohenstein.de"
              required
              className={INPUT}
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
