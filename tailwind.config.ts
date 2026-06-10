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
        canvas: "#020617",
        ink: "#f8fafc",
        muted: "#94a3b8",
        void: "#030712",
        panel: "rgba(255,255,255,0.04)",
        cosmic: "#7c3aed",
        violet: "#8b5cf6",
        accent: "#a855f7",
        aura: "#c4b5fd",
        mint: "#34d399",
        amber: "#f59e0b"
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "Space Grotesk", "Geist", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 24px 90px rgba(0, 0, 0, 0.50)",
        glow: "0 0 34px rgba(124, 58, 237, 0.32)",
        command: "0 0 0 1px rgba(255,255,255,0.08), 0 28px 90px rgba(0,0,0,0.58)",
        energy: "0 0 0 1px rgba(168,85,247,0.22), 0 0 48px rgba(124,58,237,0.26), 0 28px 90px rgba(0,0,0,0.62)"
      }
    }
  },
  plugins: []
};

export default config;