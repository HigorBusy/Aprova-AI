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
        canvas: "#030712",
        ink: "#f8fafc",
        void: "#070b18",
        panel: "#0b1120",
        ocean: "#2563eb",
        cyan: "#22d3ee",
        ion: "#38bdf8",
        mint: "#22c55e",
        amber: "#fbbf24",
        reward: "#f97316",
        grape: "#7c3aed"
      },
      boxShadow: {
        soft: "0 24px 90px rgba(0, 0, 0, 0.46)",
        glow: "0 0 32px rgba(34, 211, 238, 0.34)",
        command: "0 0 0 1px rgba(34, 211, 238, 0.12), 0 28px 90px rgba(2, 8, 23, 0.72)"
      }
    }
  },
  plugins: []
};

export default config;