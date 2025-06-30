/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#A18BFF",
          orange: "#FCA311",
          blue: "#A1C4FD",
          "dark-purple": "#715AFF",
          "dark-orange": "#E69500",
          "dark-blue": "#7B9EDA",
          "sea-green": "#2E8B57",
          "light-green": "#f0fff4",
          "light-blue": "#f0f8ff",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        sans: ["Satoshi", "sans-serif"],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out forwards",
      },
    },
  },
  plugins: [],
}; 