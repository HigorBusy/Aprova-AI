import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AprovaAI",
    short_name: "AprovaAI",
    description: "Correção estratégica de redação para o ENEM.",
    start_url: "/",
    display: "standalone",
    background_color: "#08111F",
    theme_color: "#08111F",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/aprova-ai-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/aprova-ai-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/aprova-ai-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
