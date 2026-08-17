import { useState } from "react";

import { cn } from "@/lib/cn";
import { applyTheme, readStoredTheme, type ThemeChoice } from "@/lib/theme";

const OPTIONS: ReadonlyArray<{ value: ThemeChoice; label: string }> = [
  { value: "light", label: "Light" },
  { value: "system", label: "Auto" },
  { value: "dark", label: "Dark" },
];

/**
 * A three-way theme control.
 *
 * Three options rather than a two-state switch, because "follow the operating
 * system" is a real preference and not the same as either fixed choice. A
 * binary toggle has to pick one of them as its resting state, which silently
 * overrides the user's system setting the first time they touch it.
 *
 * Initialised from storage with a lazy useState initialiser rather than an
 * effect. The attribute has already been stamped on <html> by the inline script
 * in index.html, so an effect here would only re-apply what is already correct,
 * one frame late.
 *
 * Built from radio inputs rather than buttons, which gives arrow-key navigation
 * between the options and a single tab stop for the whole group for free.
 */
export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(readStoredTheme);

  function select(next: ThemeChoice) {
    setChoice(next);
    applyTheme(next);
  }

  return (
    <fieldset className="flex items-center rounded-sm border border-rule bg-surface p-0.5">
      <legend className="sr-only">Colour theme</legend>
      {OPTIONS.map((option) => {
        const active = choice === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "cursor-pointer rounded-sm px-2.5 py-1 text-xs font-medium",
              active ? "bg-royal-soft text-royal" : "text-gray hover:text-ink",
              // The focus ring is drawn on the label because the input itself is
              // visually hidden, and an invisible element cannot show a ring.
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-royal",
            )}
          >
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={active}
              onChange={() => select(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </fieldset>
  );
}
