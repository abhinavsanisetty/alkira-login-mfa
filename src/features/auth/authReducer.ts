import type { AuthAction, AuthState } from "./types";

export const initialAuthState: AuthState = { status: "anonymous" };

/**
 * Every transition is guarded on the current status; an illegal move returns the
 * state untouched. The one that matters: `authenticated` is produced in exactly
 * one place, and only from `awaitingMfa`. There is no code path that skips the
 * second factor.
 *
 * Pure, so the whole machine is testable without React.
 */
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_SUCCEEDED":
      return state.status === "anonymous"
        ? { status: "awaitingMfa", challenge: action.challenge }
        : state;

    case "LOGIN_FAILED":
      return state.status === "anonymous"
        ? { status: "anonymous", error: action.error }
        : state;

    case "CHALLENGE_REISSUED":
      return state.status === "awaitingMfa"
        ? { status: "awaitingMfa", challenge: action.challenge }
        : state;

    case "MFA_SUCCEEDED":
      return state.status === "awaitingMfa"
        ? { status: "authenticated", user: action.user }
        : state;

    case "MFA_FAILED":
      if (state.status !== "awaitingMfa") return state;
      // Attempts exhausted destroys the challenge rather than leaving a dead one
      // on screen, which is why this returns to anonymous carrying the reason.
      return action.attemptsRemaining > 0
        ? {
            status: "awaitingMfa",
            challenge: { ...state.challenge, attemptsRemaining: action.attemptsRemaining },
            error: action.error,
          }
        : { status: "anonymous", error: action.error };

    case "LOGGED_OUT":
      return initialAuthState;
  }
}
