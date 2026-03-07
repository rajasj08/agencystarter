/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        docs: {
          bg: "#f8fafc",
          card: "#ffffff",
          border: "#e2e8f0",
          "border-subtle": "#f1f5f9",
          text: "#0f172a",
          "text-secondary": "#475569",
          "text-muted": "#64748b",
          accent: "#3b82f6",
          "accent-hover": "#2563eb",
        },
      },
      maxWidth: {
        "docs-content": "56rem",
      },
    },
  },
  plugins: [],
};
