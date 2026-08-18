import { Outlet } from "react-router-dom";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

/** Unauthenticated shell: plain paper, with the royal band arriving only once
 *  the session does (see AppLayout). The bar is taller and the wordmark larger
 *  than inside, because this screen carries the identity rather than navigation. */
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
