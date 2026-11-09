/**
 * Official NoMaze Auth0 configuration and client helpers.
 * Strictly in English per AGENTS.md rules.
 */

export interface Auth0Configuration {
  domain: string;
  clientId: string;
  audience: string;
  issuer: string;
}

export const AUTH0_CONFIG: Auth0Configuration = {
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN ?? "auth.nomaze.com",
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID ?? "seedle-web-spa-client",
  audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE ?? "https://seedle.eu",
  issuer: "https://auth.nomaze.com",
};

export type AuthModus = "fake" | "auth0";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  name: string | null;
  emailVerified: boolean;
  modus: AuthModus;
  picture?: string | null;
}

export const MUSTERHOF_FAKE_USER: AuthenticatedUser = {
  id: "usr_musterhof",
  email: "musterhof@seedle.eu",
  name: "Musterhof",
  emailVerified: true,
  modus: "fake",
};

/**
 * In-memory storage for active access token so ClientApiInterceptors
 * and client-side requests can attach Authorization: Bearer <token>.
 * Never persisted to sessionStorage or localStorage to mitigate token theft on XSS.
 */
let inMemoryAccessToken: string | null = null;

export function getActiveAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setActiveAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

/**
 * Triggers Auth0 Passwordless Email OTP code generation via https://auth.nomaze.com/passwordless/start
 */
export async function startPasswordlessEmailOtp(
  email: string,
  config: Auth0Configuration = AUTH0_CONFIG,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const url = `https://${config.domain}/passwordless/start`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: config.clientId,
        connection: "email",
        email: email.trim().toLowerCase(),
        send: "code",
        authParams: {
          scope: "openid profile email",
          audience: config.audience,
        },
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorDescription =
        (data as { error_description?: string; description?: string; error?: string }).error_description ||
        (data as { error_description?: string; description?: string; error?: string }).description ||
        `Auth0 request failed (${res.status} ${res.statusText})`;
      return { ok: false, error: errorDescription };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error contacting Auth0 tenant";
    return { ok: false, error: message };
  }
}

/**
 * Verifies Auth0 Passwordless Email OTP code via https://auth.nomaze.com/oauth/token
 */
export async function verifyPasswordlessEmailOtp(
  email: string,
  otpCode: string,
  config: Auth0Configuration = AUTH0_CONFIG,
): Promise<{
  ok: boolean;
  accessToken?: string;
  idToken?: string;
  expiresIn?: number;
  error?: string;
}> {
  try {
    const url = `https://${config.domain}/oauth/token`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        client_id: config.clientId,
        username: email.trim().toLowerCase(),
        otp: otpCode.trim(),
        realm: "email",
        scope: "openid profile email",
        audience: config.audience,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorDescription =
        (data as { error_description?: string; description?: string; error?: string }).error_description ||
        (data as { error_description?: string; description?: string; error?: string }).description ||
        `OTP verification failed (${res.status})`;
      return { ok: false, error: errorDescription };
    }

    const payload = data as {
      access_token?: string;
      id_token?: string;
      expires_in?: number;
    };

    return {
      ok: true,
      accessToken: payload.access_token,
      idToken: payload.id_token,
      expiresIn: payload.expires_in,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error verifying OTP";
    return { ok: false, error: message };
  }
}
