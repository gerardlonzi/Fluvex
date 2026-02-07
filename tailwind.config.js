/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#020617",
        surface: "#0f172a",
        border: "#1e293b",
        primary: "#13ec5b",
        primaryHover: "#10b981",
        accent: "#6366f1",
        danger: "#ef4444",
        text: {
          main: "#f8fafc",
          muted: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
}

