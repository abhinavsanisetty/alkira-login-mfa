import { cva, type VariantProps } from "class-variance-authority";
import type { InputHTMLAttributes, Ref } from "react";

import { cn } from "@/lib/cn";

const input = cva(
  [
    "w-full rounded-sm border bg-surface px-3 text-ink",
    "placeholder:text-gray",
    "disabled:cursor-not-allowed disabled:bg-sunk disabled:text-gray",
    // Browsers apply their own yellow autofill background, which destroys the
    // matte palette. Repainting it from a token keeps autofilled fields looking
    // like the rest of the form.
    "autofill:shadow-[inset_0_0_0_1000px_var(--surface)] autofill:[-webkit-text-fill-color:var(--ink)]",
  ],
  {
    variants: {
      invalid: {
        // The border alone is not the error signal. It is reinforced by the
        // message under the field and by aria-invalid, because colour is not
        // available to every user.
        true: "border-danger",
        false: "border-rule focus:border-royal",
      },
      size: {
        sm: "h-8 text-sm",
        md: "h-10 text-base",
      },
      font: {
        sans: "font-sans",
        // Used for codes and identifiers, where fixed-width digits stop the
        // field from reflowing as the user types.
        mono: "font-mono tracking-wide",
      },
    },
    defaultVariants: { invalid: false, size: "md", font: "sans" },
  },
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size">,
    VariantProps<typeof input> {
  className?: string;
  ref?: Ref<HTMLInputElement>;
}

/**
 * A styled text input and nothing else.
 *
 * It has no opinion about labels, errors, or layout. Those belong to TextField,
 * which composes this. Keeping them separate means the OTP field and any future
 * custom control can reuse the input styling without inheriting a label
 * structure that does not fit.
 */
export function Input({ className, invalid, size, font, ref, ...rest }: InputProps) {
  return (
    <input
      ref={ref}
      // Mirrors the visual invalid state into the accessibility tree. Without
      // this a screen reader user gets no indication that the field is in
      // error, since they cannot see the border colour.
      aria-invalid={invalid === true || undefined}
      className={cn(input({ invalid, size, font }), className)}
      {...rest}
    />
  );
}
