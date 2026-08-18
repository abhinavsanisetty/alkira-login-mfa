import { Outlet } from "react-router-dom";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

/**
 * The unauthenticated shell.
 *
 * Deliberately plain off white, with the wordmark set in royal rather than the
 * bar being filled with it. Crossing the second factor swaps this for the solid
 * band of AppLayout, so the palette itself marks the boundary: the blue arrives
 * when the session does.
 *
 * The bar is taller here than in the signed-in shell and the wordmark is set
 * larger, because this is the first screen anyone sees and it is carrying the
 * identity rather than navigation. Once you are inside, the header is a tool
 * strip and gets out of the way.
 *
 * Height is set explicitly rather than left to padding plus whatever the tallest
 * child happens to be, so the bar keeps its proportion if the wordmark or the
 * toggle changes size later.
 */
export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex h-[68px] w-full max-w-5xl items-center justify-between px-6">
          <span className="font-display text-3xl font-semibold tracking-[0.01em] text-royal">
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
