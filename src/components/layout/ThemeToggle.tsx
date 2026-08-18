import { useState } from "react";

import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { applyTheme, readStoredTheme, type ThemeChoice } from "@/lib/theme";

const OPTIONS: ReadonlyArray<{ value: ThemeChoice; label: string; icon: IconName }> = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
];

/** Two dimensions of styling (which surface, which state) as a lookup rather
 *  than nested ternaries. */
const SEGMENT = {
  band: {
    frame: "border-band-ink/30 bg-band-line",
    active: "bg-band-ink text-band",
    idle: "text-band-ink/65 hover:text-band-ink",
    ring: "has-[:focus-visible]:outline-band-ink",
  },
  paper: {
    frame: "border-rule bg-surface",
    active: "bg-royal text-royal-ink",
    idle: "text-gray hover:text-ink",
    ring: "has-[:focus-visible]:outline-royal",
  },
} as const;

/**
 * Light and dark, with no "follow the system" option — see lib/theme.ts for why.
 *
 * Radio inputs rather than buttons, which gives arrow-key navigation and a
 * single tab stop for the group for free. Initialised from storage with a lazy
 * initialiser rather than an effect: index.html already stamped the attribute
 * before first paint, so an effect would re-apply the correct value a frame late.
 */
export function ThemeToggle({ tone = "paper" }: { tone?: keyof typeof SEGMENT }) {
  const [choice, setChoice] = useState<ThemeChoice>(readStoredTheme);
  const style = SEGMENT[tone];

  return (
    <fieldset className={cn("flex items-center rounded-sm border p-0.5", style.frame)}>
      <legend className="sr-only">Colour theme</legend>
      {OPTIONS.map((option) => {
        const active = choice === option.value;
        return (
          <label
            key={option.value}
            title={option.label}
            className={cn(
              "cursor-pointer rounded-sm p-1.5",
              active ? style.active : style.idle,
              // Drawn on the label because the input is visually hidden, and an
              // invisible element cannot show a ring.
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
              style.ring,
            )}
          >
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={active}
              onChange={() => {
                setChoice(option.value);
                applyTheme(option.value);
              }}
              className="sr-only"
            />
            <Icon name={option.icon} className="size-3.5" />
            <span className="sr-only">{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
