import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names, letting later classes win over earlier ones.
 *
 * Two problems, one helper:
 *
 *   clsx        resolves conditionals and arrays into a flat string.
 *   twMerge     resolves *conflicts* within that string.
 *
 * The second is the one that matters. Tailwind classes are all single-class
 * specificity, so `class="px-4 px-2"` is decided by stylesheet order rather than
 * by the order they were written, which means a caller passing `px-2` to a
 * component that already sets `px-4` gets an unpredictable result. twMerge knows
 * `px-4` and `px-2` belong to the same group and keeps only the last, so an
 * override from a call site behaves the way the author expected.
 *
 * Every component in components/ui accepts a className and funnels it through
 * here, which is what makes those components extensible without any of them
 * needing to anticipate how they might be adjusted.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
