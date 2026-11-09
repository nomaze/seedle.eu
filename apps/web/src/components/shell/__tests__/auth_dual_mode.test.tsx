import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../AuthContext";
import { AuthButton } from "../AuthButton";
import {
  createApiInterceptorFetch,
  isOwnApiRequest,
} from "../ClientApiInterceptors";
import { DemoProvider } from "../DemoContext";
import { LoginForm } from "@/components/ui/LoginForm";
import {
  AUTH0_CONFIG,
  getActiveAccessToken,
  setActiveAccessToken,
  startPasswordlessEmailOtp,
  verifyPasswordlessEmailOtp,
} from "@/lib/auth-config";
import { DEMO_STANDARD } from "@/lib/demo";
import { getSafeRedirect } from "@/lib/redirect";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "ziel" ? "/hof" : null),
  }),
}));

// Mock @auth0/auth0-spa-js
const mockLoginWithRedirect = vi.fn().mockResolvedValue(undefined);
const mockHandleRedirectCallback = vi.fn().mockResolvedValue({ appState: { targetUrl: "/hof" } });
const mockGetUser = vi.fn().mockResolvedValue({
  sub: "auth0|12345",
  name: "Dr. Johannes Züchter",
  email: "johannes@nomaze.com",
  email_verified: true,
});
const mockGetTokenSilently = vi.fn().mockResolvedValue("mocked-auth0-jwt-access-token");
const mockLogout = vi.fn().mockResolvedValue(undefined);

vi.mock("@auth0/auth0-spa-js", () => ({
  createAuth0Client: vi.fn().mockResolvedValue({
    loginWithRedirect: (...args: unknown[]) => mockLoginWithRedirect(...args),
    handleRedirectCallback: () => mockHandleRedirectCallback(),
    getUser: () => mockGetUser(),
    getTokenSilently: () => mockGetTokenSilently(),
    logout: (...args: unknown[]) => mockLogout(...args),
  }),
}));

describe("Dual-Mode Authentication & Auth0 Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActiveAccessToken(null);
  });

  describe("1. Configuration and Auth0 Helper Functions", () => {
    it("provides the canonical NoMaze Auth0 configuration", () => {
      expect(AUTH0_CONFIG.domain).toBe("auth.nomaze.com");
      expect(AUTH0_CONFIG.clientId).toBe("seedle-web-spa-client");
      expect(AUTH0_CONFIG.audience).toBe("https://seedle.eu");
      expect(AUTH0_CONFIG.issuer).toBe("https://auth.nomaze.com");
    });

    it("stores active bearer access tokens strictly in memory only without sessionStorage", () => {
      const mockSessionStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      vi.stubGlobal("window", { sessionStorage: mockSessionStorage });

      expect(getActiveAccessToken()).toBeNull();
      setActiveAccessToken("mock-jwt-token-xyz");
      expect(getActiveAccessToken()).toBe("mock-jwt-token-xyz");
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();

      setActiveAccessToken(null);
      expect(getActiveAccessToken()).toBeNull();
      expect(mockSessionStorage.getItem).not.toHaveBeenCalled();
      expect(mockSessionStorage.removeItem).not.toHaveBeenCalled();

      vi.unstubAllGlobals();
    });

    it("triggers passwordless OTP start against https://auth.nomaze.com/passwordless/start", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });
      vi.stubGlobal("fetch", mockFetch);

      const res = await startPasswordlessEmailOtp("test@betrieb.de");
      expect(res.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://auth.nomaze.com/passwordless/start",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: AUTH0_CONFIG.clientId,
            connection: "email",
            email: "test@betrieb.de",
            send: "code",
            authParams: {
              scope: "openid profile email",
              audience: AUTH0_CONFIG.audience,
            },
          }),
        }),
      );

      vi.unstubAllGlobals();
    });

    it("verifies passwordless OTP token exchange against https://auth.nomaze.com/oauth/token", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "token_abc_123",
          id_token: "id_jwt_456",
          expires_in: 86400,
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const res = await verifyPasswordlessEmailOtp("test@betrieb.de", "654321");
      expect(res.ok).toBe(true);
      expect(res.accessToken).toBe("token_abc_123");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://auth.nomaze.com/oauth/token",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
            client_id: AUTH0_CONFIG.clientId,
            username: "test@betrieb.de",
            otp: "654321",
            realm: "email",
            scope: "openid profile email",
            audience: AUTH0_CONFIG.audience,
          }),
        }),
      );

      vi.unstubAllGlobals();
    });
  });

  describe("2. Fake Mode Login Rendering", () => {
    it("renders simulated demo login UI by default with 1-click access", () => {
      const html = renderToStaticMarkup(
        <DemoProvider value={{ ...DEMO_STANDARD, authModus: "fake" }}>
          <AuthProvider>
            <AuthButton verified={false} />
            <LoginForm />
          </AuthProvider>
        </DemoProvider>,
      );

      expect(html).toContain("Simulierter Demo-Login");
      expect(html).toContain("1-Klick: Als Musterhof fortfahren");
      expect(html).toContain("Anmelden");
    });
  });

  describe("3. Official Auth0 Mode Login Rendering", () => {
    it("renders the official Auth0 login tabs and technical connection specs in auth0 mode", () => {
      const html = renderToStaticMarkup(
        <DemoProvider value={{ ...DEMO_STANDARD, authModus: "auth0" }}>
          <AuthProvider>
            <AuthButton verified={false} />
            <LoginForm />
          </AuthProvider>
        </DemoProvider>,
      );

      expect(html).toContain("Offizieller NoMaze Auth0 Login");
      expect(html).toContain("Passwordless OTP");
      expect(html).toContain("NoMaze SSO (PKCE)");
      expect(html).toContain("Voucher Code");
      expect(html).toContain("auth.nomaze.com");
    });
  });

  describe("4. Auth Button State Verification", () => {
    it("renders farm navigation when verified", () => {
      const html = renderToStaticMarkup(
        <DemoProvider value={{ ...DEMO_STANDARD, authModus: "fake" }}>
          <AuthProvider>
            <AuthButton verified={true} />
          </AuthProvider>
        </DemoProvider>,
      );

      expect(html).toContain("/hof");
    });
  });

  describe("5. Open Redirect Protection (F1)", () => {
    it("rejects all open-redirect bypass payloads and falls back to /hof", () => {
      const maliciousPayloads = [
        "//example.com",
        "/\\example.com",
        "/%09/example.com",
        "/%0a/example.com",
        "/\t/example.com",
        "https:example.com",
        "https://example.com",
        "javascript:alert(1)",
        "/%0d/example.com",
        "/%2f/example.com",
        "/%5cexample.com",
      ];

      for (const payload of maliciousPayloads) {
        const result = getSafeRedirect(payload, "/hof");
        expect(result).toBe("/hof");
        expect(result).not.toContain("example.com");
      }
    });

    it("allows safe local relative paths with query strings and hashes", () => {
      expect(getSafeRedirect("/hof", "/hof")).toBe("/hof");
      expect(getSafeRedirect("/daten?region=BY&nutzung=silo#karte", "/hof")).toBe(
        "/daten?region=BY&nutzung=silo#karte",
      );
      expect(getSafeRedirect(null, "/hof")).toBe("/hof");
      expect(getSafeRedirect("", "/hof")).toBe("/hof");
    });
  });

  describe("6. Scoped Authorization Header Interceptor (F2)", () => {
    it("does NOT attach Authorization header to third-party Nominatim/tile requests while attaching it to /api/v1/fields", async () => {
      setActiveAccessToken("secret-bearer-token-f2");

      const mockUnderlyingFetch = vi.fn().mockImplementation(async () => {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      });

      const interceptedFetch = createApiInterceptorFetch(
        mockUnderlyingFetch as unknown as typeof fetch,
        "https://seedle.eu",
      );

      // 1. Third-party Nominatim request must NOT receive Authorization header
      expect(
        isOwnApiRequest(
          "https://nominatim.openstreetmap.org/search?format=jsonv2&q=Freising",
          "https://seedle.eu",
        ),
      ).toBe(false);

      await interceptedFetch(
        "https://nominatim.openstreetmap.org/search?format=jsonv2&q=Freising",
      );

      const nominatimCall = mockUnderlyingFetch.mock.calls[0];
      const nominatimInit = (nominatimCall?.[1] ?? {}) as RequestInit;
      const nominatimHeaders = new Headers(nominatimInit.headers || {});
      expect(nominatimHeaders.get("Authorization")).toBeNull();

      // 2. Own API request (/api/v1/fields) MUST receive Authorization header
      expect(isOwnApiRequest("/api/v1/fields", "https://seedle.eu")).toBe(true);

      await interceptedFetch("/api/v1/fields");

      const fieldsCall = mockUnderlyingFetch.mock.calls[1];
      const fieldsInit = (fieldsCall?.[1] ?? {}) as RequestInit;
      const fieldsHeaders = new Headers(fieldsInit.headers || {});
      expect(fieldsHeaders.get("Authorization")).toBe("Bearer secret-bearer-token-f2");
    });
  });
});
