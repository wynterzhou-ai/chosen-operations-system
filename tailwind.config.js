/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: "#0F766E",
        ink: "#17202A",
        line: "#D9E1EA",
        mist: "#F5F7FA"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};
