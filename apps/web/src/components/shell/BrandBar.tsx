import Link from "next/link";
import { Suspense } from "react";
import { type CurrentUser, currentUser } from "@/server/session";
import { AuthButton, HofButton } from "./AuthButton";
import { BackendStatusBadge } from "./BackendStatusBadge";
import { NurMit } from "./DemoContext";
import { Logo } from "./Logo";

/**
 * Top brand navigation bar across all views: Logo and actions left, clearance for Spross right.
 */
export function BrandBar({ user }: { user?: CurrentUser } = {}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-md overflow-x-clip">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link
            href="/"
            aria-label="Zur Startseite"
            className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-leaf-500"
          >
            <Logo />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <NurMit funktion="anmeldung">
              {user !== undefined ? (
                <AuthButton verified={Boolean(user?.emailVerified)} />
              ) : (
                <Suspense fallback={<AuthButton verified={false} />}>
                  <AuthNavLink />
                </Suspense>
              )}
            </NurMit>
            {/* LanguageSwitch hidden to maintain a consistent German interface across the public demo */}
            <BackendStatusBadge />
          </div>
        </div>
      </div>
    </header>
  );
}

async function AuthNavLink() {
  let verified = false;
  try {
    const user = await currentUser();
    verified = Boolean(user?.emailVerified);
  } catch {
    verified = false;
  }
  return <AuthButton verified={verified} />;
}

export { AuthButton, HofButton };
