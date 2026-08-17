import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const alert = cva(
  ["flex gap-2.5 rounded-sm border px-3 py-2.5 text-sm"],
  {
    variants: {
      tone: {
        danger: "border-danger/40 bg-danger-soft text-danger",
        warn: "border-warn/40 bg-warn-soft text-warn",
        info: "border-royal/30 bg-royal-soft text-royal",
      },
    },
    defaultVariants: { tone: "danger" },
  },
);

export interface AlertProps extends VariantProps<typeof alert> {
  children: ReactNode;
  /** Optional bolded lead-in, for when the message has a headline and a detail. */
  title?: string;
  className?: string;
}

/**
 * A form-level or page-level message.
 *
 * Distinct from a field error by design. "Email or password is incorrect"
 * belongs above the form because it is not attributable to one input, whereas
 * "Enter a valid email address" belongs under the email field. Putting a
 * form-level failure under a field misdirects the user toward re-checking
 * something that may be fine.
 *
 * role="alert" gives it an assertive live region, so it is announced the moment
 * it appears. That is correct for a submission failure the user is waiting on,
 * and it is why this component should not be used for ambient or decorative
 * notes, which would interrupt for no reason.
 */
export function Alert({ tone, title, className, children }: AlertProps) {
  return (
    <div role="alert" className={cn(alert({ tone }), className)}>
      {/* Decorative rule that gives the block a left edge without a coloured
          background bar, which would read as a gradient-adjacent flourish. */}
      <span aria-hidden="true" className="mt-0.5 w-0.5 shrink-0 self-stretch bg-current opacity-45" />
      <div className="flex flex-col gap-0.5">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="text-ink">{children}</div>
      </div>
    </div>
  );
}
