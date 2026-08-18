import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes, letting later ones win.
 *
 * twMerge is the part that matters: Tailwind classes all have single-class
 * specificity, so `"px-4 px-2"` is resolved by stylesheet order rather than by
 * the order written. twMerge knows the two belong to the same group and keeps
 * the last, which is what makes a className override from a call site behave
 * the way its author expected.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
