import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./styles/**/*.{css}"],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
