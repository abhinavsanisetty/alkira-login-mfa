import { useId } from "react";
import type { ReactNode, Ref } from "react";

import { Input, type InputProps } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

export interface TextFieldProps extends Omit<InputProps, "invalid" | "id"> {
  label: string;
  /** Standing help text. Always present, unlike an error. */
  hint?: string;
  /** Validation message. Its presence is what puts the field into its invalid
   *  state, so there is no separate `invalid` prop to keep in sync. */
  error?: string;
  /** Rendered to the right of the label. Used for things like "Forgot?" links. */
  action?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

/**
 * A labelled text input with hint and error handling.
 *
 * The accessibility wiring is the substance of this component, and it is worth
 * being explicit about what each piece does, because getting any of it wrong
 * produces a form that looks correct and is unusable with a screen reader:
 *
 *   htmlFor / id       Clicking the label focuses the input, and the label is
 *                      announced when the input receives focus.
 *   aria-invalid       Communicates the error state to assistive technology.
 *                      The red border only communicates it to people who can
 *                      see colour.
 *   aria-describedby   Points at the hint and the error so both are read out
 *                      as part of the field, rather than being orphaned text
 *                      that a screen reader user has to go hunting for.
 *   role="alert"       Makes a newly appearing error announce itself, rather
 *                      than waiting for the user to navigate back to the field.
 *
 * ids come from useId rather than from the field name, so two forms on one page
 * cannot collide.
 */
export function TextField({
  label,
  hint,
  error,
  action,
  className,
  ref,
  ...rest
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  // Only reference ids that are actually rendered. Pointing aria-describedby at
  // a missing element makes some screen readers skip the whole attribute.
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {action}
      </div>

      <Input id={id} ref={ref} invalid={Boolean(error)} aria-describedby={describedBy} {...rest} />

      {hint && !error ? (
        <p id={hintId} className="text-xs text-gray">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
