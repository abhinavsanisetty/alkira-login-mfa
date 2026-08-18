import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { resetMockState } from "@/mocks/handlers";
import { server } from "@/mocks/server";

// The same handlers serve the browser and the tests, so tests exercise the
// real fetch path rather than a stubbed service. onUnhandledRequest: "error"
// means an unmocked call fails loudly instead of hitting the network.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

// Without this, queries can match elements from an earlier test — failures
// that appear only when tests run together and pass in isolation.
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockState();
  sessionStorage.clear();
});

