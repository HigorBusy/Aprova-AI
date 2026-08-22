"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Bot,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Download,
  Layers3,
  Mic,
  Paperclip,
  Presentation,
  Search,
  SendHorizonal,
  Sparkles,
  Target,
  UploadCloud,
  UserRound,
  Volume2
} from "lucide-react";

import { Card } from "@/components/ui";
import { AiInput } from "@/components/ui/ai-input";
import { Loader } from "@/components/ui/loader-15";
import { InternalNav } from "@/components/internal-nav";
import {
  PRESENTATION_COST,
  presentationTemplates,
  type PresentationDeck,
  type PresentationTemplate
} from "@/lib/ai/presentation";
import type { AiMessage } from "@/lib/ai/types";
import { getSupabaseClient } from "@/lib/supabase/client";

type ToolFormState = {
  subject: string;
  deadline: string;
  hoursPerDay: string;
  theme: string;
  competency: string;
  socialProblem: string;
};

type PresentationFormState = {
  request: string;
  template: PresentationTemplate;
  course: string;
  examDate: string;
  hoursPerDay: string;
  difficultSubjects: string;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type PresentationPdfPayload = {
  type: "presentation_pdf";
  title: string;
  fileName: string;
  pdfBase64?: string;
  deck: PresentationDeck;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type PlanTag = "free" | "premium" | "ADM";

type ConversationSearchResult = {
  message: AiMessage;
  excerpt: string;
};

const quickSuggestions = [
  "Corrija minha estratégia de redação",
  "Monte um plano de estudos",
  "Me dê repertórios para redação",
  "Como melhorar minha competência 3?"
];

const fileTools = [
  "Explicar arquivo",
  "Resumir PDF",
  "Gerar questões",
  "Explicar imagem",
  "Analisar redação por foto"
];

const FOCUSED_MESSAGE_COUNT = 10;

export function Comandante({ initialContext = "" }: { initialContext?: string }) {
  const router = useRouter();
  const safeInitialContext = initialContext.slice(0, 2_000);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [fileSending, setFileSending] = useState(false);
  const [presentationSending, setPresentationSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [planTag, setPlanTag] = useState<PlanTag>("free");
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const [activeSearchMessageId, setActiveSearchMessageId] = useState<string | null>(null);
  const [toolForm, setToolForm] = useState<ToolFormState>({
    subject: "Redação",
    deadline: "14 dias",
    hoursPerDay: "1 hora",
    theme: "desigualdade educacional",
    competency: "C3",
    socialProblem: "uso excessivo de tecnologia"
  });
  const [presentationForm, setPresentationForm] = useState<PresentationFormState>({
    request: "Preciso de um plano de estudos para evoluir no ENEM.",
    template: "Plano de Estudos",
    course: "",
    examDate: "ENEM",
    hoursPerDay: "2 horas",
    difficultSubjects: "Redação, matemática e natureza"
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      router.replace("/");
      return;
    }

    let active = true;
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/");
        return;
      }

      const [historyResult, creditsResult, profileResult] = await Promise.all([
        supabase
          .from("ai_messages")
          .select("id,role,content,created_at")
          .eq("user_id", user.id)
          .not("content", "like", "%pdfBase64%")
          .order("created_at", { ascending: false })
          .limit(60),
        supabase.from("user_credits").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("plan_tag").eq("id", user.id).maybeSingle()
      ]);

      if (!active) return;
      if (historyResult.error || creditsResult.error) {
        setError("Não foi possível carregar o histórico do Tutor IA.");
      } else {
        setMessages(
          [...(historyResult.data as AiMessage[])]
            .reverse()
            .map(normalizeAiMessageForClient)
            .filter((message) => !isLegacyPresentationHistoryMessage(message))
        );
        setBalance(creditsResult.data?.balance ?? 0);
        setPlanTag(normalizePlanTag(profileResult.data?.plan_tag));
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, fileSending, presentationSending]);

  useEffect(() => {
    if (!activeSearchMessageId) return;
    const timeout = window.setTimeout(() => {
      document.getElementById(messageDomId(activeSearchMessageId))?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [activeSearchMessageId, showFullHistory, messages.length]);

  async function sendMessage(content: string, options: { cost?: number; mode?: "chat" | "tool"; toolName?: string; forceChat?: boolean } = {}) {
    const supabase = getSupabaseClient();
    const cost = options.cost ?? 1;
    if (!supabase || sending || fileSending || presentationSending) return;
    if ((balance ?? 0) < cost) {
      setError(`Você precisa de ${cost} créditos para esta ação.`);
      return;
    }

    const optimisticMessage: AiMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content,
      created_at: new Date().toISOString()
    };
    setMessages((current) => [...current, optimisticMessage]);
    setSending(true);
    setError("");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sessão expirada.");

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: content,
          mode: options.mode === "tool" ? "tool" : "chat",
          toolName: options.toolName
        })
      });
      const result = (await response.json()) as { reply?: string; balance?: number; error?: string };
      if (!response.ok || !result.reply) throw new Error(result.error || "Falha ao consultar o Tutor IA.");
      const reply = result.reply;

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: reply,
          created_at: new Date().toISOString()
        }
      ]);
      setBalance(result.balance ?? balance);
    } catch (requestError) {
      setMessages((current) => current.filter((message) => message.id !== optimisticMessage.id));
      setError(requestError instanceof Error ? requestError.message : "Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  async function sendFile(file: File, toolName: string, prompt: string) {
    const supabase = getSupabaseClient();
    if (!supabase || sending || fileSending || presentationSending) return;
    if ((balance ?? 0) < 2) {
      setError("Você precisa de 2 créditos para analisar arquivo.");
      return;
    }

    const optimisticMessage: AiMessage = {
      id: `file-${Date.now()}`,
      role: "user",
      content: `[ARQUIVO: ${file.name}]\nFerramenta: ${toolName}\n${prompt}`,
      created_at: new Date().toISOString()
    };
    setMessages((current) => [...current, optimisticMessage]);
    setFileSending(true);
    setError("");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sessão expirada.");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("toolName", toolName);
      formData.append("prompt", prompt);

      const response = await fetch("/api/ai/file", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const result = (await response.json()) as { reply?: string; balance?: number; error?: string };
      if (!response.ok || !result.reply) throw new Error(result.error || "Não foi possível analisar o arquivo.");

      setMessages((current) => [
        ...current,
        {
          id: `assistant-file-${Date.now()}`,
          role: "assistant",
          content: result.reply as string,
          created_at: new Date().toISOString()
        }
      ]);
      setBalance(result.balance ?? balance);
    } catch (requestError) {
      setMessages((current) => current.filter((message) => message.id !== optimisticMessage.id));
      setError(requestError instanceof Error ? requestError.message : "Não foi possível analisar o arquivo.");
    } finally {
      setFileSending(false);
    }
  }

  async function sendPresentation(values: PresentationFormState) {
    const supabase = getSupabaseClient();
    if (!supabase || sending || fileSending || presentationSending) return;
    if ((balance ?? 0) < PRESENTATION_COST) {
      setError(`Você precisa de ${PRESENTATION_COST} créditos para gerar uma apresentação.`);
      return;
    }

    const optimisticMessage: AiMessage = {
      id: `presentation-${Date.now()}`,
      role: "user",
      content: `[APRESENTAÇÃO SOLICITADA]\nTemplate: ${values.template}\n${values.request}`,
      created_at: new Date().toISOString()
    };
    setMessages((current) => [...current, optimisticMessage]);
    setPresentationSending(true);
    setError("");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sessão expirada.");

      const response = await fetch("/api/ai/presentation", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });
      const result = (await response.json()) as {
        presentation?: PresentationDeck;
        pdf?: {
          fileName: string;
          mimeType: string;
          base64: string;
        };
        balance?: number;
        error?: string;
      };
      if (!response.ok || !result.presentation || !result.pdf?.base64) {
        throw new Error(result.error || "Não foi possível gerar a apresentação.");
      }
      const presentation = result.presentation;
      const pdf = result.pdf;

      downloadBase64Pdf(pdf.base64, pdf.fileName);

      setMessages((current) => [
        ...current,
        {
          id: `assistant-presentation-${Date.now()}`,
          role: "assistant",
          content: JSON.stringify({
            type: "presentation_pdf",
            title: presentation.title,
            fileName: pdf.fileName,
            deck: presentation
          } satisfies PresentationPdfPayload),
          created_at: new Date().toISOString()
        }
      ]);
      setBalance(result.balance ?? balance);
    } catch (requestError) {
      setMessages((current) => current.filter((message) => message.id !== optimisticMessage.id));
      setError(requestError instanceof Error ? requestError.message : "Não foi possível gerar a apresentação.");
    } finally {
      setPresentationSending(false);
    }
  }

  function startVoiceCommand(mode: "transcribe" | "summary") {
    if ((balance ?? 0) < 2) {
      setError("Você precisa de 2 créditos para usar áudio.");
      return;
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Seu navegador não liberou reconhecimento de voz. Use Chrome ou digite a mensagem.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    setError("");

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) {
        setError("Não consegui entender o áudio.");
        return;
      }
      const prompt = mode === "summary"
        ? `Transcreva mentalmente este áudio e crie um resumo de estudo com próximos passos: ${transcript}`
        : `Transcrição de áudio do aluno: ${transcript}`;
      void sendMessage(prompt, { cost: 2, mode: "tool", toolName: mode === "summary" ? "Criar resumo de áudio" : "Transcrever áudio" });
    };
    recognition.onerror = () => setError("Não foi possível capturar o áudio.");
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  const hasCredits = (balance ?? 0) > 0;
  const hasToolCredits = (balance ?? 0) >= 2;
  const busy = sending || fileSending || presentationSending;
  const visibleMessages = showFullHistory ? messages : messages.slice(-FOCUSED_MESSAGE_COUNT);
  const hiddenMessagesCount = Math.max(0, messages.length - visibleMessages.length);
  const recentHistory = messages.filter((message) => message.role === "user").slice(-6).reverse();
  const searchResults = useMemo(
    () => findConversationMatches(messages, conversationSearch),
    [messages, conversationSearch]
  );

  if (loading) {
    return (
      <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas">
        <Loader size="lg" />
      </main>
    );
  }

  return (
    <main className="mission-grid min-h-[100dvh] bg-canvas pb-24 text-white lg:pb-6 lg:pl-64">
      <InternalNav active="tutor" />
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:min-h-[calc(100dvh-3rem)] lg:px-8 lg:py-6">
        <header className="flex flex-col gap-4 border-b border-[#8fa3b8]/15 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-white sm:text-2xl">Tutor IA</h1>
              <p className="mt-1 text-sm text-muted">Seu apoio estratégico para redação e ENEM</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-semibold text-slate-200">
              Plano {formatPlanTag(planTag)}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#f2c94c]/30 bg-[#f2c94c]/10 px-3 py-2">
              <CreditCard className="h-4 w-4 text-aura" />
              <span className="text-sm font-semibold text-white">{balance ?? 0}</span>
              <span className="text-xs text-muted">créditos</span>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 items-start gap-4 pt-4 xl:grid-cols-[minmax(0,1fr)_330px]">
          <Card className="flex min-h-[76dvh] min-w-0 flex-col overflow-hidden rounded-xl border-[#8fa3b8]/15 bg-[#0b1829] p-0 shadow-[0_24px_72px_rgba(2,7,15,0.38)] xl:sticky xl:top-4 xl:h-[calc(100dvh-12rem)] xl:min-h-0">
            <div className="border-b border-[#8fa3b8]/15 bg-[#0f1e31] px-4 py-3 sm:px-6 lg:px-8">
              <ChatFocusHeader
                totalMessages={messages.length}
                hiddenMessagesCount={hiddenMessagesCount}
                showFullHistory={showFullHistory}
                recentHistory={recentHistory}
                searchQuery={conversationSearch}
                searchResults={searchResults}
                onToggleHistory={() => setShowFullHistory((current) => !current)}
                onSearchChange={setConversationSearch}
                onClearSearch={() => {
                  setConversationSearch("");
                  setActiveSearchMessageId(null);
                }}
                onJumpToMessage={(messageId) => {
                  setShowFullHistory(true);
                  setActiveSearchMessageId(messageId);
                }}
                onPickSuggestion={(prompt) => void sendMessage(prompt)}
                disabled={!hasCredits || busy}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 py-5 sm:px-6 lg:px-8">
              {messages.length === 0 ? (
                <div className="grid h-full min-h-[400px] place-items-center text-center">
                  <div className="max-w-2xl">
                    <div className="ai-orb mx-auto h-28 w-28" aria-hidden="true">
                      <div className="ai-orb-core" />
                    </div>
                    <h2 className="mt-7 text-3xl font-semibold text-white sm:text-4xl">O que você precisa entender hoje?</h2>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">
                      Envie sua dúvida ou anexe um PDF ou imagem. O Tutor usa seu histórico para manter o contexto.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-5xl space-y-7">
                  {visibleMessages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      highlighted={message.id === activeSearchMessageId}
                    />
                  ))}
                  {busy && (
                    <div className="flex w-fit items-center gap-3 rounded-lg border border-[#8fa3b8]/15 bg-[#0f1e31] px-4 py-3 text-sm text-muted">
                      <Loader size="sm" />
                      Tutor IA analisando...
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
            <div className="border-t border-[#8fa3b8]/15 bg-[#07101d] p-3 sm:p-4">
              {error && <p className="mb-3 rounded-2xl border border-rose-300/15 bg-rose-500/[0.07] px-4 py-3 text-sm text-rose-100">{repairMojibake(error)}</p>}
              {!hasCredits && (
                <p className="mb-3 rounded-lg border border-rose-400/20 bg-rose-500/[0.07] p-3 text-sm text-rose-100">
                  Você ficou sem créditos.
                </p>
              )}
              <AiInput
                disabled={!hasCredits}
                loading={busy}
                initialValue={safeInitialContext}
                placeholder={hasCredits ? "Pergunte ao Tutor IA sobre redação, estudos ou estratégia..." : "Saldo esgotado"}
                onSubmit={(message) => void sendMessage(message)}
              />
              <p className="mt-2 text-center text-[0.68rem] text-slate-600">
                Mensagem: 1 crédito · Arquivo: 2 créditos
              </p>
            </div>
          </Card>

          <aside className="grid content-start gap-4 xl:sticky xl:top-4">
            <FileUploadPanel
              disabled={busy || (balance ?? 0) < 2}
              onSubmit={(file, toolName, prompt) => void sendFile(file, toolName, prompt)}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

function QuickSuggestions({
  disabled,
  onSelect
}: {
  disabled: boolean;
  onSelect: (prompt: string) => void;
}) {
  return (
    <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
      {quickSuggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          className="shrink-0 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-accent/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

function ChatFocusHeader({
  totalMessages,
  hiddenMessagesCount,
  showFullHistory,
  recentHistory,
  searchQuery,
  searchResults,
  disabled,
  onToggleHistory,
  onSearchChange,
  onClearSearch,
  onJumpToMessage,
  onPickSuggestion
}: {
  totalMessages: number;
  hiddenMessagesCount: number;
  showFullHistory: boolean;
  recentHistory: AiMessage[];
  searchQuery: string;
  searchResults: ConversationSearchResult[];
  disabled: boolean;
  onToggleHistory: () => void;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  onJumpToMessage: (messageId: string) => void;
  onPickSuggestion: (prompt: string) => void;
}) {
  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-aura">
              {showFullHistory ? "Histórico completo" : "Modo foco"}
            </p>
            {totalMessages > 0 && (
              <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-400">
                {showFullHistory
                  ? `${totalMessages} mensagens`
                  : hiddenMessagesCount > 0
                    ? `últimas ${Math.min(FOCUSED_MESSAGE_COUNT, totalMessages)} mensagens`
                    : `${totalMessages} mensagens`}
              </span>
            )}
            {hasSearch && (
              <span className="rounded-full border border-accent/25 bg-accent/[0.08] px-2.5 py-1 text-[0.68rem] font-semibold text-aura">
                {searchResults.length} resultado{searchResults.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {recentHistory.length > 0 ? (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {recentHistory.map((message) => (
                <button
                  key={`history-${message.id}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPickSuggestion(repairMojibake(message.content))}
                  className="max-w-52 shrink-0 truncate rounded-full border border-white/10 bg-black/25 px-3 py-2 text-xs font-medium text-slate-300 transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-accent/35 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  title={repairMojibake(message.content)}
                >
                  {summarizeHistoryLabel(message.content)}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">A conversa começa limpa, com o input sempre acessível.</p>
          )}
        </div>

        {hiddenMessagesCount > 0 || showFullHistory ? (
          <button
            type="button"
            onClick={onToggleHistory}
            className="min-h-11 rounded-full border border-accent/25 bg-accent/[0.08] px-4 py-2 text-xs font-semibold text-aura transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-accent/45 hover:bg-accent/[0.12] active:scale-[0.98]"
          >
            {showFullHistory ? "Voltar ao foco" : `Ver histórico (${hiddenMessagesCount})`}
          </button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/25 p-2">
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-transparent px-3 text-sm text-slate-200 transition-[background-color,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] focus-within:border-accent/35 focus-within:bg-white/[0.035]">
          <Search className="h-4 w-4 shrink-0 text-aura" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar nesta conversa..."
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
            aria-label="Buscar nesta conversa"
          />
          {hasSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.68rem] font-semibold text-slate-400 transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-accent/30 hover:text-white active:scale-[0.96]"
            >
              Limpar
            </button>
          )}
        </label>

        {hasSearch && (
          <div className="mt-2 max-h-52 space-y-2 overflow-y-auto pr-1">
            {searchResults.length > 0 ? (
              searchResults.slice(0, 8).map((result) => (
                <button
                  key={`search-${result.message.id}`}
                  type="button"
                  onClick={() => onJumpToMessage(result.message.id)}
                  className="grid w-full gap-1 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-left transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-accent/35 hover:bg-white/[0.055] active:scale-[0.99]"
                >
                  <span className="flex items-center justify-between gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-aura">
                    {result.message.role === "user" ? "Você" : "Tutor IA"}
                    <span className="font-normal normal-case tracking-normal text-slate-500">
                      {formatMessageTime(result.message.created_at)}
                    </span>
                  </span>
                  <span className="line-clamp-2 text-xs leading-5 text-slate-300">{result.excerpt}</span>
                </button>
              ))
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3 text-sm text-muted">
                Nenhum trecho encontrado nessa conversa.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PresentationPanel({
  values,
  disabled,
  onChange,
  onSubmit
}: {
  values: PresentationFormState;
  disabled: boolean;
  onChange: (values: PresentationFormState) => void;
  onSubmit: (values: PresentationFormState) => void;
}) {
  function update(key: keyof PresentationFormState, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <Card className="premium-glow">
      <div className="flex items-center gap-2 text-aura">
        <Presentation className="h-4 w-4" />
        <p className="text-xs font-medium uppercase tracking-[0.18em]">Apresentação IA</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        Gere um PDF premium com 10 slides, plano de execução, checkpoints e próxima missão.
      </p>
      <div className="mt-3 rounded-lg border border-accent/25 bg-accent/[0.08] p-3 text-xs font-semibold text-aura">
        Esta apresentação utilizará {PRESENTATION_COST} créditos e será baixada em PDF.
      </div>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1">
          <span className="text-[0.64rem] uppercase tracking-[0.12em] text-muted">Tipo</span>
          <select
            value={values.template}
            onChange={(event) => update("template", event.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-slate-100 outline-none focus:border-accent/40"
          >
            {presentationTemplates.map((template) => (
              <option key={template}>{template}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-[0.64rem] uppercase tracking-[0.12em] text-muted">Pedido</span>
          <textarea
            value={values.request}
            onChange={(event) => update("request", event.target.value)}
            className="min-h-24 resize-none rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs leading-5 text-slate-100 outline-none placeholder:text-slate-600 focus:border-accent/40"
            placeholder="Ex: Quero sair de 600 para 900 na redação."
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <ToolInput label="Curso" value={values.course} onChange={(value) => update("course", value)} />
          <ToolInput label="Data/meta" value={values.examDate} onChange={(value) => update("examDate", value)} />
        </div>
        <ToolInput label="Horas por dia" value={values.hoursPerDay} onChange={(value) => update("hoursPerDay", value)} />
        <ToolInput label="Dificuldades" value={values.difficultSubjects} onChange={(value) => update("difficultSubjects", value)} />
      </div>
      <button
        type="button"
        disabled={disabled || values.request.trim().length < 12}
        onClick={() => onSubmit(values)}
        className="mt-4 min-h-11 w-full rounded-lg border border-accent/30 bg-accent/20 px-3 py-2 text-xs font-semibold text-aura shadow-[0_0_28px_rgba(58,167,216,0.16)] transition hover:bg-accent/25 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-slate-600"
      >
        Gerar PDF
      </button>
    </Card>
  );
}

function FileUploadPanel({
  disabled,
  onSubmit
}: {
  disabled: boolean;
  onSubmit: (file: File, toolName: string, prompt: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [toolName, setToolName] = useState(fileTools[0]);
  const [prompt, setPrompt] = useState("");

  function selectFile(nextFile?: File) {
    if (!nextFile) return;
    setFile(nextFile);
    if (nextFile.type === "application/pdf") setToolName("Resumir PDF");
    if (nextFile.type.startsWith("image/")) setToolName("Explicar imagem");
  }

  return (
    <Card className="premium-glow">
      <div className="flex items-center gap-2 text-aura">
        <Paperclip className="h-4 w-4" />
        <p className="text-xs font-medium uppercase tracking-[0.18em]">Anexar arquivo</p>
      </div>
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          selectFile(event.dataTransfer.files[0]);
        }}
        className="mt-4 grid cursor-pointer place-items-center rounded-lg border border-dashed border-white/15 bg-black/25 p-4 text-center transition hover:border-accent/40"
      >
        <UploadCloud className="h-6 w-6 text-aura" />
        <span className="mt-2 text-sm font-semibold text-white">{file ? file.name : "Clique ou arraste aqui"}</span>
        <span className="mt-1 text-xs leading-5 text-muted">PDF até 10MB. PNG, JPG, JPEG ou WEBP até 5MB.</span>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
      </label>
      <select
        value={toolName}
        onChange={(event) => setToolName(event.target.value)}
        className="mt-3 h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-slate-200 outline-none focus:border-accent/40"
      >
        {fileTools.map((tool) => <option key={tool}>{tool}</option>)}
      </select>
      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Pedido opcional: resumir, explicar, criar questões..."
        className="mt-3 min-h-20 w-full resize-none rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-accent/40"
      />
      <button
        type="button"
        disabled={!file || disabled}
        onClick={() => {
          if (!file) return;
          onSubmit(file, toolName, prompt || `Use a ferramenta ${toolName}.`);
          setFile(null);
          setPrompt("");
        }}
        className="mt-3 min-h-10 w-full rounded-lg border border-accent/30 bg-accent/15 px-3 py-2 text-xs font-semibold text-aura transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-slate-600"
      >
        Enviar arquivo · 2 créditos
      </button>
    </Card>
  );
}

function VoicePanel({
  disabled,
  listening,
  onTranscribe,
  onSummary
}: {
  disabled: boolean;
  listening: boolean;
  onTranscribe: () => void;
  onSummary: () => void;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-aura">
        <Mic className="h-4 w-4" />
        <p className="text-xs font-medium uppercase tracking-[0.18em]">Áudio</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        Use o microfone do navegador. Não salvamos gravação.
      </p>
      <div className="mt-3 grid gap-2">
        <button
          type="button"
          disabled={disabled || listening}
          onClick={onTranscribe}
          className="min-h-10 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-accent/35 disabled:opacity-40"
        >
          {listening ? "Ouvindo..." : "Transcrever áudio · 2 créditos"}
        </button>
        <button
          type="button"
          disabled={disabled || listening}
          onClick={onSummary}
          className="min-h-10 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-accent/35 disabled:opacity-40"
        >
          Criar resumo de áudio · 2 créditos
        </button>
      </div>
    </Card>
  );
}

function ToolsPanel({
  values,
  disabled,
  onChange,
  onRun
}: {
  values: ToolFormState;
  disabled: boolean;
  onChange: (values: ToolFormState) => void;
  onRun: (toolName: string, prompt: string) => void;
}) {
  function update(key: keyof ToolFormState, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <Card>
      <div className="flex items-center gap-2 text-aura">
        <Sparkles className="h-4 w-4" />
        <p className="text-xs font-medium uppercase tracking-[0.18em]">Ferramentas IA</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">Atalhos de texto. Cada ferramenta usa 2 créditos.</p>
      <div className="mt-4 space-y-4">
        <ToolBox
          icon={<CalendarDays className="h-4 w-4" />}
          title="Plano de Estudo"
          disabled={disabled}
          onRun={() => onRun("Plano de Estudo", `Monte um plano de estudo prático para ${values.subject}, com prazo de ${values.deadline} e ${values.hoursPerDay} por dia. Entregue por dias, prioridades e revisões.`)}
        >
          <ToolInput label="Matéria" value={values.subject} onChange={(value) => update("subject", value)} />
          <ToolInput label="Prazo" value={values.deadline} onChange={(value) => update("deadline", value)} />
          <ToolInput label="Horas/dia" value={values.hoursPerDay} onChange={(value) => update("hoursPerDay", value)} />
        </ToolBox>

        <ToolBox
          icon={<BookOpen className="h-4 w-4" />}
          title="Repertório ENEM"
          disabled={disabled}
          onRun={() => onRun("Repertório ENEM", `Indique repertórios úteis para o tema "${values.theme}". Explique como usar na redação e dê exemplos de frases.`)}
        >
          <ToolInput label="Tema" value={values.theme} onChange={(value) => update("theme", value)} />
        </ToolBox>

        <ToolBox
          icon={<Target className="h-4 w-4" />}
          title="Melhorar Competência"
          disabled={disabled}
          onRun={() => onRun("Melhorar Competência", `Faça um diagnóstico prático para melhorar a ${values.competency} da redação ENEM. Entregue um exercício prático e uma ação curta para hoje.`)}
        >
          <ToolInput label="Competência" value={values.competency} onChange={(value) => update("competency", value)} />
        </ToolBox>

        <ToolBox
          icon={<SendHorizonal className="h-4 w-4" />}
          title="Simular Tema"
          disabled={disabled}
          onRun={() => onRun("Simular Tema", `Crie um tema modelo ENEM sobre "${values.socialProblem}". Traga ideias de argumentos e repertórios possíveis.`)}
        >
          <ToolInput label="Área/problema" value={values.socialProblem} onChange={(value) => update("socialProblem", value)} />
        </ToolBox>
      </div>
    </Card>
  );
}

function ToolBox({
  title,
  icon,
  disabled,
  children,
  onRun
}: {
  title: string;
  icon: React.ReactNode;
  disabled: boolean;
  children: React.ReactNode;
  onRun: () => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <span className="text-aura">{icon}</span>
        {title}
      </div>
      <div className="mt-3 grid gap-2">{children}</div>
      <button
        type="button"
        disabled={disabled}
        onClick={onRun}
        className="mt-3 min-h-9 w-full rounded-lg border border-accent/30 bg-accent/15 px-3 py-2 text-xs font-semibold text-aura transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-slate-600"
      >
        Executar · 2 créditos
      </button>
    </div>
  );
}

function ToolInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[0.64rem] uppercase tracking-[0.12em] text-muted">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-lg border border-white/10 bg-white/[0.045] px-3 text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-accent/40"
      />
    </label>
  );
}

function MessageBubble({
  message,
  highlighted = false
}: {
  message: AiMessage;
  highlighted?: boolean;
}) {
  const isUser = message.role === "user";
  const normalizedContent = repairMojibake(message.content);
  const essayLabel = normalizedContent.startsWith("[REDAÇÃO PARA CORREÇÃO]");
  const fileLabel = normalizedContent.startsWith("[ARQUIVO:");
  const presentationLabel = normalizedContent.startsWith("[APRESENTAÇÃO SOLICITADA]") || normalizedContent.startsWith("[APRESENTACAO SOLICITADA]");
  const presentationPdf = !isUser ? parsePresentationPdf(normalizedContent) : null;
  const presentation = !isUser ? parsePresentation(normalizedContent) : null;
  const content = essayLabel
    ? "Redação enviada para correção."
    : presentationLabel
      ? normalizedContent.split("\n").slice(0, 3).join("\n")
      : fileLabel
      ? normalizedContent.split("\n").slice(0, 3).join("\n")
      : formatAssistantContent(normalizedContent);

  return (
    <div
      id={messageDomId(message.id)}
      className={`scroll-mt-32 rounded-xl transition-[background-color,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        highlighted ? "bg-[#f2c94c]/10 shadow-[0_16px_44px_rgba(2,7,15,0.3)]" : "bg-transparent"
      }`}
    >
      <div className={`flex w-full gap-3 p-1 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f2c94c] text-[#08111f]">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={`group rounded-xl border shadow-[0_14px_36px_rgba(2,7,15,0.24)] ${
          isUser
            ? "max-w-[88%] rounded-br-sm border-[#35bfe7]/35 bg-[#12637a] px-4 py-3 text-sm leading-7 text-white sm:max-w-[75%]"
            : "min-w-0 w-full max-w-[76ch] rounded-bl-sm border-[#8fa3b8]/15 border-l-[#35bfe7]/45 bg-[#0f1e31]/80 px-5 py-4 text-base leading-7 text-[#dce6ec] sm:px-6 sm:py-5"
        }`}
      >
        <div className={`mb-2 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] ${isUser ? "text-[#f4f1e8]/80" : "text-aura"}`}>
          <span>{isUser ? "Você" : "Tutor IA"}</span>
          <span className={isUser ? "text-white/35" : "text-slate-600"}>·</span>
          <span className={isUser ? "text-white/55" : "text-slate-500"}>{formatMessageTime(message.created_at)}</span>
        </div>
        {presentationPdf ? (
          <PresentationPdfCard payload={presentationPdf} />
        ) : presentation ? (
          <PresentationLegacyCard deck={presentation} />
        ) : (
          <FormattedMessage content={content} isUser={isUser} />
        )}
      </div>
      {isUser && (
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300">
          <UserRound className="h-4 w-4" />
        </div>
      )}
      </div>
    </div>
  );
}

function FormattedMessage({ content, isUser }: { content: string; isUser: boolean }) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n{2,}/).filter(Boolean);

  return (
    <div className={isUser ? "space-y-3 text-white" : "space-y-4 text-slate-200"}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((line) => line.trim().length > 0);
        if (lines.length > 1) {
          return (
            <div key={`${block}-${blockIndex}`} className="space-y-2">
              {lines.map((line, lineIndex) => (
                <MessageLine key={`${line}-${lineIndex}`} line={line} isUser={isUser} />
              ))}
            </div>
          );
        }
        return <MessageLine key={`${block}-${blockIndex}`} line={block} isUser={isUser} />;
      })}
    </div>
  );
}

function MessageLine({ line, isUser }: { line: string; isUser: boolean }) {
  const cleanLine = line.trim();
  const bulletMatch = cleanLine.match(/^[-*•]\s+(.+)/);
  const numberMatch = cleanLine.match(/^(\d+)[\).]\s+(.+)/);
  const markdownHeading = cleanLine.match(/^#{1,4}\s+(.+)/);
  const heading = cleanLine
    .replace(/^#{1,4}\s*/, "")
    .replace(/^\*\*(.+)\*\*$/, "$1");
  const looksLikeHeading = !isUser && !bulletMatch && !numberMatch && heading.length <= 80 && (Boolean(markdownHeading) || /[:：]$/.test(heading) || /^competência\s+\d/i.test(heading));

  if (bulletMatch || numberMatch) {
    const marker = numberMatch?.[1] ?? "";
    const text = bulletMatch?.[1] ?? numberMatch?.[2] ?? cleanLine;
    return (
      <div className="flex items-start gap-3">
        {marker ? (
          <span className={`mt-0.5 min-w-5 shrink-0 font-mono text-xs font-semibold tabular-nums ${isUser ? "text-white/75" : "text-[#35bfe7]"}`}>
            {marker}.
          </span>
        ) : (
          <span className={`mt-[0.68rem] h-1.5 w-1.5 shrink-0 rounded-full ${isUser ? "bg-white/80" : "bg-[#35bfe7]"}`} />
        )}
        <p className="min-w-0 break-words"><InlineText text={text} isUser={isUser} /></p>
      </div>
    );
  }

  if (looksLikeHeading) {
    return <h3 className="pt-2 text-base font-semibold leading-6 text-white"><InlineText text={heading.replace(/:$/, "")} isUser={isUser} /></h3>;
  }

  return <p className="break-words"><InlineText text={cleanLine} isUser={isUser} /></p>;
}

function InlineText({ text, isUser }: { text: string; isUser: boolean }) {
  const segments = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return <strong key={`${segment}-${index}`} className="font-semibold text-white">{segment.slice(2, -2)}</strong>;
    }

    if (segment.startsWith("`") && segment.endsWith("`")) {
      return (
        <code
          key={`${segment}-${index}`}
          className={`rounded px-1.5 py-0.5 font-mono text-[0.86em] ${isUser ? "bg-black/20 text-white" : "bg-black/30 text-[#b9e9f7]"}`}
        >
          {segment.slice(1, -1)}
        </code>
      );
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
}

function PresentationDeckView({ deck }: { deck: PresentationDeck }) {
  const slides = Array.isArray(deck.slides) ? deck.slides : [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-accent/25 bg-accent/[0.08] p-4 shadow-[0_0_32px_rgba(58,167,216,0.14)]">
        <div className="flex flex-wrap items-center gap-2 text-aura">
          <Layers3 className="h-4 w-4" />
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">{deck.template ?? "Apresentação"}</span>
        </div>
        <h3 className="mt-3 text-2xl font-semibold leading-tight text-white">{deck.title ?? "Apresentação AprovaAI"}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">{deck.objective ?? "Plano de execução gerado para orientar seus estudos."}</p>
        <p className="mt-3 text-xs font-semibold text-muted">Tempo estimado: {deck.estimatedExecutionTime ?? "Sob medida"}</p>
      </div>

      <div className="grid gap-3">
        {slides.map((slide, index) => (
          <article
            key={`${slide.title}-${index}`}
            className="rounded-xl border border-white/10 bg-black/25 p-4 transition hover:border-accent/30 hover:bg-white/[0.055]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-aura">Slide {index + 1}</p>
                <h4 className="mt-1 text-lg font-semibold text-white">{slide.title}</h4>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-aura" />
            </div>
            {slide.objective && <p className="mt-2 text-sm leading-6 text-slate-400">{slide.objective}</p>}
            <ul className="mt-3 space-y-2">
              {(Array.isArray(slide.bullets) ? slide.bullets : []).map((bullet) => (
                <li key={bullet} className="flex gap-2 text-sm leading-6 text-slate-200">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-aura shadow-[0_0_12px_rgba(159,207,139,0.7)]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            {slide.mission && (
              <div className="mt-3 rounded-lg border border-accent/20 bg-accent/[0.07] p-3 text-xs font-semibold leading-5 text-aura">
                Missão: {slide.mission}
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">Próxima ação</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-white">{deck.nextAction ?? "Escolha uma tarefa e execute ainda hoje."}</p>
      </div>
    </div>
  );
}

function PresentationPdfCard({ payload }: { payload: PresentationPdfPayload }) {
  const deck = payload.deck;
  const slides = Array.isArray(deck?.slides) ? deck.slides : [];
  const canDownload = Boolean(payload.pdfBase64);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-accent/25 bg-accent/[0.08] p-4 shadow-[0_0_32px_rgba(58,167,216,0.14)]">
        <div className="flex flex-wrap items-center gap-2 text-aura">
          <Layers3 className="h-4 w-4" />
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">PDF pronto</span>
        </div>
        <h3 className="mt-3 text-2xl font-semibold leading-tight text-white">{payload.title ?? deck?.title ?? "Apresentação AprovaAI"}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">{deck?.objective ?? "PDF gerado para orientar sua execução."}</p>
        <div className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-muted sm:grid-cols-3">
          <span>{slides.length} slides</span>
          <span>{deck?.estimatedExecutionTime ?? "Sob medida"}</span>
          <span>{payload.fileName ?? "apresentacao-aprovaai.pdf"}</span>
        </div>
        {canDownload ? (
          <button
            type="button"
            onClick={() => downloadBase64Pdf(payload.pdfBase64 as string, payload.fileName)}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#f2c94c] px-4 py-2 text-sm font-semibold text-[#08111f] transition-colors duration-150 hover:bg-[#f8d866]"
          >
            <Download className="h-4 w-4" />
            Baixar PDF
          </button>
        ) : (
          <p className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3 text-xs leading-5 text-muted">
            O PDF foi baixado no momento da geração. Para baixar novamente, gere uma nova versão pelo painel lateral.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">Próxima ação</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-white">{deck?.nextAction ?? "Baixe o PDF e execute a primeira missão."}</p>
      </div>
    </div>
  );
}

function PresentationLegacyCard({ deck }: { deck: PresentationDeck }) {
  return (
    <div className="rounded-xl border border-amber-300/20 bg-amber-400/[0.06] p-4">
      <div className="flex flex-wrap items-center gap-2 text-amber-100">
        <Layers3 className="h-4 w-4" />
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">Apresentação antiga</span>
      </div>
      <h3 className="mt-3 text-xl font-semibold leading-tight text-white">{deck.title ?? "Apresentação AprovaAI"}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Esta apresentação foi gerada antes do modo PDF. Gere novamente pelo painel lateral para receber o arquivo pronto para baixar.
      </p>
    </div>
  );
}

function parsePresentation(content: string): PresentationDeck | null {
  try {
    const parsed = JSON.parse(content) as PresentationDeck;
    return parsed.type === "presentation" && Array.isArray(parsed.slides) ? parsed : null;
  } catch {
    return null;
  }
}

function isLegacyPresentationHistoryMessage(message: AiMessage) {
  const normalized = repairMojibake(message.content).trim();
  const marker = normalized.toLocaleUpperCase("pt-BR");

  return (
    marker.startsWith("[APRESENTAÇÃO SOLICITADA]") ||
    marker.startsWith("[APRESENTACAO SOLICITADA]") ||
    parsePresentation(normalized) !== null ||
    parsePresentationPdf(normalized) !== null
  );
}

function parsePresentationPdf(content: string): PresentationPdfPayload | null {
  try {
    const parsed = JSON.parse(stripPdfBase64(content)) as PresentationPdfPayload;
    return parsed.type === "presentation_pdf" && Boolean(parsed.deck) && typeof parsed.deck === "object"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function formatAssistantContent(content: string) {
  try {
    const parsed = JSON.parse(stripPdfBase64(content)) as { type?: string; estimatedScore?: number; summary?: string; title?: string };
    if (parsed.type === "essay_review") {
      return `Correção de redação concluída. Nota estimada: ${parsed.estimatedScore ?? 0}/1000. ${parsed.summary ?? ""}`;
    }
    if (parsed.type === "presentation_pdf") {
      return `PDF de apresentação pronto: ${parsed.title ?? "Apresentação AprovaAI"}.`;
    }
    if (parsed.type === "presentation") {
      return `Apresentação antiga: ${parsed.title ?? "Apresentação AprovaAI"}.`;
    }
  } catch {
    return content;
  }
  return content;
}

function normalizeAiMessageForClient(message: AiMessage): AiMessage {
  return {
    ...message,
    content: stripPdfBase64(repairMojibake(message.content))
  };
}

function stripPdfBase64(content: string) {
  if (!content.includes("pdfBase64")) return content;
  return content.replace(/,\s*"pdfBase64"\s*:\s*"[^"]*"/, "");
}

function downloadBase64Pdf(base64: string, fileName: string) {
  if (typeof window === "undefined") return;
  const binary = window.atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName || "apresentacao-aprovaai.pdf";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function findConversationMatches(messages: AiMessage[], query: string): ConversationSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  return messages.reduce<ConversationSearchResult[]>((matches, message) => {
    const content = formatAssistantContent(repairMojibake(message.content)).slice(0, 4_000);
    const normalizedContent = normalizeSearchText(content);
    if (!normalizedContent.includes(normalizedQuery)) return matches;

    matches.push({
      message,
      excerpt: buildSearchExcerpt(content, normalizedQuery)
    });
    return matches;
  }, []);
}

function buildSearchExcerpt(content: string, normalizedQuery: string) {
  const cleanLines = content
    .replace(/\[(ARQUIVO|APRESENTAÇÃO|APRESENTACAO|REDAÇÃO|REDACAO)[^\]]*\]/gi, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const matchedLine = cleanLines.find((line) => normalizeSearchText(line).includes(normalizedQuery)) ?? cleanLines[0] ?? "Mensagem encontrada.";
  return matchedLine.length > 150 ? `${matchedLine.slice(0, 147)}...` : matchedLine;
}

function normalizeSearchText(value: string) {
  return repairMojibake(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function messageDomId(messageId: string) {
  return `chat-message-${messageId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function summarizeHistoryLabel(content: string) {
  const clean = repairMojibake(content)
    .replace(/\[(ARQUIVO|APRESENTAÇÃO|APRESENTACAO|REDAÇÃO|REDACAO)[^\]]*\]/gi, "")
    .split("\n")
    .find((line) => line.trim().length > 0)
    ?.trim() ?? "Mensagem anterior";

  return clean.length > 64 ? `${clean.slice(0, 61)}...` : clean;
}

function normalizePlanTag(value: unknown): PlanTag {
  return value === "premium" || value === "ADM" ? value : "free";
}

function formatPlanTag(planTag: PlanTag) {
  if (planTag === "ADM") return "ADM";
  return planTag === "premium" ? "Premium" : "Free";
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function repairMojibake(value: string) {
  if (!/[ÃÂâ]/.test(value)) return value;

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (decoded && !decoded.includes("�")) return decoded;
  } catch {
    // Fallback below keeps old saved history readable without touching storage.
  }

  const replacements: Array<[RegExp, string]> = [
    [/Ã¡/g, "á"],
    [/Ã /g, "à"],
    [/Ã¢/g, "â"],
    [/Ã£/g, "ã"],
    [/Ã©/g, "é"],
    [/Ãª/g, "ê"],
    [/Ã­/g, "í"],
    [/Ã³/g, "ó"],
    [/Ã´/g, "ô"],
    [/Ãµ/g, "õ"],
    [/Ãº/g, "ú"],
    [/Ã§/g, "ç"],
    [/Ã/g, "Á"],
    [/Ã‡/g, "Ç"],
    [/Â·/g, "·"],
    [/â€¦/g, "..."],
    [/â€”|â€“/g, "-"]
  ];

  return replacements.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), value);
}


