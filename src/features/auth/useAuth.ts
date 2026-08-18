import { useContext } from "react";

import { AuthContext, type AuthContextValue } from "./context";
import type { User } from "./types";

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside an AuthProvider");
  return value;
}

/** The authenticated user, or null. Screens behind RequireAuth can rely on it
 *  being present; everything else must handle null. */
export function useCurrentUser(): User | null {
  const { state } = useAuth();
  return state.status === "authenticated" ? state.user : null;
}
