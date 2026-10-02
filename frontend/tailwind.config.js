/** @type {import('tailwindcss').Config} */
// Tailwind scans these files for class names and generates only the CSS actually used.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // "class" strategy: dark mode is on whenever <html> has the `dark` class, which our
  // ThemeContext toggles. This lets us support an explicit user preference + persistence.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand ramp — the signal grass-green used across the whole app (buttons, links,
        // active states, accents). Kept identical to `grass` so the landing and the app
        // read as one product.
        brand: {
          50: "#f3fbe8",
          100: "#e4f6cd",
          200: "#c9ee9c",
          300: "#ace363",
          400: "#8ed84a",
          500: "#73c22f",
          600: "#589b22",
          700: "#43761d",
          800: "#365f18",
          900: "#2b4c14",
        },
        // Alias of brand, used by the landing page's own components.
        grass: {
          50: "#f3fbe8",
          100: "#e4f6cd",
          200: "#c9ee9c",
          300: "#ace363",
          400: "#8ed84a",
          500: "#73c22f",
          600: "#589b22",
          700: "#43761d",
        },
        // Deep ink used for headlines, inverted panels, and icon tiles.
        ink: "#0e1420",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        serif: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        // Soft, diffuse shadows for a modern "floating card" feel.
        soft: "0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)",
        lift: "0 2px 6px rgba(15,23,42,0.06), 0 16px 40px rgba(15,23,42,0.10)",
        glow: "0 8px 30px rgba(115,194,47,0.28)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #8ed84a 0%, #63b32b 100%)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          // `none` (not translateY(0)): the fill-mode keeps the last frame, and any transform
          // would make the element a containing block that traps `position: fixed` children.
          "100%": { opacity: "1", transform: "none" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        // Continuous horizontal scroll for logo/card marquees (the track is duplicated,
        // so translating by -50% loops seamlessly).
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "equalize": {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        shimmer: "shimmer 1.5s infinite",
        marquee: "marquee 34s linear infinite",
        "marquee-fast": "marquee 24s linear infinite",
        // Listing equalize here is what makes Tailwind emit the @keyframes; the hero mock
        // overrides duration/delay per-bar inline for a lively, uneven motion.
        equalize: "equalize 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
