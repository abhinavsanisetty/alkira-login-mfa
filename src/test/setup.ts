import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

/**
 * Test environment setup, run once before every test file.
 */

// Unmount anything left behind by the previous test. Without this, queries in
// one test can match elements rendered by an earlier one, which produces
// failures that only appear when tests run together and pass in isolation.
afterEach(() => {
  cleanup();
});

beforeAll(() => {
  // jsdom does not implement matchMedia. The theme module calls it to resolve
  // the "system" choice, so without a stub every test that mounts a themed tree
  // throws. Reporting no dark-mode preference is the right default for tests:
  // it is deterministic and does not depend on the machine running them.
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  }
});
