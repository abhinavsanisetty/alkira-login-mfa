import { describe, expect, it } from "vitest";

import { OTP_MAX_ATTEMPTS } from "@/lib/constants";

import { authReducer, initialAuthState } from "./authReducer";
import type { AuthError, AuthState, Challenge, User } from "./types";

const challenge: Challenge = {
  id: "chg_1",
  email: "editor@alkira.test",
  attemptsRemaining: OTP_MAX_ATTEMPTS,
  expiresAt: Date.now() + 60_000,
};

const user: User = {
  id: "usr_1",
  email: "editor@alkira.test",
  name: "Ada Editor",
  role: "editor",
};

const otpInvalid: AuthError = { code: "OTP_INVALID", message: "That code is not valid." };

const awaitingMfa: AuthState = { status: "awaitingMfa", challenge };
const authenticated: AuthState = { status: "authenticated", user };

describe("authReducer", () => {
  it("advances to the challenge after the first factor", () => {
    expect(authReducer(initialAuthState, { type: "LOGIN_SUCCEEDED", challenge })).toEqual(
      awaitingMfa,
    );
  });

  it("records a login failure without leaving anonymous", () => {
    const error: AuthError = { code: "INVALID_CREDENTIALS", message: "Incorrect password." };
    expect(authReducer(initialAuthState, { type: "LOGIN_FAILED", error })).toEqual({
      status: "anonymous",
      error,
    });
  });

  it("authenticates when the challenge is satisfied", () => {
    expect(authReducer(awaitingMfa, { type: "MFA_SUCCEEDED", user })).toEqual(authenticated);
  });

  // The MFA bypass, expressed as a test. Nothing but a live challenge can
  // produce an authenticated state.
  it.each<[string, AuthState]>([
    ["anonymous", initialAuthState],
    ["already authenticated", authenticated],
  ])("ignores MFA success from %s", (_label, state) => {
    expect(authReducer(state, { type: "MFA_SUCCEEDED", user })).toBe(state);
  });

  it("ignores a second login while a challenge is live", () => {
    expect(authReducer(awaitingMfa, { type: "LOGIN_SUCCEEDED", challenge })).toBe(awaitingMfa);
  });

  it("decrements attempts on a wrong code", () => {
    expect(authReducer(awaitingMfa, { type: "MFA_FAILED", error: otpInvalid, attemptsRemaining: 2 })).toEqual(
      {
        status: "awaitingMfa",
        challenge: { ...challenge, attemptsRemaining: 2 },
        error: otpInvalid,
      },
    );
  });

  it("destroys the challenge once attempts are exhausted", () => {
    const error: AuthError = { code: "TOO_MANY_ATTEMPTS", message: "Too many attempts." };
    expect(authReducer(awaitingMfa, { type: "MFA_FAILED", error, attemptsRemaining: 0 })).toEqual({
      status: "anonymous",
      error,
    });
  });

  it("replaces the challenge on resend, clearing the previous error", () => {
    const stale: AuthState = { status: "awaitingMfa", challenge, error: otpInvalid };
    const reissued: Challenge = { ...challenge, id: "chg_2", attemptsRemaining: OTP_MAX_ATTEMPTS };
    expect(authReducer(stale, { type: "CHALLENGE_REISSUED", challenge: reissued })).toEqual({
      status: "awaitingMfa",
      challenge: reissued,
    });
  });

  it("returns to anonymous on logout", () => {
    expect(authReducer(authenticated, { type: "LOGGED_OUT" })).toEqual(initialAuthState);
  });
});
