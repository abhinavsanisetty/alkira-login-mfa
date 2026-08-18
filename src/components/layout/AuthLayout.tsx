import { Outlet } from "react-router-dom";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="flex items-center justify-between px-6 py-5">
        <span className="font-display text-lg tracking-wide text-ink">Alkira</span>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-start justify-center px-6 pt-6 pb-16">
        <Outlet />
      </main>
    </div>
  );
}
