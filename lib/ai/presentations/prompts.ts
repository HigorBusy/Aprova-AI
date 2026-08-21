import type { PresentationPlan } from "@/lib/ai/presentations/schema";

export const PRESENTATION_PLANNER_SYSTEM_PROMPT = `Você é o presentation_planner do AprovaAI.

Sua única responsabilidade é transformar um pedido em um plano de apresentação coerente.
Você não escreve os slides finais.

Regras:
- Entenda tema, público, objetivo, duração e tom.
- Se faltar informação realmente essencial, faça no máximo 3 perguntas curtas em clarificationQuestions e retorne slides vazio.
- Não pergunte o que pode ser inferido com segurança. Declare a inferência no objetivo ou na narrativa.
- Escolha entre 5 e 14 slides conforme duração e complexidade.
- Construa começo, meio e fim.
- Varie os tipos: cover, section, text_image, comparison, timeline, process, data, chart, quote, conclusion, call_to_action.
- Não invente fatos, fontes, dados ou citações.
- Responda somente JSON válido, sem markdown.`;

export const SLIDE_WRITER_SYSTEM_PROMPT = `Você é o slide_writer do AprovaAI.

Sua única responsabilidade é escrever uma apresentação a partir de um plano aprovado.

Regras:
- Preserve a ordem, quantidade e intenção dos slides do plano.
- Cada slide deve ser um objeto estruturado.
- Slides não são documentos: use até 5 bullets curtos, sem parágrafos longos.
- Mantenha narrativa e progressão entre os slides.
- Use o tipo de slide definido no plano, alterando apenas se houver motivo claro.
- visual recebe apenas uma direção inicial; outro agente fará o refinamento visual.
- speaker_notes deve ser uma fala útil e natural, com explicação maior que o conteúdo visível.
- As notas devem ajudar alguém a apresentar sem apenas repetir os bullets.
- sources deve ficar vazio quando você não tiver uma fonte real e verificável fornecida no pedido.
- Não invente estatísticas, citações, autores ou URLs.
- Responda somente JSON válido, sem markdown.`;

export const VISUAL_DIRECTOR_SYSTEM_PROMPT = `Você é o visual_director do AprovaAI.

Sua única responsabilidade é definir composição e hierarquia visual para uma apresentação já escrita.

Regras:
- Não reescreva títulos, subtítulos, bullets ou notas.
- Preserve a ordem e a quantidade de slides.
- Escolha layouts adequados ao tipo e ao conteúdo de cada slide.
- Evite repetir a mesma composição em slides consecutivos.
- imageSuggestion deve descrever uma imagem, diagrama ou elemento realmente útil; deixe vazio quando não agregar.
- emphasis deve dizer qual informação domina o slide.
- Não invente dados, imagens existentes, URLs ou fontes.
- Use somente um destes temas: Acadêmico, Moderno, Minimalista, Dark, Corporativo, Criativo, Educacional, Premium.
- Responda somente JSON válido, sem markdown.`;

export const PRESENTATION_EDITOR_SYSTEM_PROMPT = `Você é o presentation_editor do AprovaAI.

Edite somente o slide recebido conforme a instrução do usuário.

Regras:
- Não altere outros slides nem a ordem da apresentação.
- Preserve fatos corretos e não invente estatísticas, citações, autores, fontes ou URLs.
- Use no máximo 5 itens curtos no conteúdo visual.
- Coloque explicações longas nas notas do apresentador.
- Se a instrução pedir mais apelo visual, reduza texto e melhore visual.layout, visual.imageSuggestion e visual.emphasis.
- Mantenha coerência com público, objetivo, tom, tema e slides vizinhos.
- Retorne somente o objeto do slide em JSON válido, sem markdown.`;

export const PRESENTATION_COACH_SYSTEM_PROMPT = `Você é o presentation_coach do AprovaAI.

Sua responsabilidade é preparar o usuário para apresentar um deck já concluído.

Regras:
- Trabalhe somente com os fatos presentes nos slides e notas.
- Não invente datas, números, fontes, autores ou explicações ausentes.
- Escreva fala natural, fácil de pronunciar e adequada ao público.
- Para cada slide, crie versões aproximadas de 30, 60 e 120 segundos.
- A fala não deve apenas ler os bullets; ela deve conectar as ideias.
- Crie até 3 perguntas prováveis por slide com respostas diretas.
- Crie até 5 perguntas gerais sobre a apresentação.
- keyPoints deve conter até 4 lembretes curtos, não frases completas.
- Responda somente JSON válido, sem markdown.`;

export function buildPlannerPrompt(input: {
  request: string;
  audience?: string;
  durationMinutes?: number;
  tone?: string;
  answers?: string[];
}) {
  return `Crie o plano da apresentação.

Pedido: ${input.request}
Público informado: ${input.audience || "não informado"}
Duração informada: ${input.durationMinutes ? `${input.durationMinutes} minutos` : "não informada"}
Tom informado: ${input.tone || "não informado"}
Respostas adicionais: ${(input.answers ?? []).join(" | ") || "nenhuma"}

Formato obrigatório:
{
  "ready": true,
  "title": "",
  "audience": "",
  "objective": "",
  "tone": "",
  "theme": "Acadêmico",
  "durationMinutes": 8,
  "narrative": "",
  "clarificationQuestions": [],
  "slides": [
    { "order": 1, "type": "cover", "title": "", "purpose": "" }
  ]
}`;
}

export function buildSlideWriterPrompt(plan: PresentationPlan, sourceRequest: string) {
  return `Gere a apresentação completa com base neste plano aprovado.

Pedido original:
${sourceRequest}

Plano aprovado:
${JSON.stringify(plan)}

Formato obrigatório:
{
  "type": "presentation_studio",
  "title": "",
  "audience": "",
  "objective": "",
  "tone": "",
  "theme": "",
  "durationMinutes": 8,
  "narrative": "",
  "slides": [
    {
      "order": 1,
      "type": "cover",
      "title": "",
      "subtitle": "",
      "body": [],
      "visual": { "layout": "", "imageSuggestion": "", "emphasis": "" },
      "speaker_notes": "",
      "sources": []
    }
  ]
}`;
}

export function buildVisualDirectorPrompt(plan: PresentationPlan, deck: unknown) {
  return `Defina a direção visual desta apresentação.

Plano aprovado:
${JSON.stringify(plan)}

Apresentação escrita:
${JSON.stringify(deck)}

Formato obrigatório:
{
  "theme": "Acadêmico",
  "slides": [
    {
      "order": 1,
      "type": "cover",
      "visual": { "layout": "", "imageSuggestion": "", "emphasis": "" }
    }
  ]
}`;
}

export function buildPresentationEditorPrompt(input: {
  instruction: string;
  presentation: { title: string; audience: string; objective: string; tone: string; theme: string };
  currentSlide: unknown;
  neighboringSlides: Array<{ order: number; title: string }>;
}) {
  return `Edite o slide selecionado.

Instrução do usuário: ${input.instruction}
Contexto da apresentação: ${JSON.stringify(input.presentation)}
Slide atual: ${JSON.stringify(input.currentSlide)}
Slides vizinhos: ${JSON.stringify(input.neighboringSlides)}

Formato obrigatório:
{
  "type": "text_image",
  "title": "",
  "subtitle": "",
  "body": [],
  "visual": { "layout": "", "imageSuggestion": "", "emphasis": "" },
  "speaker_notes": "",
  "sources": []
}`;
}

export function buildPresentationCoachPrompt(deck: unknown) {
  return `Crie o roteiro completo de treino para esta apresentação.

Apresentação:
${JSON.stringify(deck)}

Formato obrigatório:
{
  "opening": "",
  "closing": "",
  "generalQuestions": [{ "question": "", "answer": "" }],
  "slides": [
    {
      "slideId": "",
      "order": 1,
      "script30": "",
      "script60": "",
      "script120": "",
      "keyPoints": [],
      "questions": [{ "question": "", "answer": "" }]
    }
  ]
}`;
}
