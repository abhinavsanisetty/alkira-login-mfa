import { useId } from "react";
import type { ReactNode, Ref } from "react";

import { Input, type InputProps } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

/** The one error style, shared by TextField and by any hand-wired field such as
 *  the connector rename. role="alert" announces it the moment it appears. */
export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="text-xs font-medium text-danger">
      {children}
    </p>
  );
}

export interface TextFieldProps extends Omit<InputProps, "invalid" | "id"> {
  label: string;
  /** Standing help text, unlike an error. */
  hint?: string;
  /** Its presence is what puts the field into its invalid state, so there is no
   *  separate `invalid` prop to keep in sync. */
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

/**
 * A labelled input. The accessibility wiring is the substance here: without
 * aria-invalid the error reaches only people who can see the red border, and
 * without aria-describedby the hint and error are orphaned text a screen reader
 * user has to go hunting for. ids come from useId so two forms cannot collide.
 */
export function TextField({ label, hint, error, className, ref, ...rest }: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  // Only reference ids that are actually rendered; pointing aria-describedby at
  // a missing element makes some screen readers drop the whole attribute.
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>

      <Input id={id} ref={ref} invalid={Boolean(error)} aria-describedby={describedBy} {...rest} />

      {hint && !error ? (
        <p id={hintId} className="text-xs text-gray">
          {hint}
        </p>
      ) : null}

      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
