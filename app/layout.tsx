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
  title: "AprovaAI | Correção de redação ENEM com IA",
  description: "Corrija sua redação do ENEM em segundos com IA, nota estimada, competências e plano de melhoria.",
  applicationName: "AprovaAI",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/aprova-ai-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/aprova-ai-512.png", type: "image/png", sizes: "512x512" }
    ],
    apple: [{ url: "/icons/aprova-ai-apple-touch.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.ico"
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
  return (
    <html lang="pt-BR" className={spaceGrotesk.variable}>
      <body>
        {children}
        <AccountRuntime />
      </body>
    </html>
  );
}
