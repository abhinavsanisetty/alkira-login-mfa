import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";

/**
 * TEMPORARY: a specimen of the design system.
 *
 * This page exists to prove the token layer works in both themes before any
 * feature is built on top of it. It is replaced by the router in the next
 * commit, and should not survive into the final application.
 */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-rule pt-6">
      <h2 className="text-2xs font-semibold uppercase tracking-[0.14em] text-gray">{title}</h2>
      {children}
    </section>
  );
}

const SWATCHES = [
  ["paper", "bg-paper"],
  ["surface", "bg-surface"],
  ["sunk", "bg-sunk"],
  ["royal", "bg-royal"],
  ["royal-soft", "bg-royal-soft"],
  ["ok", "bg-ok"],
  ["warn", "bg-warn"],
  ["danger", "bg-danger"],
] as const;

export function App() {
  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <header className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl text-ink">Alkira Console</h1>
            <p className="text-md text-muted">
              Design system specimen. Cormorant for display, IBM Plex Sans for interface,
              IBM Plex Mono for data.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Section title="Type">
          <div className="flex flex-col gap-3">
            <p className="font-display text-3xl text-ink">Verify your identity</p>
            <p className="font-display text-xl text-ink">Cloud connectors</p>
            <p className="text-base text-ink">
              Interface text sits at fourteen pixels with a tight leading, which keeps a dense
              table legible without turning the page into a wall.
            </p>
            <p className="font-mono text-sm text-muted" data-numeric>
              482917 &middot; conn_a91f4c &middot; 2026-08-17 15:42:08
            </p>
          </div>
        </Section>

        <Section title="Palette">
          <div className="grid grid-cols-4 gap-3">
            {SWATCHES.map(([name, klass]) => (
              <div key={name} className="flex flex-col gap-1.5">
                <div className={`h-14 rounded-sm border border-rule ${klass}`} />
                <span className="font-mono text-2xs text-gray">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Sign in</Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="ghost">Resend code</Button>
            <Button variant="danger">Delete</Button>
            <Button variant="primary" loading loadingLabel="Signing in">
              Sign in
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </Section>

        <Section title="Fields">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Email"
              type="email"
              placeholder="you@company.com"
              defaultValue="a.ruiz@alkira.com"
            />
            <TextField
              label="Password"
              type="password"
              defaultValue="wrong"
              error="Incorrect password."
            />
            <TextField
              label="Verification code"
              font="mono"
              placeholder="000000"
              hint="Six digits, valid for five minutes."
            />
            <TextField label="Region" defaultValue="us-east-1" disabled />
          </div>
        </Section>

        <Section title="Status">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="ok" dot>
              Active
            </Badge>
            <Badge tone="warn" dot>
              Paused
            </Badge>
            <Badge tone="danger" dot>
              Error
            </Badge>
            <Badge tone="royal">Editor</Badge>
            <Badge tone="neutral">Viewer</Badge>
          </div>
        </Section>

        <Section title="Messages">
          <div className="flex flex-col gap-3">
            <Alert tone="danger">No account with that email.</Alert>
            <Alert tone="warn" title="Two attempts remaining">
              The code you entered is not correct.
            </Alert>
            <Alert tone="info">A new code has been sent. The previous one no longer works.</Alert>
          </div>
        </Section>

        <Section title="Loading">
          <div className="flex flex-col gap-3 rounded-sm border border-rule bg-surface p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="ml-auto h-5 w-16" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="ml-auto h-5 w-16" />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
