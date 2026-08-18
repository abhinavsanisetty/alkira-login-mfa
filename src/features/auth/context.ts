import { createContext } from "react";

import type { LoginInput } from "@/lib/schemas";

import type { AuthState } from "./types";

export interface AuthContextValue {
  state: AuthState;
  /** A request is in flight. Kept out of AuthState: it is UI state, not a
   *  position in the auth machine. */
  pending: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  verify: (code: string) => Promise<void>;
  resend: () => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
