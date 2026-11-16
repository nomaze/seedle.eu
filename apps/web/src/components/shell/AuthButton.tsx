"use client";

import type React from "react";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";

/** Plain text navigation link in the header (no pills, no icons), visible across all viewport sizes. */
const navLink =
  "inline-flex min-h-touch shrink-0 items-center whitespace-nowrap text-[0.9375rem] font-medium text-fg";

export function AboutUsLink(): React.JSX.Element {
  const { t } = useLanguage();
  return (
    <Link href="/ueber-uns" data-spross-target="about-us-link" className={navLink}>
      <span suppressHydrationWarning>{t.brandBar.aboutUs}</span>
    </Link>
  );
}

export function WhyWeDoThisLink(): React.JSX.Element {
  const { t } = useLanguage();
  return (
    <Link href="/warum-wir-das-machen" data-spross-target="why-we-do-this-link" className={navLink}>
      <span suppressHydrationWarning>{t.brandBar.whyWeDoThis}</span>
    </Link>
  );
}

export function MyFarmNavLink(): React.JSX.Element {
  const { t } = useLanguage();
  return (
    <Link
      href="/hof"
      data-testid="header-mein-hof-link"
      data-spross-target="hof-link"
      className="inline-flex min-h-touch shrink-0 items-center whitespace-nowrap text-[0.9375rem] font-semibold text-link"
    >
      <span suppressHydrationWarning>{t.brandBar.farm}</span>
    </Link>
  );
}

export function AuthButton({ verified }: { verified: boolean }) {
  const { t } = useLanguage();
  const auth = useAuth();

  const isUserLoggedIn = verified || auth.isAuthenticated;
  const displayName = auth.user?.name || (isUserLoggedIn ? t.brandBar.farm : t.brandBar.login);

  if (isUserLoggedIn) {
    return (
      <div className="ml-auto inline-flex shrink-0 items-center gap-1">
        <Link
          href="/hof"
          className="inline-flex min-h-touch items-center gap-2 text-[0.9375rem] font-semibold text-link"
          title={auth.user?.email ? `${displayName} (${auth.user.email})` : displayName}
        >
          <span suppressHydrationWarning className="max-w-[140px] truncate sm:max-w-[200px]">
            {displayName}
          </span>
          {auth.user?.modus === "fake" && (
            <span className="hidden text-caption font-semibold text-fg-muted sm:inline">
              Demo
            </span>
          )}
          {auth.user?.modus === "auth0" && (
            <span className="hidden text-caption font-semibold text-fg-muted sm:inline">
              Auth0
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => auth.logout()}
          aria-label="Abmelden"
          title="Abmelden"
          className="inline-flex size-touch items-center justify-center rounded-control text-fg-muted"
        >
          <LogOut className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/anmelden"
      className="ml-auto inline-flex min-h-touch shrink-0 items-center text-[0.9375rem] font-semibold text-link"
    >
      <span suppressHydrationWarning>{t.brandBar.login}</span>
    </Link>
  );
}

/** Backward-compatible export alias */
export const HofButton = AuthButton;
