import { Outlet } from "react-router-dom";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

/**
 * The unauthenticated shell.
 *
 * Deliberately plain off white, with the wordmark set in royal rather than the
 * header being filled with it. Crossing the second factor swaps this for the
 * solid royal band of AppLayout, so the palette itself marks the boundary: the
 * blue arrives when the session does.
 */
export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
          <span className="font-display text-xl font-semibold tracking-[0.02em] text-royal">
            Alkira
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 pt-10 pb-16">
        <Outlet />
      </main>
    </div>
  );
}
