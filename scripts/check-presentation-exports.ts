import { PDFDocument } from "pdf-lib";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createPresentationPdf, createPresentationPptx, safePresentationFilename } from "../lib/ai/presentations/export";
import type { PresentationStudioDeck } from "../lib/ai/presentations/schema";

const deck: PresentationStudioDeck = {
  type: "presentation_studio",
  title: "Revolução Francesa",
  audience: "Ensino médio",
  objective: "Explicar causas, fases e consequências.",
  tone: "Didático",
  theme: "Acadêmico",
  durationMinutes: 8,
  narrative: "Contexto, ruptura e legado.",
  slides: [
    {
      id: "slide-1",
      order: 1,
      type: "cover",
      title: "Revolução Francesa",
      subtitle: "A crise que transformou a Europa",
      body: [],
      visual: { layout: "Capa editorial", imageSuggestion: "Bastilha", emphasis: "1789" },
      speaker_notes: "Apresente o contexto e a pergunta central.",
      sources: ["https://example.com/history"]
    },
    {
      id: "slide-2",
      order: 2,
      type: "comparison",
      title: "Uma sociedade dividida",
      subtitle: "Privilégios para poucos, impostos para muitos",
      body: ["Clero e nobreza concentravam privilégios", "O Terceiro Estado sustentava a arrecadação", "A crise econômica ampliou a tensão", "O Iluminismo ofereceu novas ideias"],
      visual: { layout: "Duas colunas", imageSuggestion: "Três estados", emphasis: "Desigualdade" },
      speaker_notes: "Compare os grupos sociais e conecte a desigualdade à revolta.",
      sources: []
    },
    {
      id: "slide-3",
      order: 3,
      type: "conclusion",
      title: "O legado permanece",
      subtitle: "Cidadania, direitos e limites do poder",
      body: ["Fim de privilégios feudais", "Declaração de direitos", "Nova ideia de cidadania"],
      visual: { layout: "Síntese", imageSuggestion: "Declaração", emphasis: "Legado" },
      speaker_notes: "Retome a tese e encerre com uma pergunta para a turma.",
      sources: []
    }
  ],
  review: { passed: true, notes: [] }
};

async function main() {
  const pdf = await createPresentationPdf(deck);
  const parsedPdf = await PDFDocument.load(pdf);
  if (parsedPdf.getPageCount() !== deck.slides.length) throw new Error("PDF_PAGE_COUNT_MISMATCH");
  if (Buffer.from(pdf).subarray(0, 4).toString("ascii") !== "%PDF") throw new Error("INVALID_PDF_SIGNATURE");

  const pptx = await createPresentationPptx(deck);
  if (pptx.subarray(0, 2).toString("ascii") !== "PK") throw new Error("INVALID_PPTX_SIGNATURE");
  if (pptx.byteLength < 10_000) throw new Error("PPTX_TOO_SMALL");
  if (safePresentationFilename("Apresentação: ação e coesão") !== "apresentacao-acao-e-coesao") throw new Error("INVALID_FILENAME_NORMALIZATION");
  if (process.env.PRESENTATION_EXPORT_FIXTURES === "1") {
    const output = resolve("work", "presentation-export-qa");
    await mkdir(output, { recursive: true });
    await Promise.all([writeFile(resolve(output, "sample.pdf"), pdf), writeFile(resolve(output, "sample.pptx"), pptx)]);
  }
  console.log(`Presentation exports: OK (PDF ${pdf.byteLength} bytes, PPTX ${pptx.byteLength} bytes)`);
}

void main();
