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
  title: "AprovaAI | CorreÃ§Ã£o de redaÃ§Ã£o ENEM com IA",
  description: "Corrija sua redaÃ§Ã£o do ENEM em segundos com IA, nota estimada, competÃªncias e plano de melhoria."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617"
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

