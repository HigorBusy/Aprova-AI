import type { Metadata } from "next";

import { Comandante } from "@/components/comandante";

export const metadata: Metadata = {
  title: "Tutor IA | Pontuei",
  description: "Orientação estratégica para estudantes do ENEM."
};

export default function ComandantePage({
  searchParams
}: {
  searchParams?: { context?: string | string[] };
}) {
  const context = typeof searchParams?.context === "string" ? searchParams.context : "";
  return <Comandante initialContext={context} />;
}
