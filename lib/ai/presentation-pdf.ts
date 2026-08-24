import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import type { PresentationDeck, PresentationSlide } from "@/lib/ai/presentation";

const PAGE_WIDTH = 1280;
const PAGE_HEIGHT = 720;
const MARGIN = 58;

type DrawTextOptions = {
  x: number;
  y: number;
  size: number;
  color?: ReturnType<typeof rgb>;
  maxWidth?: number;
  lineHeight?: number;
  font?: PDFFont;
};

type DeckPdfResult = {
  bytes: Uint8Array;
  fileName: string;
};

export async function renderPresentationPdf(deck: PresentationDeck): Promise<DeckPdfResult> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(deck.title);
  pdf.setSubject(deck.objective);
  pdf.setAuthor("Pontuei");
  pdf.setCreator("Pontuei Tutor IA");

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  drawCover(pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]), deck, regular, bold);
  deck.slides.forEach((slide, index) => drawSlide(pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]), deck, slide, index, regular, bold));
  drawBackPage(pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]), deck, regular, bold);

  const bytes = await pdf.save();
  return {
    bytes,
    fileName: `${slugify(deck.title || "apresentacao-pontuei")}.pdf`
  };
}

function drawCover(page: PDFPage, deck: PresentationDeck, regular: PDFFont, bold: PDFFont) {
  drawBackground(page);
  drawBrand(page, bold);

  drawPill(page, deck.template, MARGIN, 92, 15, 220);
  drawText(page, deck.title, {
    x: MARGIN,
    y: 570,
    size: 54,
    maxWidth: 790,
    lineHeight: 58,
    font: bold,
    color: rgb(0.98, 0.98, 1)
  });
  drawText(page, deck.objective, {
    x: MARGIN,
    y: 398,
    size: 19,
    maxWidth: 650,
    lineHeight: 28,
    font: regular,
    color: rgb(0.76, 0.8, 0.9)
  });

  drawGlassPanel(page, 780, 132, 390, 380);
  drawText(page, "Resumo executivo", {
    x: 815,
    y: 462,
    size: 17,
    font: bold,
    color: rgb(0.72, 0.52, 1)
  });
  drawText(page, deck.executiveSummary || "Plano gerado para transformar uma meta em execução diária.", {
    x: 815,
    y: 418,
    size: 17,
    maxWidth: 315,
    lineHeight: 25,
    font: regular,
    color: rgb(0.92, 0.94, 1)
  });

  drawText(page, "Métricas de controle", {
    x: 815,
    y: 278,
    size: 15,
    font: bold,
    color: rgb(0.72, 0.52, 1)
  });
  (deck.keyMetrics || []).slice(0, 4).forEach((metric, index) => {
    drawBullet(page, metric, 820, 244 - index * 34, regular);
  });

  drawFooter(page, `Execução estimada: ${deck.estimatedExecutionTime}`, regular);
}

function drawSlide(page: PDFPage, deck: PresentationDeck, slide: PresentationSlide, index: number, regular: PDFFont, bold: PDFFont) {
  drawBackground(page);
  drawBrand(page, bold);
  drawPill(page, `Slide ${index + 1} / ${deck.slides.length}`, MARGIN, 92, 13, 145);

  drawText(page, slide.title, {
    x: MARGIN,
    y: 594,
    size: 42,
    maxWidth: 720,
    lineHeight: 48,
    font: bold,
    color: rgb(0.98, 0.98, 1)
  });
  if (slide.objective) {
    drawText(page, slide.objective, {
      x: MARGIN,
      y: 484,
      size: 18,
      maxWidth: 640,
      lineHeight: 27,
      font: regular,
      color: rgb(0.72, 0.77, 0.88)
    });
  }

  drawGlassPanel(page, MARGIN, 116, 610, 300);
  drawText(page, "Plano de execução", {
    x: 92,
    y: 374,
    size: 17,
    font: bold,
    color: rgb(0.72, 0.52, 1)
  });
  slide.bullets.slice(0, 5).forEach((bullet, bulletIndex) => {
    drawBullet(page, bullet, 96, 336 - bulletIndex * 42, regular, 500);
  });

  drawGlassPanel(page, 730, 308, 410, 190);
  drawText(page, "Insight", {
    x: 764,
    y: 458,
    size: 16,
    font: bold,
    color: rgb(0.72, 0.52, 1)
  });
  drawText(page, slide.insight || "Foque no que muda sua nota, não no que apenas ocupa tempo.", {
    x: 764,
    y: 422,
    size: 17,
    maxWidth: 330,
    lineHeight: 25,
    font: regular,
    color: rgb(0.92, 0.94, 1)
  });

  drawGlassPanel(page, 730, 116, 410, 160);
  drawText(page, "Próximo movimento", {
    x: 764,
    y: 236,
    size: 16,
    font: bold,
    color: rgb(0.72, 0.52, 1)
  });
  drawText(page, slide.mission || slide.actionSteps?.[0] || deck.nextAction, {
    x: 764,
    y: 202,
    size: 17,
    maxWidth: 330,
    lineHeight: 24,
    font: regular,
    color: rgb(0.92, 0.94, 1)
  });
  if (slide.checkpoint) {
    drawText(page, `Checkpoint: ${slide.checkpoint}`, {
      x: 764,
      y: 136,
      size: 12,
      maxWidth: 330,
      lineHeight: 17,
      font: regular,
      color: rgb(0.62, 0.68, 0.8)
    });
  }

  drawFooter(page, deck.title, regular);
}

function drawBackPage(page: PDFPage, deck: PresentationDeck, regular: PDFFont, bold: PDFFont) {
  drawBackground(page);
  drawBrand(page, bold);
  drawPill(page, "Pontuei", MARGIN, 92, 15, 140);
  drawText(page, "Agora execute.", {
    x: MARGIN,
    y: 540,
    size: 58,
    font: bold,
    color: rgb(0.98, 0.98, 1)
  });
  drawText(page, deck.nextAction, {
    x: MARGIN,
    y: 462,
    size: 23,
    maxWidth: 780,
    lineHeight: 34,
    font: regular,
    color: rgb(0.82, 0.86, 0.95)
  });

  drawGlassPanel(page, MARGIN, 126, 680, 230);
  drawText(page, "Marcos de progresso", {
    x: 94,
    y: 314,
    size: 18,
    font: bold,
    color: rgb(0.72, 0.52, 1)
  });
  (deck.milestones || []).slice(0, 5).forEach((milestone, index) => {
    drawBullet(page, milestone, 98, 274 - index * 35, regular, 570);
  });

  drawText(page, "Ninguém está vindo te salvar, então faça acontecer.", {
    x: MARGIN,
    y: 76,
    size: 18,
    font: bold,
    color: rgb(0.72, 0.52, 1)
  });
}

function drawBackground(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: rgb(0.01, 0.02, 0.07) });
  page.drawCircle({ x: 1070, y: 610, size: 230, color: rgb(0.16, 0.06, 0.38), opacity: 0.48 });
  page.drawCircle({ x: 180, y: 120, size: 190, color: rgb(0.05, 0.13, 0.35), opacity: 0.42 });
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: rgb(0.02, 0.01, 0.08), opacity: 0.35 });
}

function drawBrand(page: PDFPage, font: PDFFont) {
  page.drawText("Pontuei", {
    x: PAGE_WIDTH - 172,
    y: PAGE_HEIGHT - 54,
    size: 18,
    font,
    color: rgb(0.88, 0.9, 1)
  });
}

function drawGlassPanel(page: PDFPage, x: number, y: number, width: number, height: number) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderWidth: 1,
    borderColor: rgb(0.22, 0.19, 0.36),
    color: rgb(0.08, 0.08, 0.16),
    opacity: 0.86
  });
}

function drawPill(page: PDFPage, text: string, x: number, y: number, size: number, width: number) {
  page.drawRectangle({
    x,
    y: PAGE_HEIGHT - y,
    width,
    height: 36,
    borderWidth: 1,
    borderColor: rgb(0.44, 0.24, 0.78),
    color: rgb(0.12, 0.07, 0.24),
    opacity: 0.9
  });
  page.drawText(toWinAnsi(text), {
    x: x + 16,
    y: PAGE_HEIGHT - y + 11,
    size,
    color: rgb(0.74, 0.58, 1)
  });
}

function drawBullet(page: PDFPage, text: string, x: number, y: number, font: PDFFont, maxWidth = 430) {
  page.drawCircle({ x, y: y + 7, size: 4, color: rgb(0.66, 0.33, 0.97) });
  drawText(page, text, {
    x: x + 18,
    y,
    size: 14,
    maxWidth,
    lineHeight: 19,
    font,
    color: rgb(0.85, 0.88, 0.96)
  });
}

function drawFooter(page: PDFPage, text: string, font: PDFFont) {
  page.drawLine({
    start: { x: MARGIN, y: 52 },
    end: { x: PAGE_WIDTH - MARGIN, y: 52 },
    thickness: 0.6,
    color: rgb(0.18, 0.18, 0.28)
  });
  drawText(page, text, {
    x: MARGIN,
    y: 28,
    size: 11,
    maxWidth: 850,
    lineHeight: 14,
    font,
    color: rgb(0.42, 0.47, 0.6)
  });
}

function drawText(page: PDFPage, text: string, options: DrawTextOptions) {
  const font = options.font;
  const maxWidth = options.maxWidth ?? PAGE_WIDTH;
  const lineHeight = options.lineHeight ?? options.size * 1.2;
  const lines = wrapText(toWinAnsi(text), font, options.size, maxWidth);
  lines.forEach((line, index) => {
    page.drawText(line, {
      x: options.x,
      y: options.y - index * lineHeight,
      size: options.size,
      font,
      color: options.color ?? rgb(1, 1, 1),
      maxWidth
    });
  });
}

function wrapText(text: string, font: PDFFont | undefined, size: number, maxWidth: number) {
  const fallbackAverage = size * 0.52;
  return text.split("\n").flatMap((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      const width = font ? font.widthOfTextAtSize(next, size) : next.length * fallbackAverage;
      if (width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    return lines;
  });
}

function toWinAnsi(value: string) {
  return value
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x09\x0a\x0d\x20-\x7eÀ-ÿ]/g, "");
}

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
  return slug || "apresentacao-pontuei";
}
