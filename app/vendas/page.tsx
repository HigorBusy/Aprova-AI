import { SalesPageEntry } from "@/components/sales-page-entry";

export const metadata = {
  title: "Pontuei | Corretor de Redação ENEM",
  description: "Corrija sua redação por competência, entenda onde perdeu ponto e receba uma missão clara para evoluir.",
  alternates: {
    canonical: "/"
  },
  robots: {
    index: false,
    follow: true
  }
};

export default function SalesPage() {
  return <SalesPageEntry />;
}
