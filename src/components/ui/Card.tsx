import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** A raised section. Separation is a one-step tonal lift plus a hairline: no
 *  shadow, no gradient, no hard divider. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-sm border border-rule bg-surface", className)}>{children}</div>;
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        "rounded-t-sm border-b border-rule bg-sunk px-4 py-3 text-ink",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
