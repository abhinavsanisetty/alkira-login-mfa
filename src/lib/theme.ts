import { THEME_STORAGE_KEY } from "@/lib/constants";

/**
 * Theme handling.
 *
 * Two states, and the attribute on <html> is always one of them. There is no
 * "follow the operating system" option, which means the OS preference is never
 * consulted: `prefers-color-scheme` has no matching rule in styles/index.css.
 *
 * That is a deliberate trade. A three-way control is more respectful of the
 * user's system setting, but it makes the un-stamped state ambiguous, and an
 * ambiguous state is worse than an opinionated one here: with a two-way control
 * and an OS-aware default, a dark-OS visitor would see the dark palette while
 * the toggle sat on "Light". The control would be lying. Light is the default
 * instead, and it is stamped explicitly on first paint.
 */

export type ThemeChoice = "light" | "dark";

export const DEFAULT_THEME: ThemeChoice = "light";

function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "light" || value === "dark";
}

/** Read the stored choice. Falls back to light when nothing is stored, or when
 *  storage is unavailable, which it is in some private browsing modes. */
export function readStoredTheme(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeChoice(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Apply a choice to the document and remember it. */
export function applyTheme(choice: ThemeChoice): void {
  document.documentElement.setAttribute("data-theme", choice);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // A display preference that fails to persist is not worth surfacing to the
    // user. The current page still respects the choice.
  }
}
