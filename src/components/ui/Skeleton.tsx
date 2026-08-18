import { cn } from "@/lib/cn";

/**
 * A placeholder shown while content loads. Pulses opacity rather than sweeping
 * a highlight, because a shimmer needs a gradient and gradients are out.
 *
 * aria-hidden because the container's aria-busy already announces the loading
 * state; without it a screen reader reads out every placeholder.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse-flat rounded-sm bg-sunk", className)} />;
}
