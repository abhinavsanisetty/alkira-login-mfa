import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/**
 * Circular initial avatars, and a stacked cluster for showing several people at
 * once.
 *
 * Circles are the one deliberate exception to the 3px radius rule that governs
 * every other element. That is not an inconsistency: a rounded square reads as
 * a card or a thumbnail, whereas a circle is the established shape for a person,
 * and the distinction is doing real work in the connector list where avatars sit
 * inches from status badges.
 *
 * Initials rather than photographs, because there are no photographs. Deriving
 * the mark from the name keeps it stable across renders and avoids shipping a
 * placeholder image that would only ever be a grey silhouette.
 */

function initials(name: string, letters: 1 | 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  if (letters === 1) return first.toUpperCase();
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

const SIZE = {
  sm: "size-6 text-xs",
  md: "size-8 text-sm",
} as const;

interface AvatarProps {
  name: string;
  size?: keyof typeof SIZE;
  /** Draws the thin light rim that separates one avatar from the one beneath it
   *  in a stack. Off by default, since a lone avatar has nothing to separate
   *  from. */
  ringed?: boolean;
  /** One initial inside a stack, two when the avatar stands alone. Overlapping
   *  circles only leave about half of each one visible, and two letters in that
   *  sliver read as a smudge rather than as a person. */
  letters?: 1 | 2;
  className?: string;
}

export function Avatar({
  name,
  size = "sm",
  ringed = false,
  letters = 2,
  className,
}: AvatarProps) {
  return (
    <span
      // The name is already rendered as text everywhere an avatar appears, so
      // announcing it again would be a duplicate. title still gives sighted
      // users the full name behind a two-letter mark.
      aria-hidden="true"
      title={name}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "bg-royal-soft text-2xs font-semibold text-royal",
        "border border-royal-line",
        ringed && "ring-2 ring-surface",
        SIZE[size],
        className,
      )}
    >
      {initials(name, letters)}
    </span>
  );
}

interface AvatarStackProps {
  names: readonly string[];
  /** Beyond this, the remainder collapses into a +N mark rather than running
   *  off the edge of the column. */
  max?: number;
  /** Renders a trailing add control in the same circular style. Omitted when
   *  the current role has no business adding anyone. */
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
}

export function AvatarStack({
  names,
  max = 3,
  onAdd,
  addLabel = "Add owner",
  className,
}: AvatarStackProps) {
  const shown = names.slice(0, max);
  const overflow = names.length - shown.length;

  return (
    // The negative margin is what produces the overlap. Each avatar carries a
    // surface-coloured ring, so the rim reads as a gap between neighbours rather
    // than as a border on each one.
    <div className={cn("flex items-center", className)}>
      <span className="sr-only">
        {names.length === 1 ? "Owner" : "Owners"}: {names.join(", ")}
      </span>

      <div aria-hidden="true" className="flex items-center -space-x-1.5">
        {shown.map((name) => (
          <Avatar key={name} name={name} ringed letters={1} />
        ))}

        {overflow > 0 ? (
          <span
            title={names.slice(max).join(", ")}
            className={cn(
              "inline-flex items-center justify-center rounded-full",
              "border border-rule bg-gray-soft text-2xs font-semibold text-gray ring-2 ring-surface",
              SIZE.sm,
            )}
          >
            +{overflow}
          </span>
        ) : null}
      </div>

      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          aria-label={addLabel}
          className={cn(
            "ml-2 inline-flex items-center justify-center rounded-full",
            "border border-dashed border-rule-strong text-gray",
            "hover:border-royal hover:text-royal",
            SIZE.sm,
          )}
        >
          <Icon name="plus" className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
