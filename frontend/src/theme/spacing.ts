/**
 * Single source for spacing. Use in Tailwind and components.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export type Spacing = typeof spacing;
