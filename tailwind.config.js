/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        border: "var(--border)",
        primary: "#13ec5b",
        primaryHover: "#10b981",
        accent: "#6366f1",
        danger: "#ef4444",
        text: {
          main: "var(--text-main)",
          muted: "var(--text-muted)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
}

