// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        favgreen: "#C8D164",
        loginbg: "#6C6850",
        creamtext: "#FFFDEF",
        chocolate: "#290102",
        niceblue: "#678CD5",
        sand: "#A08963",
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
      },
    },
  },
};
