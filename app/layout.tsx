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
  metadataBase: new URL("https://pontuei-enem.vercel.app"),
  title: {
    default: "Pontuei | Corretor de Redação ENEM com IA",
    template: "%s | Pontuei"
  },
  description: "Corrija sua redação do ENEM por competência, descubra onde perdeu pontos e receba um plano prático para melhorar.",
  applicationName: "Pontuei",
  keywords: [
    "corretor de redação ENEM",
    "correção de redação ENEM",
    "redação ENEM com IA",
    "nota redação ENEM",
    "competências ENEM",
    "Pontuei"
  ],
  authors: [{ name: "Pontuei", url: "https://pontuei-enem.vercel.app" }],
  creator: "Pontuei",
  publisher: "Pontuei",
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
    siteName: "Pontuei",
    title: "Pontuei | Corretor de Redação ENEM com IA",
    description: "Veja sua nota por competência, os trechos que enfraquecem o texto e o próximo passo para evoluir.",
    images: [
      {
        url: "/pontuei-social-banner.png",
        width: 1536,
        height: 1024,
        alt: "Pontuei, corretor de redação para o ENEM"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Pontuei | Corretor de Redação ENEM com IA",
    description: "Corrija sua redação pelas cinco competências e descubra exatamente onde melhorar.",
    images: ["/pontuei-social-banner.png"]
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/pontuei-tab-48.png?v=4", type: "image/png", sizes: "48x48" },
      { url: "/favicon.ico?v=4", sizes: "any" },
      { url: "/icons/pontuei-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/pontuei-512.png", type: "image/png", sizes: "512x512" }
    ],
    apple: [{ url: "/icons/pontuei-apple-touch.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/icons/pontuei-tab-48.png?v=4"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pontuei"
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
    name: "Pontuei",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: "https://pontuei-enem.vercel.app",
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
