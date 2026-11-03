import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

/**
 * Config de Tremor v3 (https://tremor.so/docs/getting-started/installation).
 * Sin esto, los componentes de Tremor (Card, Badge, Button, charts) aplican `border`/`ring`
 * sin color definido → Tailwind usa el color por defecto y aparece un "marco" gris/azul en todo.
 */
const tremorColorNames =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const tremorShades = "50|100|200|300|400|500|600|700|800|900|950";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    transparent: "transparent",
    current: "currentColor",
    extend: {
      colors: {
        tremor: {
          brand: {
            faint: colors.blue[50],
            muted: colors.blue[200],
            subtle: colors.blue[400],
            DEFAULT: colors.blue[500],
            emphasis: colors.blue[700],
            inverted: colors.white,
          },
          background: {
            muted: colors.gray[50],
            subtle: colors.gray[100],
            DEFAULT: colors.white,
            emphasis: colors.gray[700],
          },
          border: { DEFAULT: colors.gray[200] },
          ring: { DEFAULT: colors.gray[200] },
          content: {
            subtle: colors.gray[400],
            DEFAULT: colors.gray[500],
            emphasis: colors.gray[700],
            strong: colors.gray[900],
            inverted: colors.white,
          },
        },
      },
      boxShadow: {
        "tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "tremor-card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "tremor-dropdown": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      borderRadius: {
        "tremor-small": "0.375rem",
        "tremor-default": "0.5rem",
        "tremor-full": "9999px",
      },
      fontSize: {
        "tremor-label": ["0.75rem", { lineHeight: "1rem" }],
        "tremor-default": ["0.875rem", { lineHeight: "1.25rem" }],
        "tremor-title": ["1.125rem", { lineHeight: "1.75rem" }],
        "tremor-metric": ["1.875rem", { lineHeight: "2.25rem" }],
      },
    },
  },
  // Tremor arma clases de color dinámicamente (Badge color="green", charts colors={[...]}) → Tailwind no las ve al escanear.
  safelist: [
    { pattern: new RegExp(`^(bg-(?:${tremorColorNames})-(?:${tremorShades}))$`), variants: ["hover"] },
    { pattern: new RegExp(`^(text-(?:${tremorColorNames})-(?:${tremorShades}))$`), variants: ["hover"] },
    { pattern: new RegExp(`^(border-(?:${tremorColorNames})-(?:${tremorShades}))$`), variants: ["hover"] },
    { pattern: new RegExp(`^(ring-(?:${tremorColorNames})-(?:${tremorShades}))$`) },
    { pattern: new RegExp(`^(stroke-(?:${tremorColorNames})-(?:${tremorShades}))$`) },
    { pattern: new RegExp(`^(fill-(?:${tremorColorNames})-(?:${tremorShades}))$`) },
  ],
  plugins: [],
};
export default config;
