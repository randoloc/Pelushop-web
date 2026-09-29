/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0D0D0D",
        surface: "#141414",
        surfaceBorder: "#252525",
        gold: "#D4AF37",
        bronze: "#8B7355",
        muted: "#666666",
        danger: "#E53935",
        success: "#4CAF50",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #D4AF37 0%, #8B7355 100%)",
      },
    },
  },
  plugins: [],
};
