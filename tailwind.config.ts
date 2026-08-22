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
          DEFAULT: "#70BB3C",
          50: "#f3faee",
          100: "#e4f5db",
          200: "#caecb9",
          300: "#a6dd8d",
          400: "#83cb60",
          500: "#70BB3C",
          600: "#559a2c",
          700: "#427725",
          800: "#375f22",
          900: "#2f4f1f",
          950: "#152c0d",
        },
        navy: {
          800: "#0e1a2f",
          900: "#070e1e",
          950: "#040813",
        },
      },
    },
  },
  plugins: [],
};

export default config;