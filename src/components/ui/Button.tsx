import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

/**
 * Button styles, expressed as a typed variant API.
 *
 * The point of cva here is that call sites never write Tailwind classes. They
 * write `<Button variant="danger" size="sm">`, and TypeScript rejects a variant
 * that does not exist. The utility classes stay in this file, which is what
 * keeps them out of the forty feature components that use buttons.
 *
 * Note what is absent: any transition utility. Hover changes colour instantly.
 * That is a deliberate constraint from the design brief, and it is enforced by
 * simply never introducing a duration here.
 */
const button = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-sm border font-medium",
    "select-none whitespace-nowrap",
    // A disabled button in this application always means "busy" or "nothing to
    // submit yet". It never means "you lack permission", because permission is
    // expressed by not rendering the control at all. See DECISIONS.md 10.
    "disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        primary: [
          "border-royal bg-royal text-royal-ink",
          "not-disabled:hover:border-royal-hover not-disabled:hover:bg-royal-hover",
        ],
        secondary: [
          "border-rule bg-surface text-ink",
          "not-disabled:hover:border-rule-strong not-disabled:hover:bg-sunk",
        ],
        ghost: [
          "border-transparent bg-transparent text-muted",
          "not-disabled:hover:bg-sunk not-disabled:hover:text-ink",
        ],
        danger: [
          "border-danger bg-danger-soft text-danger",
          "not-disabled:hover:bg-danger not-disabled:hover:text-paper",
        ],
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
      },
      block: {
        true: "w-full",
        false: "",
      },
      /* Declared last so its classes land after the variant's in the generated
         string, which lets twMerge drop the conflicting colours rather than
         relying on stylesheet order.

         Unavailable is a flat token state rather than reduced opacity. Fading a
         saturated royal over off-white paper produces a washed lavender, which
         reads as a different colour rather than as the same button turned off,
         and undercuts the matte palette. */
      unavailable: {
        true: "border-rule bg-sunk text-gray",
        false: "",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
      block: false,
      unavailable: false,
    },
  },
);

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">,
    VariantProps<typeof button> {
  className?: string;
  /** Shows a spinner, disables interaction, and marks the control busy for
   *  assistive technology. */
  loading?: boolean;
  /** Label swapped in while loading. Naming the operation in progress
   *  ("Signing in") is more useful than a bare spinner. */
  loadingLabel?: string;
  children?: ReactNode;
}

export function Button({
  className,
  variant,
  size,
  block,
  loading = false,
  loadingLabel,
  disabled,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      // Defaulting to type="button" rather than inheriting the HTML default of
      // "submit" prevents an unrelated button inside a form from submitting it.
      // Forms opt in explicitly with type="submit".
      type={type}
      // A loading button is unclickable as well as disabled, so a double submit
      // cannot fire a second request while the first is in flight.
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      className={cn(
        button({
          variant,
          size,
          block,
          // Loading is deliberately excluded. A button mid-request keeps its
          // colour, because the operation is still live: the spinner carries
          // the "in progress" signal on its own. Only a genuinely inert control
          // goes flat.
          unavailable: disabled === true && !loading,
        }),
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
