import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { ReactNode } from "react";

import { ApiError, authApi } from "@/lib/api";
import type { ApiErrorCode } from "@/lib/api";
import { SESSION_STORAGE_KEY } from "@/lib/constants";
import { PERMISSIONS } from "@/lib/permissions";
import type { LoginInput } from "@/lib/schemas";

import { authReducer, initialAuthState } from "./authReducer";
import { AuthContext } from "./context";
import type { AuthError, AuthState, User } from "./types";

/** sessionStorage is synchronous, so correct state exists before first paint
 *  and there is no "initializing" variant to render around. */
function rehydrate(): AuthState {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return initialAuthState;
    const user = JSON.parse(raw) as User;
    const valid = Boolean(user?.id) && Boolean(user?.email) && user?.role in PERMISSIONS;
    return valid ? { status: "authenticated", user } : initialAuthState;
  } catch {
    return initialAuthState;
  }
}

/** Narrow the transport union back to the auth domain; anything this domain
 *  does not model becomes NETWORK. See lib/api.ts. */
const AUTH_CODES: ReadonlySet<ApiErrorCode> = new Set<ApiErrorCode>([
  "INVALID_CREDENTIALS",
  "OTP_INVALID",
  "OTP_EXPIRED",
  "TOO_MANY_ATTEMPTS",
  "RATE_LIMITED",
  "NETWORK",
]);

function toAuthError(error: unknown): AuthError {
  if (error instanceof ApiError && AUTH_CODES.has(error.detail.code)) {
    return { code: error.detail.code as AuthError["code"], message: error.detail.message };
  }
  return {
    code: "NETWORK",
    message: error instanceof ApiError ? error.detail.message : "Something went wrong. Try again.",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, undefined, rehydrate);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (state.status === "authenticated") {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state.user));
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [state]);

  const signIn = useCallback(async (input: LoginInput) => {
    setPending(true);
    try {
      dispatch({ type: "LOGIN_SUCCEEDED", challenge: await authApi.login(input) });
    } catch (error) {
      dispatch({ type: "LOGIN_FAILED", error: toAuthError(error) });
    } finally {
      setPending(false);
    }
  }, []);

  const challengeId = state.status === "awaitingMfa" ? state.challenge.id : null;

  const verify = useCallback(
    async (code: string) => {
      if (!challengeId) return;
      setPending(true);
      try {
        dispatch({ type: "MFA_SUCCEEDED", user: await authApi.verify(challengeId, code) });
      } catch (error) {
        dispatch({
          type: "MFA_FAILED",
          error: toAuthError(error),
          // No count means the challenge is gone, so destroy it rather than
          // leave a dead one on screen.
          attemptsRemaining: error instanceof ApiError ? (error.attemptsRemaining ?? 0) : 0,
        });
      } finally {
        setPending(false);
      }
    },
    [challengeId],
  );

  const resend = useCallback(async () => {
    if (!challengeId) return;
    setPending(true);
    try {
      dispatch({ type: "CHALLENGE_REISSUED", challenge: await authApi.resend(challengeId) });
    } catch (error) {
      dispatch({ type: "MFA_FAILED", error: toAuthError(error), attemptsRemaining: 0 });
    } finally {
      setPending(false);
    }
  }, [challengeId]);

  const signOut = useCallback(() => dispatch({ type: "LOGGED_OUT" }), []);

  const value = useMemo(
    () => ({ state, pending, signIn, verify, resend, signOut }),
    [state, pending, signIn, verify, resend, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
