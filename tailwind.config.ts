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
        canvas: "#08111f",
        ink: "#f4f1e8",
        muted: "#8fa3b8",
        void: "#050a12",
        panel: "rgba(15,30,49,0.78)",
        cosmic: "#35bfe7",
        violet: "#f2c94c",
        accent: "#f2c94c",
        aura: "#9de8fb",
        mint: "#65d69e",
        amber: "#f2c94c",
        error: "#ff6b6b"
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "Space Grotesk", "Geist", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 24px 72px rgba(2, 7, 15, 0.48)",
        glow: "0 16px 48px rgba(53, 191, 231, 0.18)",
        command: "0 0 0 1px rgba(160,190,214,0.12), 0 24px 72px rgba(2,7,15,0.52)",
        energy: "0 0 0 1px rgba(242,201,76,0.24), 0 24px 72px rgba(2,7,15,0.56)"
      }
    }
  },
  plugins: []
};

export default config;
