import assert from "node:assert/strict";

import { applyVisualDirection, normalizeEditedSlide, normalizePresentationDeck, normalizePresentationPlan, normalizePresentationRehearsal } from "../lib/ai/presentations/schema";

const plan = normalizePresentationPlan({
  ready: true,
  title: "Revolução Francesa",
  audience: "Ensino médio",
  objective: "Explicar causas, fases e consequências.",
  durationMinutes: 8,
  narrative: "Contexto, ruptura e legado.",
  slides: [
    { type: "cover", title: "Revolução Francesa", purpose: "Abrir" },
    { type: "timeline", title: "Da crise à ruptura", purpose: "Organizar os eventos" },
    { type: "conclusion", title: "O legado", purpose: "Fechar a narrativa" }
  ]
});

assert.equal(plan.ready, true);
assert.equal(plan.slides.length, 3);
assert.deepEqual(plan.slides.map((slide) => slide.order), [1, 2, 3]);

const deck = normalizePresentationDeck({
  title: "Revolução Francesa",
  slides: [
    { type: "cover", title: "1789", subtitle: "A ordem antiga entra em colapso", body: [] },
    { type: "timeline", title: "Da crise à ruptura", body: ["Crise fiscal", "Estados Gerais", "Bastilha", "República", "Terror", "item excedente"] },
    { type: "conclusion", title: "O legado", body: ["Cidadania", "Direitos", "Estado moderno"] }
  ]
}, plan);

assert.equal(deck.type, "presentation_studio");
assert.equal(deck.slides.length, plan.slides.length);
assert.equal(deck.slides[1].body.length, 5, "slides devem limitar conteúdo visual a cinco itens");
assert.equal(deck.slides[1].type, "timeline");

const directedDeck = applyVisualDirection({
  theme: "Premium",
  slides: deck.slides.map((slide) => ({
    type: slide.type,
    visual: { layout: `Layout ${slide.order}`, imageSuggestion: "", emphasis: slide.title }
  }))
}, deck);

assert.equal(directedDeck.theme, "Premium");
assert.equal(directedDeck.slides[1].visual.layout, "Layout 2");
assert.equal(directedDeck.slides[1].title, deck.slides[1].title, "diretor visual não deve reescrever conteúdo");

const editedSlide = normalizeEditedSlide({
  type: "comparison",
  title: "Antes e depois de 1789",
  subtitle: "Uma ruptura política e social",
  body: ["Antigo Regime", "Nova ordem"],
  visual: { layout: "Duas colunas", imageSuggestion: "Retratos contrastados", emphasis: "A ruptura" },
  speaker_notes: "Explique a mudança sem repetir os dois rótulos.",
  sources: []
}, deck.slides[1]);

assert.equal(editedSlide.id, deck.slides[1].id, "edição deve preservar a identidade do slide");
assert.equal(editedSlide.type, "comparison");
assert.equal(editedSlide.speaker_notes.includes("Explique"), true);

const rehearsal = normalizePresentationRehearsal({
  opening: "Comece situando a crise do Antigo Regime.",
  closing: "Retome o legado político.",
  generalQuestions: [{ question: "Qual foi o maior legado?", answer: "A consolidação da cidadania moderna." }, { question: "Sem resposta" }],
  slides: deck.slides.map((slide) => ({
    slideId: slide.id,
    order: slide.order,
    script30: `Fala curta do slide ${slide.order}`,
    script60: `Fala média do slide ${slide.order}`,
    script120: `Fala longa do slide ${slide.order}`,
    keyPoints: ["contexto", "causa", "efeito", "síntese", "excedente"],
    questions: [{ question: `Pergunta ${slide.order}?`, answer: "Resposta baseada no slide." }]
  }))
}, deck);

assert.equal(rehearsal.slides.length, deck.slides.length);
assert.equal(rehearsal.slides[1].slideId, deck.slides[1].id);
assert.equal(rehearsal.slides[1].title, deck.slides[1].title);
assert.equal(rehearsal.slides[1].keyPoints.length, 4);
assert.equal(rehearsal.generalQuestions.length, 1, "perguntas sem resposta não devem chegar à interface");

const clarification = normalizePresentationPlan({
  clarificationQuestions: ["Para qual público?", "Quanto tempo?"],
  slides: [{ title: "Não deve vazar", type: "cover" }]
});

assert.equal(clarification.ready, false);
assert.equal(clarification.slides.length, 0);
assert.equal(clarification.clarificationQuestions.length, 2);

console.log("Presentation Studio contracts: OK");
