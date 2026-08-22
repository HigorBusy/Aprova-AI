export type ChatContextMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type BuildChatContextInput = {
  systemPrompt: string;
  runtimeContext: string;
  history: ChatContextMessage[];
  userMessage: string;
  maxChars?: number;
};

const DEFAULT_MAX_CHARS = 18_000;
const MAX_RUNTIME_CHARS = 4_000;
const MAX_HISTORY_MESSAGE_CHARS = 2_000;

export function buildBoundedChatContext({
  systemPrompt,
  runtimeContext,
  history,
  userMessage,
  maxChars = DEFAULT_MAX_CHARS
}: BuildChatContextInput) {
  const requiredChars = systemPrompt.length + userMessage.length;
  let availableChars = Math.max(0, maxChars - requiredChars);

  const runtimeBudget = Math.min(MAX_RUNTIME_CHARS, Math.floor(availableChars / 2));
  const boundedRuntime = truncateContext(runtimeContext, runtimeBudget);
  availableChars -= boundedRuntime.length;

  const boundedHistory: ChatContextMessage[] = [];

  for (let index = history.length - 1; index >= 0 && availableChars > 0; index -= 1) {
    const item = history[index];
    const content = truncateContext(
      item.content,
      Math.min(MAX_HISTORY_MESSAGE_CHARS, availableChars)
    );

    if (!content) continue;
    boundedHistory.unshift({ ...item, content });
    availableChars -= content.length;
  }

  const messages: ChatContextMessage[] = [
    { role: "system", content: systemPrompt },
    ...(boundedRuntime ? [{ role: "system" as const, content: boundedRuntime }] : []),
    ...boundedHistory,
    { role: "user", content: userMessage }
  ];

  return {
    messages,
    totalChars: messages.reduce((total, item) => total + item.content.length, 0),
    historyCount: boundedHistory.length,
    runtimeChars: boundedRuntime.length
  };
}

function truncateContext(content: string, maxChars: number) {
  if (maxChars <= 0) return "";
  if (content.length <= maxChars) return content;
  const marker = "\n[contexto resumido por limite técnico]";
  if (maxChars <= marker.length) return content.slice(0, maxChars);

  return `${content.slice(0, maxChars - marker.length).trimEnd()}${marker}`;
}
