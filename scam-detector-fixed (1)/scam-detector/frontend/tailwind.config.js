/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a8a",
        },
        scam:    "#ef4444",
        genuine: "#22c55e",
        warn:    "#f59e0b",
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "pulse-slow":  "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":   "spin 3s linear infinite",
        "bounce-slow": "bounce 2s infinite",
        "fade-in":     "fadeIn 0.5s ease-in-out",
        "slide-up":    "slideUp 0.4s ease-out",
        "slide-in":    "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: 0 },                  "100%": { opacity: 1 } },
        slideUp: { "0%": { opacity: 0, transform: "translateY(20px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        slideIn: { "0%": { opacity: 0, transform: "translateX(-20px)" }, "100%": { opacity: 1, transform: "translateX(0)" } },
      },
    },
  },
  plugins: [],
};
