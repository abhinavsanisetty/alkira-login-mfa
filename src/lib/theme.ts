import { THEME_STORAGE_KEY } from "@/lib/constants";

/**
 * Theme handling.
 *
 * Three states, not two. "system" is the default and stamps no attribute at
 * all, which leaves the prefers-color-scheme media query in charge. Choosing
 * light or dark stamps data-theme on <html>, and that attribute beats the media
 * query in the cascade. See styles/index.css for the matching selectors.
 */

export type ThemeChoice = "light" | "dark" | "system";

function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "light" || value === "dark" || value === "system";
}

/** Read the stored choice. Falls back to "system" when nothing is stored, or
 *  when storage is unavailable, which it is in some private browsing modes. */
export function readStoredTheme(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeChoice(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

/** Apply a choice to the document and remember it.
 *
 *  "system" removes the attribute rather than writing a value, because the
 *  absence of the attribute is what hands control back to the OS. Writing
 *  data-theme="system" would match neither selector and leave the page stuck on
 *  the light palette. */
export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;

  if (choice === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", choice);
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // A display preference that fails to persist is not worth surfacing to the
    // user. The current page still respects the choice.
  }
}

/** What the user is actually looking at right now, which is not the same as
 *  what they chose: "system" resolves to whichever palette the OS is asking
 *  for. Used to label the toggle. */
export function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  if (choice !== "system") return choice;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
