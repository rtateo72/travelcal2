import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Nunito'", "sans-serif"],
        display: ["'Playfair Display'", "serif"],
      },
      colors: {
        coral: {
          50: "#fff1ef",
          100: "#ffe0db",
          200: "#ffc5bc",
          300: "#ff9d8e",
          400: "#ff6b57",
          500: "#ff3d27",
          600: "#ed2209",
          700: "#c81807",
          800: "#a5180b",
          900: "#881910",
        },
        sand: {
          50: "#faf8f5",
          100: "#f3ede4",
          200: "#e8ddc9",
          300: "#d8c7a5",
          400: "#c4a97d",
          500: "#b5915f",
          600: "#a87c53",
          700: "#8c6345",
          800: "#72513c",
          900: "#5e4433",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;