import type { Metadata } from "next";

import { DiagnosticPage } from "@/components/diagnostic-page";

export const metadata: Metadata = {
  title: "Diagnóstico | AprovaAI",
  description: "Veja suas competências, padrões recorrentes e o próximo foco para evoluir na redação do ENEM."
};

export default function Page() {
  return <DiagnosticPage />;
}
