import { cn } from "@/lib/cn";

interface SpinnerProps {
  className?: string;
  /** Accessible description. Omit when the spinner sits inside an element that
   *  already announces its busy state, such as a loading button, to avoid the
   *  screen reader saying the same thing twice. */
  label?: string;
}

/**
 * An indeterminate loading indicator.
 *
 * Rendered as a stroked arc rather than a ring of dots or a gradient sweep: a
 * gradient would break the matte rule, and this reads as a drawn mark, which
 * suits the rest of the type and line work.
 *
 * Under prefers-reduced-motion the rotation stops but the arc stays visible, so
 * the fact that something is in progress is still communicated.
 */
export function Spinner({ className, label }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-4 animate-spin-flat", className)}
      role={label ? "status" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      fill="none"
    >
      {/* Full ring at low opacity gives the arc a track to travel along, so the
          shape stays legible against any surface. */}
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.6" opacity="0.25" />
      <path
        d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
