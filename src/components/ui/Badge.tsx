import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const badge = cva(
  [
    "inline-flex items-center gap-1.5",
    "rounded-sm border px-2 py-0.5",
    "text-2xs font-medium uppercase tracking-[0.07em]",
    "whitespace-nowrap",
  ],
  {
    variants: {
      tone: {
        neutral: "border-rule bg-sunk text-muted",
        royal: "border-royal/35 bg-royal-soft text-royal",
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
  /** Draws a small filled dot before the label. Used for connector status,
   *  where the dot gives a shape to scan for down a column rather than forcing
   *  the eye to read every word. */
  dot?: boolean;
  className?: string;
}

export function Badge({ tone, dot = false, className, children }: BadgeProps) {
  return (
    <span className={cn(badge({ tone }), className)}>
      {dot ? (
        // Purely decorative. The label beside it already carries the meaning,
        // so this is hidden rather than announced twice.
        <span aria-hidden="true" className="size-1.5 rounded-sm bg-current" />
      ) : null}
      {children}
    </span>
  );
}
