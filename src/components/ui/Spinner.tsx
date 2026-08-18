import { cn } from "@/lib/cn";

/**
 * Indeterminate loading mark, drawn as a stroked arc: a gradient sweep would
 * break the matte rule. Decorative, since every caller already sets aria-busy.
 * Under prefers-reduced-motion the rotation stops but the arc stays visible.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-4 animate-spin-flat", className)}
      aria-hidden="true"
      fill="none"
    >
      {/* Full ring at low opacity gives the arc a track, so the shape stays
          legible on any surface. */}
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.6" opacity="0.25" />
      <path d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
