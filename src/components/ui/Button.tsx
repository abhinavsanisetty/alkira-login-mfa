import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Icon, type IconName } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

/**
 * Button styles as a typed variant API: call sites write `variant="danger"`,
 * not Tailwind classes, and TypeScript rejects a variant that does not exist.
 *
 * Note what is absent: any transition or duration utility. Hover swaps colour
 * on the frame the pointer arrives. The constraint holds because there is no
 * duration in this file to copy.
 */
const button = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-sm border font-semibold",
    "select-none whitespace-nowrap",
    // Disabled here always means "busy" or "nothing to submit yet", never
    // "you lack permission" — that is expressed by not rendering the control
    // at all.
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
          "border-danger/45 bg-danger-soft text-danger",
          "not-disabled:hover:border-danger not-disabled:hover:bg-danger not-disabled:hover:text-paper",
        ],
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-11 px-5 text-base",
      },
      block: {
        true: "w-full",
        false: "",
      },
      /* Declared last so twMerge resolves the colour conflict in its favour.
         A flat token rather than reduced opacity: fading royal over off white
         gives a washed lavender that reads as a different colour, not as the
         same button turned off. */
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
  /** Decorative glyph before the label, which always carries the meaning. */
  icon?: IconName;
  loading?: boolean;
  /** Swapped in while loading: "Signing in" beats a bare spinner. */
  loadingLabel?: string;
  children?: ReactNode;
}

export function Button({
  className,
  variant,
  size,
  block,
  icon,
  loading = false,
  loadingLabel,
  disabled,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      // Defaults to "button", not the HTML default of "submit", so an
      // unrelated button inside a form cannot submit it.
      type={type}
      // Unclickable while loading, so a double submit cannot fire a second
      // request while the first is in flight.
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      className={cn(
        button({
          variant,
          size,
          block,
          // A button mid-request keeps its colour: the operation is live and
          // the spinner already says so. Only an inert control goes flat.
          unavailable: disabled === true && !loading,
        }),
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : icon ? <Icon name={icon} /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
