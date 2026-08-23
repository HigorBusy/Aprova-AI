import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { AccountRuntime } from "@/components/account-runtime";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aprova-ai-gray.vercel.app"),
  title: {
    default: "AprovaAI | Corretor de Redação ENEM com IA",
    template: "%s | AprovaAI"
  },
  description: "Corrija sua redação do ENEM por competência, descubra onde perdeu pontos e receba um plano prático para melhorar.",
  applicationName: "AprovaAI",
  keywords: [
    "corretor de redação ENEM",
    "correção de redação ENEM",
    "redação ENEM com IA",
    "nota redação ENEM",
    "competências ENEM",
    "AprovaAI"
  ],
  authors: [{ name: "AprovaAI", url: "https://aprova-ai-gray.vercel.app" }],
  creator: "AprovaAI",
  publisher: "AprovaAI",
  category: "education",
  verification: {
    google: "8u5A__DUbwxHcjnIYVU3dWtT6GgNrC0ktTCsCGBjRJQ"
  },
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "AprovaAI",
    title: "AprovaAI | Corretor de Redação ENEM com IA",
    description: "Veja sua nota por competência, os trechos que enfraquecem o texto e o próximo passo para evoluir.",
    images: [
      {
        url: "/aprova-ai-checkout-banner.png",
        width: 1536,
        height: 1024,
        alt: "AprovaAI, corretor de redação para o ENEM"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "AprovaAI | Corretor de Redação ENEM com IA",
    description: "Corrija sua redação pelas cinco competências e descubra exatamente onde melhorar.",
    images: ["/aprova-ai-checkout-banner.png"]
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/aprova-ai-tab-48.png?v=2", type: "image/png", sizes: "48x48" },
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icons/aprova-ai-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/aprova-ai-512.png", type: "image/png", sizes: "512x512" }
    ],
    apple: [{ url: "/icons/aprova-ai-apple-touch.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/icons/aprova-ai-tab-48.png?v=2"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AprovaAI"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08111f"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AprovaAI",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: "https://aprova-ai-gray.vercel.app",
    description: "Corretor de redação ENEM com análise por competência e plano de melhoria.",
    inLanguage: "pt-BR",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
      description: "Primeira correção de redação gratuita"
    },
    featureList: [
      "Nota estimada da redação",
      "Análise das cinco competências do ENEM",
      "Identificação de trechos que perdem pontos",
      "Plano prático de melhoria"
    ]
  };

  return (
    <html lang="pt-BR" className={spaceGrotesk.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
        <AccountRuntime />
      </body>
    </html>
  );
}
