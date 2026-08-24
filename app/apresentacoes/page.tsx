import type { Metadata } from "next";

import { PresentationStudio } from "@/components/presentation-studio";
import { PRODUCT_CONFIG } from "@/lib/product-config";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Criar apresentação | Pontuei",
  description: "Planeje, crie e edite uma apresentação completa com IA."
};

export default function PresentationPage() {
  if (!PRODUCT_CONFIG.features.presentations) redirect("/");
  return <PresentationStudio />;
}
