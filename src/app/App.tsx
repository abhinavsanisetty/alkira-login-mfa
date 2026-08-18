import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import {
  LoginScreen,
  MfaScreen,
  RequireAnonymous,
  RequireAuth,
  RequireMfaPending,
  SignUpScreen,
} from "@/features/auth";
import { ConnectorsScreen } from "@/features/connectors";

/** The route tree reads as the security boundary: every protected screen is
 *  nested inside a guard, so protection cannot be forgotten. */
export function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route element={<RequireAnonymous />}>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignUpScreen />} />
        </Route>
        <Route element={<RequireMfaPending />}>
          <Route path="/mfa" element={<MfaScreen />} />
        </Route>
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/connectors" element={<ConnectorsScreen />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/connectors" replace />} />
    </Routes>
  );
}
