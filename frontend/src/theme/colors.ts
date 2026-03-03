/**
 * Single source for colors. No random hex in components.
 */

export const colors = {
  primary: "#3B82F6",
  secondary: "#6366F1",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  background: "#F8FAFC",
  card: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  muted: "#F3F4F6",
} as const;

export type Colors = typeof colors;
