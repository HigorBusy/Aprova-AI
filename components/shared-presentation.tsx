"use client";

import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { PresentationStudioDeck, PresentationStudioSlide } from "@/lib/ai/presentations/schema";
import { normalizePresentationTheme, presentationThemes } from "@/lib/ai/presentations/themes";

export function SharedPresentation({ deck }: { deck: PresentationStudioDeck }) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const selected = deck.slides[index] ?? deck.slides[0];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") setIndex((current) => Math.min(deck.slides.length - 1, current + 1));
      if (event.key === "ArrowLeft") setIndex((current) => Math.max(0, current - 1));
      if (event.key === "Escape") setFullscreen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck.slides.length]);

  return (
    <main className={`${fullscreen ? "fixed inset-0 z-50" : "min-h-[100dvh]"} mission-grid flex flex-col bg-canvas text-white`}>
      <header className={`${fullscreen ? "absolute inset-x-0 top-0 z-10 opacity-0 hover:opacity-100" : ""} flex min-h-16 items-center justify-between border-b border-white/10 bg-black/45 px-4 transition-opacity`}>
        <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Pontuei</Link>
        <div className="min-w-0 text-center"><p className="truncate text-sm font-semibold">{deck.title}</p><p className="text-xs text-muted">Somente leitura</p></div>
        <button type="button" title="Apresentar em tela cheia" onClick={() => setFullscreen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-slate-300 hover:border-white/25 hover:text-white"><Maximize2 className="h-4 w-4" /></button>
      </header>
      <section className="flex flex-1 items-center justify-center p-3 sm:p-8"><SharedSlide slide={selected} deck={deck} /></section>
      <nav className={`${fullscreen ? "absolute inset-x-0 bottom-0 opacity-0 hover:opacity-100" : ""} flex min-h-16 items-center justify-center gap-5 border-t border-white/10 bg-black/45 px-4 transition-opacity`}>
        <button type="button" aria-label="Slide anterior" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))} className="grid h-10 w-10 place-items-center rounded-md border border-white/10 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
        <span className="min-w-20 text-center text-sm text-muted">{index + 1} / {deck.slides.length}</span>
        <button type="button" aria-label="Próximo slide" disabled={index === deck.slides.length - 1} onClick={() => setIndex((value) => Math.min(deck.slides.length - 1, value + 1))} className="grid h-10 w-10 place-items-center rounded-md border border-white/10 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
      </nav>
    </main>
  );
}

function SharedSlide({ slide, deck }: { slide: PresentationStudioSlide; deck: PresentationStudioDeck }) {
  const theme = presentationThemes[normalizePresentationTheme(deck.theme)];
  const statement = slide.type === "cover" || slide.type === "section" || slide.type === "quote";
  return (
    <article className="aspect-video w-full max-w-6xl overflow-hidden rounded-lg border p-[clamp(1.25rem,5vw,5rem)] shadow-[0_30px_90px_rgba(0,0,0,0.5)]" style={{ backgroundColor: theme.background, borderColor: theme.border, color: theme.foreground }}>
      <div className="flex h-full flex-col">
        <p className="text-[0.5rem] font-semibold uppercase tracking-[0.16em] sm:text-xs" style={{ color: theme.accent }}>{deck.title}</p>
        <div className={`flex flex-1 ${statement ? "items-center justify-center text-center" : "items-start"}`}>
          <div className={statement ? "max-w-4xl" : "w-full pt-[6%]"}>
            <h1 className="text-[clamp(1.2rem,4.4vw,5rem)] font-semibold leading-[1.04]" style={{ fontFamily: theme.headingFamily }}>{slide.title}</h1>
            {slide.subtitle ? <p className="mt-[3%] text-[clamp(0.62rem,1.5vw,1.45rem)] leading-relaxed" style={{ color: theme.muted }}>{slide.subtitle}</p> : null}
            {!statement && slide.body.length ? <div className={`mt-[5%] ${slide.type === "comparison" ? "grid grid-cols-2 gap-[5%]" : "grid gap-[clamp(.3rem,1vw,.9rem)]"}`}>{slide.body.map((item, itemIndex) => <div key={`${item}-${itemIndex}`} className={`flex items-start gap-3 text-left text-[clamp(.56rem,1.35vw,1.3rem)] leading-snug ${slide.type === "comparison" ? "rounded-md border p-[5%]" : ""}`} style={slide.type === "comparison" ? { backgroundColor: theme.surface, borderColor: theme.border } : undefined}>{slide.type !== "comparison" ? <span className="mt-[.45em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: theme.accent }} /> : null}{item}</div>)}</div> : null}
          </div>
        </div>
        <p className="text-right text-[0.5rem] sm:text-xs" style={{ color: theme.muted }}>{String(slide.order).padStart(2, "0")}</p>
      </div>
    </article>
  );
}
