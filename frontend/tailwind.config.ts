import type { Config } from "tailwindcss";
import { colors } from "./src/theme/colors";
import { spacing } from "./src/theme/spacing";
import { layout } from "./src/theme/layout";
import { fonts } from "./src/theme/fonts";
import { radius } from "./src/theme/radius";
import { zIndex } from "./src/theme/zindex";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layout/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        success: colors.success,
        danger: colors.danger,
        warning: colors.warning,
        background: colors.background,
        card: colors.card,
        "text-primary": colors.textPrimary,
        "text-secondary": colors.textSecondary,
        border: colors.border,
        muted: colors.muted,
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        sans: [fonts.primary, "system-ui", "sans-serif"],
        secondary: [fonts.secondary, "sans-serif"],
      },
      spacing: {
        xs: `${spacing.xs}px`,
        sm: `${spacing.sm}px`,
        md: `${spacing.md}px`,
        lg: `${spacing.lg}px`,
        xl: `${spacing.xl}px`,
      },
      borderRadius: {
        sm: radius.sm,
        md: radius.md,
        lg: radius.lg,
        xl: radius.xl,
      },
      maxWidth: {
        content: `${layout.contentMaxWidth}px`,
      },
      width: {
        sidebar: `${layout.sidebarWidth}px`,
      },
      minHeight: {
        header: `${layout.headerHeight}px`,
      },
      zIndex: {
        dropdown: String(zIndex.dropdown),
        sticky: String(zIndex.sticky),
        overlay: String(zIndex.overlay),
        modal: String(zIndex.modal),
        toast: String(zIndex.toast),
      },
    },
  },
  plugins: [],
};

export default config;
