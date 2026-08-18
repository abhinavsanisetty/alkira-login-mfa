import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Icon, type IconName } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

/**
 * Button styles, expressed as a typed variant API.
 *
 * The point of cva here is that call sites never write Tailwind classes. They
 * write `<Button variant="danger" size="sm">`, and TypeScript rejects a variant
 * that does not exist. The utility classes stay in this file, which is what
 * keeps them out of every feature component that uses buttons.
 *
 * Note what is absent: any transition or duration utility. Hover swaps the
 * colour on the same frame the pointer arrives, with nothing easing between the
 * two states. That constraint is enforced by never introducing a duration in
 * this file rather than by remembering not to.
 *
 * Set at weight 700 with a little tracking. Cormorant at 600 is too fine to
 * hold a solid royal ground at button size, and letting the label thin out on
 * the primary action is the fastest way to make a serif interface look
 * accidental rather than chosen.
 */
const button = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-sm border font-bold tracking-[0.01em]",
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
      /* Declared last so its classes land after the variant's in the generated
         string, which lets twMerge drop the conflicting colours rather than
         relying on stylesheet order.

         Unavailable is a flat token state rather than reduced opacity. Fading a
         saturated royal over off white produces a washed lavender, which reads
         as a different colour rather than as the same button turned off, and
         lands squarely in the pastel register the palette is meant to avoid. */
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
  /** Thin-line glyph set before the label. Decorative: the label carries the
   *  meaning, so this is never the only thing identifying the control. */
  icon?: IconName;
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
      {loading ? <Spinner /> : icon ? <Icon name={icon} /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
