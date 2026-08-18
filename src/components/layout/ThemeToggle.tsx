import { useState } from "react";

import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { applyTheme, readStoredTheme, type ThemeChoice } from "@/lib/theme";

const OPTIONS: ReadonlyArray<{ value: ThemeChoice; label: string; icon: IconName }> = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
];

/**
 * A two-way theme control.
 *
 * Light and dark, with no "follow the system" option. That choice is made in
 * lib/theme.ts and the reasoning lives there; what matters here is that the
 * control can always show the truth, because the document is always stamped
 * with one of exactly these two values.
 *
 * Initialised from storage with a lazy useState initialiser rather than an
 * effect. The attribute has already been stamped on <html> by the inline script
 * in index.html, so an effect here would only re-apply what is already correct,
 * one frame late.
 *
 * Built from radio inputs rather than buttons, which gives arrow-key navigation
 * between the options and a single tab stop for the whole group for free.
 *
 * The selected segment takes a solid fill rather than the left accent border
 * used for selected rows elsewhere. A left edge is a list device: it works
 * because rows stack vertically and the marks line up into a column. On two
 * segments sitting side by side it would land between them and read as a
 * divider rather than as a mark on one of them.
 */
export function ThemeToggle({ tone = "paper" }: { tone?: "paper" | "band" }) {
  const [choice, setChoice] = useState<ThemeChoice>(readStoredTheme);

  function select(next: ThemeChoice) {
    setChoice(next);
    applyTheme(next);
  }

  const onBand = tone === "band";

  return (
    <fieldset
      className={cn(
        "flex items-center rounded-sm border p-0.5",
        onBand ? "border-band-ink/30 bg-band-line" : "border-rule bg-surface",
      )}
    >
      <legend className="sr-only">Colour theme</legend>
      {OPTIONS.map((option) => {
        const active = choice === option.value;
        return (
          <label
            key={option.value}
            title={option.label}
            className={cn(
              "cursor-pointer rounded-sm p-1.5",
              onBand
                ? active
                  ? "bg-band-ink text-band"
                  : "text-band-ink/65 hover:text-band-ink"
                : active
                  ? "bg-royal text-royal-ink"
                  : "text-gray hover:text-ink",
              // The focus ring is drawn on the label because the input itself is
              // visually hidden, and an invisible element cannot show a ring.
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
              onBand ? "has-[:focus-visible]:outline-band-ink" : "has-[:focus-visible]:outline-royal",
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
            <Icon name={option.icon} className="size-3.5" />
            <span className="sr-only">{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
