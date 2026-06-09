import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#060913",
        ink: "#f8fafc",
        ocean: "#2563eb",
        cyan: "#22d3ee",
        mint: "#22c55e",
        reward: "#f97316",
        grape: "#7c3aed"
      },
      boxShadow: {
        soft: "0 22px 70px rgba(0, 0, 0, 0.36)",
        glow: "0 0 28px rgba(37, 99, 235, 0.36)"
      }
    }
  },
  plugins: []
};

export default config;