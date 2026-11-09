"use client";

import { Auth0Client, createAuth0Client } from "@auth0/auth0-spa-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AUTH0_CONFIG,
  type Auth0Configuration,
  type AuthModus,
  type AuthenticatedUser,
  getActiveAccessToken,
  MUSTERHOF_FAKE_USER,
  setActiveAccessToken,
  startPasswordlessEmailOtp,
  verifyPasswordlessEmailOtp,
} from "@/lib/auth-config";
import { getSafeRedirect } from "@/lib/redirect";
import { useDemo } from "./DemoContext";

export interface VoucherRegistrationData {
  voucherKey: string;
  email: string;
  name: string;
  company?: string;
}

export interface AuthContextValue {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModus: AuthModus;
  auth0Config: Auth0Configuration;
  error: string | null;
  loginFake: (email?: string, name?: string) => void;
  loginWithAuth0Redirect: (loginHint?: string) => Promise<void>;
  requestPasswordlessOtp: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyPasswordlessOtp: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  registerWithVoucher: (data: VoucherRegistrationData) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
}

const defaultAuthContextValue: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authModus: "fake",
  auth0Config: AUTH0_CONFIG,
  error: null,
  loginFake: () => {},
  loginWithAuth0Redirect: async () => {},
  requestPasswordlessOtp: async () => ({ ok: false }),
  verifyPasswordlessOtp: async () => ({ ok: false }),
  registerWithVoucher: async () => ({ ok: false }),
  logout: async () => {},
  getAccessToken: () => null,
};

const AuthContext = createContext<AuthContextValue>(defaultAuthContextValue);

const STORAGE_AUTH_USER_KEY = "seedle_auth_user";

function parseAuthenticatedUser(raw: string): AuthenticatedUser | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) {
      return null;
    }
    const record = value as Record<string, unknown>;
    if (typeof record.id !== "string" || !record.id) {
      return null;
    }
    const modus: AuthModus = record.modus === "auth0" ? "auth0" : "fake";
    const email = typeof record.email === "string" ? record.email : null;
    const name = typeof record.name === "string" ? record.name : null;
    const emailVerified = Boolean(record.emailVerified);
    const picture = typeof record.picture === "string" ? record.picture : null;

    return {
      id: record.id,
      email,
      name,
      emailVerified,
      modus,
      picture,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { authModus } = useDemo();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [auth0Client, setAuth0Client] = useState<Auth0Client | null>(null);

  // Initialize or restore persisted user session
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_AUTH_USER_KEY);
      if (stored) {
        const parsedUser = parseAuthenticatedUser(stored);
        if (parsedUser) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setUser(parsedUser);
        }
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync Auth0 client initialization in browser when in auth0 mode or on redirect
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    async function initAuth0() {
      try {
        const client = await createAuth0Client({
          domain: AUTH0_CONFIG.domain,
          clientId: AUTH0_CONFIG.clientId,
          authorizationParams: {
            redirect_uri: window.location.origin + "/anmelden",
            audience: AUTH0_CONFIG.audience,
            scope: "openid profile email",
          },
          useRefreshTokens: true,
          cacheLocation: "memory",
        });

        if (!isMounted) return;
        setAuth0Client(client);

        // Check if returning from redirect with code & state
        const query = window.location.search;
        if (query.includes("code=") && query.includes("state=")) {
          const result = await client.handleRedirectCallback();
          const auth0User = await client.getUser();
          const token = await client.getTokenSilently().catch(() => null);

          if (token) {
            setActiveAccessToken(token);
          }

          if (auth0User) {
            const nextUser: AuthenticatedUser = {
              id: auth0User.sub || `usr_auth0_${Date.now()}`,
              email: auth0User.email || null,
              name: auth0User.name || auth0User.nickname || "NoMaze User",
              emailVerified: Boolean(auth0User.email_verified),
              picture: auth0User.picture || null,
              modus: "auth0",
            };
            setUser(nextUser);
            localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(nextUser));
          }

          // Clean up search params after redirect callback
          const targetUrl = getSafeRedirect(result?.appState?.targetUrl, "/hof");
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.href = targetUrl;
        }
      } catch (err) {
        if (!isMounted) return;
        // Non-blocking: will show in error state if user triggered redirect
        console.warn("Auth0 client initialization warning:", err);
      }
    }

    initAuth0();

    return () => {
      isMounted = false;
    };
  }, []);

  const loginFake = useCallback((email?: string, name?: string) => {
    const fakeUser: AuthenticatedUser = {
      id: MUSTERHOF_FAKE_USER.id,
      email: email?.trim() || MUSTERHOF_FAKE_USER.email,
      name: name?.trim() || (email ? email.split("@")[0] : MUSTERHOF_FAKE_USER.name),
      emailVerified: true,
      modus: "fake",
    };
    setUser(fakeUser);
    setActiveAccessToken("fake-bearer-token-musterhof-session");
    try {
      localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(fakeUser));
    } catch {
      // Ignore localStorage errors
    }
    setError(null);
  }, []);

  const loginWithAuth0Redirect = useCallback(
    async (loginHint?: string) => {
      setError(null);
      try {
        if (!auth0Client) {
          throw new Error("Auth0 client not initialized yet. Please try again.");
        }
        await auth0Client.loginWithRedirect({
          authorizationParams: {
            login_hint: loginHint,
            redirect_uri: window.location.origin + "/anmelden",
          },
          appState: {
            targetUrl: "/hof",
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Redirect to Auth0 failed";
        setError(msg);
        throw err;
      }
    },
    [auth0Client],
  );

  const requestPasswordlessOtp = useCallback(async (email: string) => {
    setError(null);
    const result = await startPasswordlessEmailOtp(email, AUTH0_CONFIG);
    if (!result.ok && result.error) {
      setError(result.error);
    }
    return result;
  }, []);

  const verifyPasswordlessOtp = useCallback(async (email: string, code: string) => {
    setError(null);
    const result = await verifyPasswordlessEmailOtp(email, code, AUTH0_CONFIG);
    if (result.ok && result.accessToken) {
      setActiveAccessToken(result.accessToken);
      const nextUser: AuthenticatedUser = {
        id: `usr_auth0_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
        email: email.trim().toLowerCase(),
        name: email.split("@")[0],
        emailVerified: true,
        modus: "auth0",
      };
      setUser(nextUser);
      try {
        localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(nextUser));
      } catch {
        // Ignore localStorage errors
      }
      return { ok: true };
    }
    const err = result.error || "Verification failed";
    setError(err);
    return { ok: false, error: err };
  }, []);

  const registerWithVoucher = useCallback(
    async (data: VoucherRegistrationData): Promise<{ ok: boolean; error?: string }> => {
      setError(null);
      const cleanKey = data.voucherKey.trim().toUpperCase();
      if (!cleanKey) {
        const msg = "Invalid or empty voucher key";
        setError(msg);
        return { ok: false, error: msg };
      }

      // Simulate official voucher registration and exchange for NoMaze Auth0 session
      const voucherUser: AuthenticatedUser = {
        id: `usr_voucher_${cleanKey.toLowerCase()}`,
        email: data.email.trim().toLowerCase(),
        name: data.name.trim() || data.email.split("@")[0],
        emailVerified: true,
        modus: "auth0",
      };
      const token = `bearer-voucher-token-${cleanKey}-${Date.now()}`;
      setActiveAccessToken(token);
      setUser(voucherUser);
      try {
        localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(voucherUser));
      } catch {
        // Ignore localStorage errors
      }
      return { ok: true };
    },
    [],
  );

  const logout = useCallback(async () => {
    setUser(null);
    setActiveAccessToken(null);
    try {
      localStorage.removeItem(STORAGE_AUTH_USER_KEY);
    } catch {
      // Ignore localStorage errors
    }

    if (authModus === "auth0" && auth0Client) {
      try {
        await auth0Client.logout({
          logoutParams: {
            returnTo: window.location.origin + "/",
          },
        });
      } catch {
        // Logout locally on redirect issue
      }
    }
  }, [authModus, auth0Client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      authModus,
      auth0Config: AUTH0_CONFIG,
      error,
      loginFake,
      loginWithAuth0Redirect,
      requestPasswordlessOtp,
      verifyPasswordlessOtp,
      registerWithVoucher,
      logout,
      getAccessToken: getActiveAccessToken,
    }),
    [
      user,
      isLoading,
      authModus,
      error,
      loginFake,
      loginWithAuth0Redirect,
      requestPasswordlessOtp,
      verifyPasswordlessOtp,
      registerWithVoucher,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
