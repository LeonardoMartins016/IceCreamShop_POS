import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#C13B56",
          blue: "#3E6FB0",
          orange: "#E8834B",
          bg: "#DBE0E5",
          dark: "#1A1A2E",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 30px rgba(0,0,0,0.04)",
        "card-hover": "0 14px 40px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
