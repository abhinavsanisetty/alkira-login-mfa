import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
}

/**
 * A placeholder block shown while real content loads.
 *
 * It pulses opacity rather than sweeping a highlight across itself. The usual
 * shimmer effect needs a moving gradient, and gradients are out, so the flat
 * pulse is both the constraint-respecting choice and the calmer one.
 *
 * Skeletons are used instead of a single centred spinner because they preserve
 * the shape of the page. The table does not collapse and then jump back to full
 * height when data lands, which means no layout shift and no flicker.
 *
 * Marked aria-hidden: the loading state is announced once by the container's
 * aria-busy attribute. Without this, a screen reader reads out every individual
 * placeholder, which is noise.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse-flat rounded-sm bg-sunk", className)}
    />
  );
}

/** Convenience wrapper for a run of text lines, which is the most common shape.
 *  The last line is shortened so the block reads as a paragraph rather than a
 *  rectangle. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
