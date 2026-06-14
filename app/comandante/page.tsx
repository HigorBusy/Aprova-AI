
import type { Metadata } from "next";

import { Comandante } from "@/components/comandante";

export const metadata: Metadata = {
  title: "Comandante IA | AprovaAI",
  description: "Orientação estratégica para estudantes do ENEM."
};

export default function ComandantePage() {
  return <Comandante />;
}
