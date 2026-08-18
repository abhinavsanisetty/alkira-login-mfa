import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/**
 * A form-level message, distinct from a field error: "Incorrect password"
 * belongs above the form because no single input is at fault, while "Enter a
 * valid email address" belongs under the field.
 *
 * role="alert" is an assertive live region, so this must not be used for
 * ambient notes — it would interrupt for no reason.
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
