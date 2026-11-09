import "server-only";

export interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: boolean;
  telefon: string | null;
}

export const DEMO_USER: CurrentUser = {
  id: "usr_musterhof",
  name: "Musterhof",
  email: null,
  emailVerified: false,
  telefon: null,
};

let activeSessionUser: CurrentUser = { ...DEMO_USER };

/**
 * Returns the currently active user session.
 */
export async function currentUser(): Promise<CurrentUser> {
  return { ...activeSessionUser };
}

/**
 * Switches the active session to a specified user.
 */
export async function switchSessionTo(userId: string): Promise<void> {
  if (userId === "usr_demo_landwirt") {
    activeSessionUser = {
      id: "usr_demo_landwirt",
      name: "Peter Müller",
      email: "peter.mueller@seedle-demo.de",
      emailVerified: true,
      telefon: "+49 171 1234567",
    };
  } else {
    activeSessionUser = {
      id: userId,
      name: null,
      email: null,
      emailVerified: false,
      telefon: null,
    };
  }
}

/**
 * Clears current session credentials and reverts to default guest state.
 */
export async function clearSession(): Promise<void> {
  activeSessionUser = { ...DEMO_USER };
}

/**
 * Ends the current active user session.
 */
export async function endSession(): Promise<void> {
  activeSessionUser = { ...DEMO_USER };
}
