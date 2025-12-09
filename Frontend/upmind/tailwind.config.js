// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        loginbg: "#6C6850",
        creamtext: "#FFFDEF",
        chocolate: "#290102",
        niceblue: "#678CD5",
        gray: "#A08963",
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
      },
    },
  },
};
