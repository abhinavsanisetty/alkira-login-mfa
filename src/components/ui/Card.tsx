import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * A raised content section.
 *
 * The only separation devices in this interface are a one-step tonal lift from
 * the page ground and a hairline rule. No shadow, no gradient, no blur, and no
 * hard black divider anywhere. That is enough to read as a distinct layer,
 * because the surface tokens are spaced closely on purpose: the eye registers
 * the edge, not the contrast.
 *
 * Section headers can also run solid royal blue rather than off white, via the
 * `tone` prop on CardHeader. Both are flat fills; there is no third option and
 * nothing blends between them.
 */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-sm border border-rule bg-surface", className)}>{children}</div>
  );
}

export function CardHeader({
  tone = "paper",
  className,
  children,
}: {
  tone?: "paper" | "royal";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-t-sm border-b px-4 py-3",
        tone === "royal"
          ? "border-royal bg-royal text-royal-ink"
          : "border-rule bg-sunk text-ink",
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
