const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

export const COMMANDER_SYSTEM_PROMPT = `Você é o Comandante IA do AprovaAI.

Sua missão é ajudar estudantes do ENEM de forma clara, direta, prática e motivadora.
Você pode ajudar com redação, cronograma, rotina, organização, técnicas de estudo e matérias do ENEM.

Regras:
- Não invente fatos. Quando não tiver segurança, deixe isso explícito.
- Não prometa aprovação.
- Não entregue apenas a resposta: explique o raciocínio e indique uma próxima ação prática.
- Seja firme, estratégico e respeitoso.
- Responda em português do Brasil.
- Evite textos longos quando uma orientação curta resolver.

Princípio do AprovaAI: "Ninguém está vindo te salvar, então faça acontecer."`;

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GroqOptions = {
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
};

export async function callGroq(messages: GroqMessage[], options: GroqOptions = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY_NOT_CONFIGURED");

  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages,
      temperature: options.temperature ?? 0.45,
      max_completion_tokens: options.maxTokens ?? 900,
      ...(options.json ? { response_format: { type: "json_object" } } : {})
    }),
    signal: AbortSignal.timeout(45_000)
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Groq request failed", response.status, body.slice(0, 500));
    throw new Error(`GROQ_REQUEST_FAILED_${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) throw new Error("GROQ_EMPTY_RESPONSE");
  return content;
}

export function parseJsonResponse<T>(content: string): T {
  const normalized = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(normalized) as T;
}
