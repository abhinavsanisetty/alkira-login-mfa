import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/**
 * A form-level or page-level message.
 *
 * Distinct from a field error by design. "Email or password is incorrect"
 * belongs above the form because it is not attributable to one input, whereas
 * "Enter a valid email address" belongs under the email field. Putting a
 * form-level failure under a field misdirects the user toward re-checking
 * something that may be fine.
 *
 * Marked by a solid left edge in the tone's own colour, which is the same
 * device the connector list uses for the selected row. One accent-on-the-left
 * idea, applied consistently, rather than a different treatment per component.
 *
 * role="alert" gives it an assertive live region, so it is announced the moment
 * it appears. That is correct for a submission failure the user is waiting on,
 * and it is why this component should not be used for ambient or decorative
 * notes, which would interrupt for no reason.
 */
const alert = cva(["flex gap-2.5 rounded-sm border border-l-2 px-3 py-2.5 text-sm"], {
  variants: {
    tone: {
      danger: "border-danger/35 border-l-danger bg-danger-soft",
      warn: "border-warn/35 border-l-warn bg-warn-soft",
      info: "border-royal-line border-l-royal bg-royal-soft",
    },
  },
  defaultVariants: { tone: "danger" },
});

const ICON_COLOR = {
  danger: "text-danger",
  warn: "text-warn",
  info: "text-royal",
} as const;

export interface AlertProps extends VariantProps<typeof alert> {
  children: ReactNode;
  /** Optional bolded lead-in, for when the message has a headline and a detail. */
  title?: string;
  className?: string;
}

export function Alert({ tone, title, className, children }: AlertProps) {
  return (
    <div role="alert" className={cn(alert({ tone }), className)}>
      <Icon name="alert" className={cn("mt-0.5", ICON_COLOR[tone ?? "danger"])} />
      <div className="flex flex-col gap-0.5">
        {title ? <p className="font-semibold text-ink">{title}</p> : null}
        <div className="text-ink">{children}</div>
      </div>
    </div>
  );
}
