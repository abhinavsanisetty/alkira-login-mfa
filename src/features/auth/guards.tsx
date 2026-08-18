import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./useAuth";

/**
 * Guards are layout routes, so protection is structural: anything nested inside
 * one is protected by construction and cannot be forgotten. See DECISIONS.md §11.
 *
 * These are UX, not security. A real API returns 401 regardless of what the
 * client renders. They also carry the routing between auth stages, which keeps
 * that logic out of the screens.
 */

function useIntendedPath(): string {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return from && from !== "/login" ? from : "/connectors";
}

export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === "authenticated") return <Outlet />;
  return <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

/** Requires a live challenge, so /mfa cannot be reached without first passing
 *  password verification. Without this the second factor is skippable by URL. */
export function RequireMfaPending() {
  const { state } = useAuth();
  const intended = useIntendedPath();

  if (state.status === "awaitingMfa") return <Outlet />;
  if (state.status === "authenticated") return <Navigate to={intended} replace />;
  return <Navigate to="/login" replace />;
}

/** Keeps a signed-in or mid-challenge user off the login and sign-up screens,
 *  which is also what advances them to /mfa once the first factor passes. */
export function RequireAnonymous() {
  const { state } = useAuth();
  const location = useLocation();
  const intended = useIntendedPath();

  if (state.status === "awaitingMfa") {
    return <Navigate to="/mfa" replace state={location.state} />;
  }
  if (state.status === "authenticated") return <Navigate to={intended} replace />;
  return <Outlet />;
}
