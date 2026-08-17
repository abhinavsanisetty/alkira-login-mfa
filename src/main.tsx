import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import "@/styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  // Thrown rather than silently returned. A missing mount point is a build or
  // template error, and failing loudly at startup is far easier to diagnose
  // than a blank page with a clean console.
  throw new Error('Mount failed: index.html is missing <div id="root">.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
