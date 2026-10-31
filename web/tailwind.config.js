/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#f8f7f2",
        forest: "#263d32",
        olive: "#71815a",
        muted: "#777d73",
        sage: "#e4e9dc",
        terracotta: "#ad654c",
        clay: "#d7a58e",
        line: "#e8e6dc",
        ink: "#263d32",
      },
    },
  },
  plugins: [],
};
