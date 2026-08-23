import type { MetadataRoute } from "next";

const BASE_URL = "https://aprova-ai-gray.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/manifest.webmanifest", "/icons/"],
      disallow: [
        "/admin/",
        "/api/",
        "/ativar/",
        "/apresentacoes/",
        "/comandante/",
        "/diagnostico/",
        "/questoes/",
        "/simulado/"
      ]
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL
  };
}
