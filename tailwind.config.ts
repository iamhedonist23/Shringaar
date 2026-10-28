import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        ivory: "hsl(var(--ivory))",
        plum: "hsl(var(--plum))",
        gold: "hsl(var(--gold))",
        "gold-contrast": "#755500",
        rose: "hsl(var(--rose))",
        success: "hsl(var(--success))",
        error: "hsl(var(--error))",
        ink: "hsl(var(--ink))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Arial", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 7vw, 5rem)", { lineHeight: "1.08" }],
        "display-lg": ["clamp(2rem, 4vw, 3.25rem)", { lineHeight: "1.12" }],
      },
      borderRadius: {
        card: "14px",
        control: "12px",
      },
      boxShadow: {
        soft: "0 12px 36px rgb(74 31 61 / 8%)",
        card: "0 4px 18px rgb(74 31 61 / 7%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
