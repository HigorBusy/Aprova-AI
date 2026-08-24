import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import PptxGenJS from "pptxgenjs";

import type { PresentationStudioDeck, PresentationStudioSlide } from "@/lib/ai/presentations/schema";
import { normalizePresentationTheme, presentationThemes } from "@/lib/ai/presentations/themes";

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
  const number = Number.parseInt(normalized, 16);
  return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 };
}

function pdfColor(hex: string) {
  const color = hexToRgb(hex);
  return rgb(color.r / 255, color.g / 255, color.b / 255);
}

function cleanText(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number, maxLines: number) {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:]?$/, "")}…`;
  }
  return lines;
}

function drawLines(page: PDFPage, lines: string[], options: { x: number; y: number; size: number; lineHeight: number; font: PDFFont; color: ReturnType<typeof rgb> }) {
  lines.forEach((line, index) => page.drawText(line, { x: options.x, y: options.y - index * options.lineHeight, size: options.size, font: options.font, color: options.color }));
}

function drawPdfSlide(page: PDFPage, deck: PresentationStudioDeck, slide: PresentationStudioSlide, index: number, fonts: { regular: PDFFont; bold: PDFFont }) {
  const theme = presentationThemes[normalizePresentationTheme(deck.theme)];
  const width = page.getWidth();
  const height = page.getHeight();
  const foreground = pdfColor(theme.foreground);
  const muted = pdfColor(theme.muted);
  const accent = pdfColor(theme.accent);
  const surface = pdfColor(theme.surface);
  const border = pdfColor(theme.border);
  page.drawRectangle({ x: 0, y: 0, width, height, color: pdfColor(theme.background) });
  page.drawRectangle({ x: 48, y: height - 45, width: 34, height: 3, color: accent });
  page.drawText(cleanText(deck.title).slice(0, 64), { x: 92, y: height - 49, size: 9, font: fonts.bold, color: muted });

  const isStatement = slide.type === "cover" || slide.type === "section" || slide.type === "quote";
  const titleSize = isStatement ? 34 : 27;
  const titleLines = wrapText(slide.title || "Sem título", fonts.bold, titleSize, width - 112, isStatement ? 3 : 2);
  const titleY = isStatement ? height - 180 : height - 112;
  drawLines(page, titleLines, { x: 56, y: titleY, size: titleSize, lineHeight: titleSize * 1.08, font: fonts.bold, color: foreground });

  let contentY = titleY - titleLines.length * titleSize * 1.08 - 18;
  if (slide.subtitle) {
    const subtitle = wrapText(slide.subtitle, fonts.regular, 14, width - 112, 3);
    drawLines(page, subtitle, { x: 56, y: contentY, size: 14, lineHeight: 19, font: fonts.regular, color: muted });
    contentY -= subtitle.length * 19 + 18;
  }

  if (!isStatement && slide.type === "comparison" && slide.body.length) {
    const columnWidth = (width - 132) / 2;
    const midpoint = Math.ceil(slide.body.length / 2);
    [slide.body.slice(0, midpoint), slide.body.slice(midpoint)].forEach((items, column) => {
      const x = 56 + column * (columnWidth + 20);
      page.drawRectangle({ x, y: 72, width: columnWidth, height: Math.max(170, contentY - 52), color: surface, borderColor: border, borderWidth: 1 });
      let y = contentY - 26;
      items.forEach((item) => {
        const lines = wrapText(item, fonts.regular, 13, columnWidth - 40, 3);
        page.drawCircle({ x: x + 18, y: y + 4, size: 3, color: accent });
        drawLines(page, lines, { x: x + 30, y: y + 9, size: 13, lineHeight: 17, font: fonts.regular, color: foreground });
        y -= lines.length * 17 + 18;
      });
    });
  } else if (!isStatement) {
    slide.body.slice(0, 5).forEach((item, itemIndex) => {
      const lines = wrapText(item, fonts.regular, 15, width - 142, 2);
      const y = contentY - itemIndex * 57;
      page.drawCircle({ x: 63, y: y + 5, size: 3.5, color: accent });
      drawLines(page, lines, { x: 82, y: y + 10, size: 15, lineHeight: 20, font: fonts.regular, color: foreground });
    });
  }

  page.drawText(String(index + 1).padStart(2, "0"), { x: width - 78, y: 28, size: 9, font: fonts.bold, color: muted });
  page.drawText(cleanText(slide.type.replaceAll("_", " ")).toUpperCase(), { x: 56, y: 28, size: 8, font: fonts.bold, color: muted });
}

export async function createPresentationPdf(deck: PresentationStudioDeck) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  document.setTitle(cleanText(deck.title));
  document.setSubject(cleanText(deck.objective));
  document.setCreator("Pontuei");
  deck.slides.forEach((slide, index) => {
    const page = document.addPage([960, 540]);
    drawPdfSlide(page, deck, slide, index, { regular, bold });
  });
  return document.save();
}

function pptxTextColor(hex: string) {
  return hex.replace("#", "").toUpperCase();
}

function addPptxSlide(pptx: PptxGenJS, deck: PresentationStudioDeck, item: PresentationStudioSlide, index: number) {
  const theme = presentationThemes[normalizePresentationTheme(deck.theme)];
  const slide = pptx.addSlide();
  slide.background = { color: pptxTextColor(theme.background) };
  slide.addShape(pptx.ShapeType.rect, { x: 0.66, y: 0.55, w: 0.48, h: 0.04, line: { color: pptxTextColor(theme.accent), transparency: 100 }, fill: { color: pptxTextColor(theme.accent) } });
  slide.addText(cleanText(deck.title).slice(0, 64), { x: 1.25, y: 0.43, w: 8.7, h: 0.25, fontFace: "Aptos", fontSize: 8, bold: true, color: pptxTextColor(theme.muted), margin: 0, breakLine: false, fit: "shrink" });

  const statement = item.type === "cover" || item.type === "section" || item.type === "quote";
  slide.addText(cleanText(item.title || "Sem título"), {
    x: 0.75, y: statement ? 2.0 : 1.12, w: 11.8, h: statement ? 1.6 : 0.85,
    fontFace: theme.headingFamily.includes("Georgia") ? "Georgia" : "Aptos Display",
    fontSize: statement ? 42 : 35, bold: true, color: pptxTextColor(theme.foreground),
    align: statement ? "center" : "left", valign: "middle", margin: 0.04, fit: "shrink"
  });
  if (item.subtitle) slide.addText(cleanText(item.subtitle), { x: statement ? 2 : 0.77, y: statement ? 3.75 : 2.02, w: statement ? 9.3 : 11.3, h: 0.7, fontFace: "Aptos", fontSize: 24, color: pptxTextColor(theme.muted), align: statement ? "center" : "left", valign: "middle", margin: 0, fit: "shrink" });

  if (!statement && item.type === "comparison" && item.body.length) {
    const midpoint = Math.ceil(item.body.length / 2);
    [item.body.slice(0, midpoint), item.body.slice(midpoint)].forEach((items, column) => {
      const x = 0.78 + column * 6.05;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.85, w: 5.7, h: 3.4, rectRadius: 0.06, line: { color: pptxTextColor(theme.border), width: 1 }, fill: { color: pptxTextColor(theme.surface) } });
      const text = items.map((entry) => ({ text: cleanText(entry), options: { bullet: { indent: 14 }, breakLine: true } }));
      slide.addText(text, { x: x + 0.28, y: 3.15, w: 5.1, h: 2.75, fontFace: "Aptos", fontSize: 16, color: pptxTextColor(theme.foreground), breakLine: true, margin: 0.04, paraSpaceAfter: 14, valign: "top", fit: "shrink" });
    });
  } else if (!statement && item.body.length) {
    const text = item.body.slice(0, 5).map((entry) => ({ text: cleanText(entry), options: { bullet: { indent: 16 }, breakLine: true } }));
    slide.addText(text, { x: 0.86, y: 2.75, w: 10.9, h: 3.2, fontFace: "Aptos", fontSize: 18, color: pptxTextColor(theme.foreground), breakLine: true, margin: 0.04, paraSpaceAfter: 16, valign: "top", fit: "shrink", bullet: { type: "bullet" } });
  }

  slide.addText(item.type.replaceAll("_", " ").toUpperCase(), { x: 0.75, y: 7.05, w: 3.1, h: 0.18, fontFace: "Aptos", fontSize: 7, bold: true, color: pptxTextColor(theme.muted), margin: 0, charSpacing: 1.2 });
  slide.addText(String(index + 1).padStart(2, "0"), { x: 11.85, y: 7.02, w: 0.65, h: 0.2, fontFace: "Aptos", fontSize: 8, bold: true, align: "right", color: pptxTextColor(theme.muted), margin: 0 });
  const notes = [cleanText(item.speaker_notes), item.sources.length ? `[Sources]\n${item.sources.map((source) => `- ${cleanText(source)}`).join("\n")}` : ""].filter(Boolean).join("\n\n");
  if (notes) slide.addNotes(notes);
}

export async function createPresentationPptx(deck: PresentationStudioDeck) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Pontuei";
  pptx.company = "Pontuei";
  pptx.subject = cleanText(deck.objective);
  pptx.title = cleanText(deck.title);
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos"
  };
  deck.slides.forEach((slide, index) => addPptxSlide(pptx, deck, slide, index));
  const output = await pptx.write({ outputType: "nodebuffer", compression: true });
  if (Buffer.isBuffer(output)) return output;
  if (output instanceof ArrayBuffer) return Buffer.from(output);
  if (output instanceof Uint8Array) return Buffer.from(output);
  throw new Error("PPTX_EXPORT_FAILED");
}

export function safePresentationFilename(title: string) {
  const normalized = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || "apresentacao";
}
