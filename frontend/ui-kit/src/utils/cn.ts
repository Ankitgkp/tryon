/**
 * Utility for merging class names.
 * Concatenates truthy values and trims whitespace.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
