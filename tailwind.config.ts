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
        canvas: "#070d10",
        ink: "#e8eee8",
        muted: "#84938b",
        void: "#05090b",
        panel: "rgba(232,238,232,0.055)",
        cosmic: "#3aa7d8",
        violet: "#9fcf8b",
        accent: "#9fcf8b",
        aura: "#8bd8f8",
        mint: "#9fcf8b",
        amber: "#efb65a",
        error: "#e86f5c"
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "Space Grotesk", "Geist", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 24px 90px rgba(0, 0, 0, 0.50)",
        glow: "0 0 34px rgba(58, 167, 216, 0.24)",
        command: "0 0 0 1px rgba(232,238,232,0.10), 0 28px 90px rgba(0,0,0,0.58)",
        energy: "0 0 0 1px rgba(159,207,139,0.22), 0 0 48px rgba(58,167,216,0.20), 0 28px 90px rgba(0,0,0,0.62)"
      }
    }
  },
  plugins: []
};

export default config;
