import { Outlet } from "react-router-dom";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth, useCurrentUser } from "@/features/auth";

/** The role badge is not decoration. Actions the current role cannot perform are
 *  hidden, and hiding without stating the role reads as a bug rather than a
 *  policy. See DECISIONS.md §10. */
export function AppLayout() {
  const user = useCurrentUser();
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-6 py-3.5">
          <span className="font-display text-lg tracking-wide text-ink">Alkira</span>

          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <span className="hidden text-sm text-muted sm:inline">{user.name}</span>
                <Badge tone="royal">{user.role}</Badge>
              </div>
            ) : null}
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
