import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nos couleurs sémantiques (plus facile à maintenir)
        background: "#020617", // Slate 950 (Fond très sombre)
        surface: "#0f172a",    // Slate 900 (Cartes)
        border: "#1e293b",     // Slate 800 (Bordures subtiles)
        primary: "#10b981",    // Emerald 500 (Vert Écologique pour les actions)
        primaryHover: "#059669",
        accent: "#6366f1",     // Indigo 500 (Pour les stats tech)
        danger: "#ef4444",     // Red 500
        text: {
          main: "#f8fafc",     // Blanc cassé
          muted: "#94a3b8",    // Gris clair
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'], // On configurera la font Inter plus tard
      }
    },
  },
  plugins: [],
};
export default config;