import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** A status mark. Each tone pairs a *-soft ground with its matching solid as
 *  the text colour, so the two cannot drift apart. */
const badge = cva(
  [
    "inline-flex items-center gap-1.5",
    "rounded-sm border px-2 py-0.5",
    "text-2xs font-semibold uppercase tracking-[0.07em]",
    "whitespace-nowrap",
  ],
  {
    variants: {
      tone: {
        neutral: "border-rule bg-gray-soft text-gray",
        royal: "border-royal-line bg-royal-soft text-royal",
        ok: "border-ok/35 bg-ok-soft text-ok",
        warn: "border-warn/35 bg-warn-soft text-warn",
        danger: "border-danger/35 bg-danger-soft text-danger",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps extends VariantProps<typeof badge> {
  children: ReactNode;
  /** Square mark before the label, giving the eye something to scan for down a
   *  status column. Square, not round, so the badge contains no circle. */
  dot?: boolean;
  className?: string;
}

export function Badge({ tone, dot = false, className, children }: BadgeProps) {
  return (
    <span className={cn(badge({ tone }), className)}>
      {dot ? <span aria-hidden="true" className="size-1.5 rounded-[1px] bg-current" /> : null}
      {children}
    </span>
  );
}
