"use client";

import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";

export function AuthButton({ verified }: { verified: boolean }) {
  const { t } = useLanguage();
  const auth = useAuth();

  const isUserLoggedIn = verified || auth.isAuthenticated;
  const displayName = auth.user?.name || (isUserLoggedIn ? t.brandBar.farm : t.brandBar.login);

  if (isUserLoggedIn) {
    return (
      <div className="relative inline-flex items-center">
        <Link
          href="/hof"
          className="inline-flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-full bg-leaf-50/80 px-3 sm:px-4 text-xs sm:text-sm font-medium text-leaf-900 ring-1 ring-leaf-300 transition hover:bg-leaf-100/80 hover:ring-leaf-400"
          title={auth.user?.email ? `${displayName} (${auth.user.email})` : displayName}
        >
          <UserRound className="size-3.5 sm:size-4 text-leaf-700" aria-hidden />
          <span suppressHydrationWarning className="max-w-[120px] truncate sm:max-w-[180px]">
            {displayName}
          </span>
          {auth.user?.modus === "fake" && (
            <span className="hidden sm:inline-block rounded bg-leaf-200/70 px-1.5 py-0.2 text-[10px] font-semibold text-leaf-800">
              Demo
            </span>
          )}
          {auth.user?.modus === "auth0" && (
            <span className="hidden sm:inline-block rounded bg-leaf-700 px-1.5 py-0.2 text-[10px] font-semibold text-white">
              Auth0
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => auth.logout()}
          aria-label="Abmelden"
          title="Abmelden"
          className="ml-1 inline-flex size-8 sm:size-9 items-center justify-center rounded-full text-muted hover:bg-cream-100 hover:text-ink transition"
        >
          <LogOut className="size-3.5 sm:size-4" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/anmelden"
      className="inline-flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-full bg-white px-3 sm:px-4 text-xs sm:text-sm font-medium text-ink ring-1 ring-line transition hover:ring-leaf-300"
    >
      <UserRound className="size-3.5 sm:size-4 text-leaf-700" aria-hidden />
      <span suppressHydrationWarning>{t.brandBar.login}</span>
    </Link>
  );
}

/** Backward-compatible export alias */
export const HofButton = AuthButton;
