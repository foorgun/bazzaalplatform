import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0C0C0C",
        surface: "#141414",
        "surface-2": "#1A1A1A",
        hairline: "rgba(255,255,255,0.08)",
        accent: {
          DEFAULT: "#A3A74B",
          soft: "rgba(163,167,75,0.12)",
          line: "rgba(163,167,75,0.35)",
        },
        ink: {
          DEFAULT: "#F2F2F0",
          muted: "#8A8A85",
          faint: "#5C5C58",
        },
        success: {
          DEFAULT: "#4ADE80",
          soft: "rgba(74,222,128,0.12)",
          line: "rgba(74,222,128,0.35)",
        },
        danger: "#F87171",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["11px", "14px"],
      },
      borderRadius: {
        lg: "10px",
        md: "8px",
        sm: "6px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
