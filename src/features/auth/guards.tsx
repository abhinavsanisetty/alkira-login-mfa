import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./useAuth";

/**
 * Layout routes, so protection is structural: anything nested inside a guard is
 * protected by construction.
 *
 * These are UX, not security — a real API returns 401 regardless of what the
 * client renders. They also carry the routing between auth stages, which keeps
 * it out of the screens.
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

/** Requires a live challenge, so /mfa is not reachable by URL alone. */
export function RequireMfaPending() {
  const { state } = useAuth();
  const intended = useIntendedPath();

  if (state.status === "awaitingMfa") return <Outlet />;
  if (state.status === "authenticated") return <Navigate to={intended} replace />;
  return <Navigate to="/login" replace />;
}

/** Keeps a signed-in or mid-challenge user off login and sign-up, which is
 *  also what advances them to /mfa once the first factor passes. */
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
