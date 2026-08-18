import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "@/app/App";
import { AuthProvider } from "@/features/auth";
import "@/styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  // Failing loudly beats a blank page with a clean console.
  throw new Error('Mount failed: index.html is missing <div id="root">.');
}

// Runs in every mode, not just dev: there is no backend, so a built preview
// would otherwise have nothing to talk to. With a real API this call is
// deleted and nothing else in src/ changes.
async function startMockApi() {
  const { worker } = await import("@/mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass", quiet: true });
}

startMockApi().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  );
});
