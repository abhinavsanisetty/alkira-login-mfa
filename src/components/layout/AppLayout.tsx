import { Outlet } from "react-router-dom";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuth, useCurrentUser } from "@/features/auth";

/**
 * The signed-in shell.
 *
 * The header is a solid royal fill, flat edge to edge, with no blend into the
 * page beneath it. This is where the accent stops being an accent: a band of
 * full-strength blue against off white is what gives the palette its weight,
 * and it does the navigational job of marking the protected side of the
 * application at a glance. The unauthenticated shell is plain off white for
 * exactly that contrast.
 *
 * The role badge is not decoration. Actions the current role cannot perform are
 * hidden, and hiding without stating the role reads as a bug rather than a
 * policy. See DECISIONS.md §10. Inside the royal band it is drawn as an outline
 * mark rather than a tinted badge, since a *-soft ground is built to sit on
 * paper and turns muddy on saturated blue.
 */
export function AppLayout() {
  const user = useCurrentUser();
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-band bg-band">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-6 py-3">
          <span className="font-display text-xl font-semibold tracking-[0.02em] text-band-ink">
            Alkira
          </span>

          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <Avatar
                  name={user.name}
                  className="border-band-ink/35 bg-band-line text-band-ink"
                />
                <div className="hidden leading-tight sm:block">
                  <p className="text-sm font-bold text-band-ink">{user.name}</p>
                  <p className="text-xs font-normal uppercase tracking-[0.08em] text-band-ink/70">
                    {user.role}
                  </p>
                </div>
              </div>
            ) : null}

            <span aria-hidden="true" className="h-6 w-px bg-band-ink/25" />

            <ThemeToggle tone="band" />

            <Button
              variant="ghost"
              size="sm"
              icon="exit"
              onClick={signOut}
              className="text-band-ink hover:bg-band-line hover:text-band-ink"
            >
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
