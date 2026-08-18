/** The auth feature's public API. Everything else in this folder is private —
 *  enforced by the no-restricted-imports rule in .oxlintrc.json. */

export { AuthProvider } from "./AuthProvider";
export { useAuth, useCurrentUser } from "./useAuth";
export { RequireAnonymous, RequireAuth, RequireMfaPending } from "./guards";
export { LoginScreen } from "./screens/LoginScreen";
export { MfaScreen } from "./screens/MfaScreen";
export { SignUpScreen } from "./screens/SignUpScreen";
export type { AuthAction, AuthError, AuthErrorCode, AuthState, Challenge, User } from "./types";
