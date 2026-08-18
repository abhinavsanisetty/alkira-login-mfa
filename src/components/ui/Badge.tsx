import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * A small status mark: tinted ground, darker text of the same hue, and the same
 * 3px corner as every other element.
 *
 * Explicitly not a pill. A fully rounded badge reads as a tag you can dismiss,
 * and it would be the one shape in the interface that breaks the shared radius.
 * The only round things here are avatars, which are round because they stand for
 * people.
 *
 * Each tone pairs a *-soft ground with its matching solid as the text colour, so
 * the two always come from the same hue and the pairing cannot drift. Set in
 * Plex Sans: a badge is a label, and at this size the sans is the only face
 * that stays crisp.
 */
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
  /** Draws a small square mark before the label. Used for connector status,
   *  where it gives the eye a shape to scan for down a column instead of
   *  forcing it to read every word. Square, not a dot, so the badge has no
   *  circle in it. */
  dot?: boolean;
  className?: string;
}

export function Badge({ tone, dot = false, className, children }: BadgeProps) {
  return (
    <span className={cn(badge({ tone }), className)}>
      {dot ? (
        // Purely decorative. The label beside it already carries the meaning,
        // so this is hidden rather than announced twice.
        <span aria-hidden="true" className="size-1.5 rounded-[1px] bg-current" />
      ) : null}
      {children}
    </span>
  );
}
