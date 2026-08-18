import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "@/app/App";
import { AuthProvider } from "@/features/auth";
import "@/styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  // Thrown rather than silently returned. A missing mount point is a build or
  // template error, and failing loudly at startup is far easier to diagnose
  // than a blank page with a clean console.
  throw new Error('Mount failed: index.html is missing <div id="root">.');
}

// The mock runs in every mode, not just dev, because this exercise ships no
// backend and a built preview would otherwise have nothing to talk to. With a
// real API this call is deleted and nothing inside src/ changes.
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
