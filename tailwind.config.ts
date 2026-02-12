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
        wojak: {
          green: "#4ade80",
          dark: "#0a0a0a",
          card: "#141414",
          border: "#1e1e1e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
