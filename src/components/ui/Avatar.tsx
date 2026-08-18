import { cn } from "@/lib/cn";

/**
 * Circular initial avatars, and an overlapping cluster for several people.
 *
 * Circles are the one exception to the 3px radius everything else shares: a
 * rounded square reads as a thumbnail, a circle reads as a person, and the two
 * sit inches apart in the connector list.
 */

const CIRCLE = "inline-flex size-6 items-center justify-center rounded-full text-2xs font-semibold";

function initials(name: string, letters: 1 | 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  if (letters === 1) return first.toUpperCase();
  return (first + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

interface AvatarProps {
  name: string;
  /** Rim that separates one avatar from the one beneath it in a stack. */
  ringed?: boolean;
  /** One initial inside a stack, two when alone: overlapping circles leave
   *  about half of each visible, and two letters in that sliver read as a
   *  smudge. */
  letters?: 1 | 2;
  className?: string;
}

export function Avatar({ name, ringed = false, letters = 2, className }: AvatarProps) {
  return (
    <span
      // The name is rendered as text wherever an avatar appears, so announcing
      // it again would duplicate it. title still expands the initials visually.
      aria-hidden="true"
      title={name}
      className={cn(
        CIRCLE,
        "border border-royal-line bg-royal-soft text-royal",
        ringed && "ring-2 ring-surface",
        className,
      )}
    >
      {initials(name, letters)}
    </span>
  );
}

export function AvatarStack({
  names,
  max = 3,
  className,
}: {
  names: readonly string[];
  /** Beyond this the remainder collapses into a +N mark rather than running off
   *  the edge of the column. */
  max?: number;
  className?: string;
}) {
  const shown = names.slice(0, max);
  const overflow = names.length - shown.length;

  return (
    <div className={cn("flex items-center", className)}>
      <span className="sr-only">
        {names.length === 1 ? "Owner" : "Owners"}: {names.join(", ")}
      </span>

      {/* The negative margin produces the overlap; each avatar's surface-coloured
          ring reads as the gap between neighbours. */}
      <div aria-hidden="true" className="flex items-center -space-x-1.5">
        {shown.map((name) => (
          <Avatar key={name} name={name} ringed letters={1} />
        ))}
        {overflow > 0 ? (
          <span
            title={names.slice(max).join(", ")}
            className={cn(CIRCLE, "border border-rule bg-gray-soft text-gray ring-2 ring-surface")}
          >
            +{overflow}
          </span>
        ) : null}
      </div>
    </div>
  );
}
