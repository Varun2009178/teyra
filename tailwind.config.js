/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'bg-brand-yellow',
    'bg-brand-orange', 
    'bg-brand-purple',
    'border-brand-dark-orange',
    'border-brand-dark-purple',
    'text-brand-purple',
    'shadow-[8px_8px_0_0_#FCA311]',
    'shadow-[4px_4px_0_0_#000]',
    'shadow-[2px_2px_0_0_#000]',
    'animate-fadeIn',
    'animate-fade-in'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#A18BFF",
          orange: "#FCA311",
          blue: "#A1C4FD",
          yellow: "#FCA311",
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
        "fadeIn": "fadeIn 0.6s ease-out",
      },
    },
  },
  plugins: [],
}; 