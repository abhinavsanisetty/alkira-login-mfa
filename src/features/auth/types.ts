import type { Role } from "@/lib/permissions";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "OTP_INVALID"
  | "OTP_EXPIRED"
  | "TOO_MANY_ATTEMPTS"
  | "RATE_LIMITED"
  | "NETWORK";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

/** What the client holds between factors: an identifier, never the code itself.
 *  Carries no permissions. */
export interface Challenge {
  id: string;
  email: string;
  attemptsRemaining: number;
  expiresAt: number;
}

/**
 * Each state carries only the data valid in that state. `user` does not exist
 * before MFA completes, so reading a role from a half-authenticated state is a
 * compile error rather than a code review finding.
 */
export type AuthState =
  | { status: "anonymous"; error?: AuthError }
  | { status: "awaitingMfa"; challenge: Challenge; error?: AuthError }
  | { status: "authenticated"; user: User };

export type AuthAction =
  | { type: "LOGIN_SUCCEEDED"; challenge: Challenge }
  | { type: "LOGIN_FAILED"; error: AuthError }
  | { type: "CHALLENGE_REISSUED"; challenge: Challenge }
  | { type: "MFA_SUCCEEDED"; user: User }
  | { type: "MFA_FAILED"; error: AuthError; attemptsRemaining: number }
  | { type: "LOGGED_OUT" };
