"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import {
  ArrowLeft,
  Bot,
  CreditCard,
  Mic,
  Paperclip,
  Sparkles,
  UploadCloud,
  Volume2
} from "lucide-react";

import { Card } from "@/components/ui";
import { AiInput } from "@/components/ui/ai-input";
import { Loader } from "@/components/ui/loader-15";
import type { AiMessage } from "@/lib/ai/types";
import { getSupabaseClient } from "@/lib/supabase/client";

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type FileTool = {
  name: string;
  prompt: string;
};

const TEXT_COST = 1;
const TOOL_COST = 2;
const FILE_COST = 3;
const PDF_MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

const quickSuggestions = [
  "Monte meu plano de estudo para esta semana",
  "Explique um tema provavel de redacao",
  "Como melhorar minha competencia 3?",
  "Crie uma missao de revisao para hoje"
];

const fileTools: FileTool[] = [
  {
    name: "RESUMIR PDF",
    prompt: "Resuma este PDF em topicos claros, com pontos cobraveis no ENEM e uma tarefa de revisao."
  },
  {
    name: "EXPLICAR ARQUIVO",
    prompt: "Explique o conteudo do arquivo de forma didatica e transforme em acao pratica de estudo."
  },
  {
    name: "GERAR QUESTOES",
    prompt: "Gere questoes de treino com gabarito comentado a partir do conteudo extraido."
  },
  {
    name: "EXPLICAR IMAGEM",
    prompt: "Explique o texto extraido da imagem e aponte o que o aluno deve fazer agora."
  },
  {
    name: "ANALISAR REDACAO POR FOTO",
    prompt: "Analise a redacao fotografada usando criterios do ENEM. Seja rigoroso e indique melhorias."
  }
];

export function Comandante() {
  const router = useRouter();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [fileSending, setFileSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
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

      const [historyResult, creditsResult] = await Promise.all([
        supabase
          .from("ai_messages")
          .select("id,role,content,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(60),
        supabase.from("user_credits").select("balance").eq("user_id", user.id).maybeSingle()
      ]);

      if (!active) return;
      if (historyResult.error || creditsResult.error) {
        setError("Nao foi possivel carregar o historico do Comandante.");
      } else {
        setMessages([...(historyResult.data as AiMessage[])].reverse());
        setBalance(creditsResult.data?.balance ?? 0);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, fileSending]);

  async function getAccessToken() {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Cliente Supabase indisponivel.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Sessao expirada.");
    return token;
  }

  async function sendMessage(content: string, options: { mode?: "chat" | "tool"; toolName?: string } = {}) {
    const cost = options.mode === "tool" ? TOOL_COST : TEXT_COST;
    if (sending || fileSending) return;
    if ((balance ?? 0) < cost) {
      setError(cost === TEXT_COST ? "Voce ficou sem creditos." : `Voce precisa de ${cost} creditos para esta ferramenta.`);
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
      const token = await getAccessToken();
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: content,
          mode: options.mode ?? "chat",
          toolName: options.toolName
        })
      });
      const result = (await response.json()) as { reply?: string; balance?: number; error?: string };
      if (!response.ok || !result.reply) throw new Error(result.error || "Falha ao consultar o Comandante.");

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.reply as string,
          created_at: new Date().toISOString()
        }
      ]);
      setBalance(result.balance ?? balance);
    } catch (requestError) {
      setMessages((current) => current.filter((message) => message.id !== optimisticMessage.id));
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  function validateFile(file: File) {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) return "Formato nao aceito. Envie PDF, PNG, JPG, JPEG ou WEBP.";
    if (file.type === "application/pdf" && file.size > PDF_MAX_BYTES) return "PDF deve ter no maximo 10MB.";
    if (file.type !== "application/pdf" && file.size > IMAGE_MAX_BYTES) return "Imagem deve ter no maximo 5MB.";
    return "";
  }

  function chooseFile(file: File | null) {
    if (!file) return;
    const validation = validateFile(file);
    setFileError(validation);
    setSelectedFile(validation ? null : file);
  }

  async function sendFile(tool: FileTool) {
    if (!selectedFile || sending || fileSending) return;
    if ((balance ?? 0) < FILE_COST) {
      setError("Voce precisa de 3 creditos para analisar arquivo.");
      return;
    }

    const optimisticMessage: AiMessage = {
      id: `file-${Date.now()}`,
      role: "user",
      content: `[ARQUIVO: ${selectedFile.name}]\nFerramenta: ${tool.name}`,
      created_at: new Date().toISOString()
    };
    setMessages((current) => [...current, optimisticMessage]);
    setFileSending(true);
    setError("");

    try {
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("toolName", tool.name);
      formData.append("prompt", tool.prompt);

      const response = await fetch("/api/ai/file", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const result = (await response.json()) as { reply?: string; balance?: number; error?: string };
      if (!response.ok || !result.reply) throw new Error(result.error || "Nao foi possivel analisar o arquivo.");

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
      setSelectedFile(null);
    } catch (requestError) {
      setMessages((current) => current.filter((message) => message.id !== optimisticMessage.id));
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel analisar o arquivo.");
    } finally {
      setFileSending(false);
    }
  }

  function startVoiceCommand(mode: "transcribe" | "summary") {
    if ((balance ?? 0) < TOOL_COST) {
      setError("Voce precisa de 2 creditos para usar audio.");
      return;
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Seu navegador nao liberou reconhecimento de voz. Use Chrome ou digite a mensagem.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    setError("");

    const timeout = window.setTimeout(() => recognition.stop(), 5 * 60 * 1000);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) {
        setError("Nao consegui entender o audio.");
        return;
      }
      const prompt = mode === "summary"
        ? `Audio transcrito do aluno: ${transcript}\n\nCrie um resumo de estudo e proximos passos.`
        : `Transcricao de audio do aluno: ${transcript}\n\nResponda e organize a duvida em acao pratica.`;
      void sendMessage(prompt, { mode: "tool", toolName: mode === "summary" ? "CRIAR RESUMO DE AUDIO" : "TRANSCREVER AUDIO" });
    };
    recognition.onerror = () => setError("Nao foi possivel capturar o audio.");
    recognition.onend = () => {
      window.clearTimeout(timeout);
      setListening(false);
    };
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

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    chooseFile(event.dataTransfer.files.item(0));
  }

  if (loading) {
    return (
      <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas">
        <Loader size="lg" />
      </main>
    );
  }

  const busy = sending || fileSending;

  return (
    <main className="mission-grid min-h-[100dvh] bg-canvas px-4 py-4 text-white sm:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-6xl flex-col lg:min-h-[calc(100dvh-3rem)]">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-accent/35 hover:text-white"
              aria-label="Voltar para a Central de controle"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Image
              src="/aprova-ai-logo-hd.png"
              alt="AprovaAI"
              width={1449}
              height={676}
              priority
              className="hidden h-9 w-auto object-contain sm:block"
            />
            <div className="min-w-0">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-aura">Modulo ativo</p>
              <h1 className="truncate text-xl font-semibold text-white sm:text-2xl">Comandante IA</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/[0.08] px-3 py-2 shadow-[0_0_24px_rgba(124,58,237,0.14)]">
            <CreditCard className="h-4 w-4 text-aura" />
            <span className="text-sm font-semibold text-white">{balance ?? 0}</span>
            <span className="hidden text-xs text-muted sm:inline">creditos</span>
          </div>
        </header>

        <section className="grid flex-1 gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_350px]">
          <Card className="flex min-h-[68dvh] flex-col p-0">
            <div className="border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-accent/30 bg-accent/[0.12] shadow-[0_0_30px_rgba(124,58,237,0.2)]">
                  <Bot className="h-5 w-5 text-aura" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Centro de comando</h2>
                  <p className="text-sm text-muted">Texto: 1 credito. Ferramentas e audio: 2. Arquivos: 3.</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="grid min-h-[260px] place-items-center text-center">
                  <div className="max-w-md">
                    <Sparkles className="mx-auto mb-4 h-8 w-8 text-aura" />
                    <h3 className="text-2xl font-semibold text-white">Ninguem esta vindo te salvar.</h3>
                    <p className="mt-2 text-sm text-muted">Envie texto, arquivo ou voz. O Comandante transforma isso em rota de estudo.</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => <MessageBubble key={message.id} message={message} onSpeak={speak} />)
              )}
              {(sending || fileSending) && (
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-muted">
                  <Loader size="sm" />
                  <span>{fileSending ? "Extraindo contexto do arquivo..." : "Comandante analisando..."}</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {error && <div className="mx-4 mb-3 rounded-lg border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>}

            <div className="border-t border-white/10 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {quickSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={busy || (balance ?? 0) < TEXT_COST}
                    onClick={() => void sendMessage(suggestion)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-200 transition hover:border-accent/35 hover:bg-accent/[0.08] disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <AiInput disabled={busy || (balance ?? 0) < TEXT_COST} loading={sending} onSubmit={(message) => void sendMessage(message)} />
            </div>
          </Card>

          <aside className="space-y-4">
            <Card className="space-y-4">
              <div>
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-aura">Anexar arquivo</p>
                <h3 className="mt-1 text-lg font-semibold text-white">PDF ou imagem</h3>
                <p className="mt-1 text-sm text-muted">PDF ate 10MB. PNG, JPG, JPEG ou WEBP ate 5MB. Consumo: 3 creditos.</p>
              </div>

              <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-accent/35 bg-accent/[0.06] p-4 text-center transition hover:bg-accent/[0.1]"
              >
                <UploadCloud className="mb-3 h-7 w-7 text-aura" />
                <span className="text-sm font-semibold text-white">Arraste ou selecione um arquivo</span>
                <span className="mt-1 max-w-full truncate text-xs text-muted">{selectedFile ? selectedFile.name : "PDF, PNG, JPG, JPEG, WEBP"}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => chooseFile(event.target.files?.item(0) ?? null)}
                />
              </label>
              {fileError && <p className="text-sm text-rose-200">{fileError}</p>}

              <div className="grid gap-2">
                {fileTools.map((tool) => (
                  <button
                    key={tool.name}
                    type="button"
                    disabled={!selectedFile || busy || (balance ?? 0) < FILE_COST}
                    onClick={() => void sendFile(tool)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-3 text-left text-sm font-semibold text-white transition hover:border-accent/35 hover:bg-accent/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>{tool.name}</span>
                    <span className="text-xs text-muted">3 creditos</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="space-y-4">
              <div>
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-aura">Voz</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Comando por audio</h3>
                <p className="mt-1 text-sm text-muted">Usa o reconhecimento do navegador. Nada e gravado permanentemente.</p>
              </div>
              <button
                type="button"
                disabled={busy || listening || (balance ?? 0) < TOOL_COST}
                onClick={() => startVoiceCommand("transcribe")}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.045] px-3 py-3 text-sm font-semibold text-white transition hover:border-accent/35 hover:bg-accent/[0.08] disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-2"><Mic className="h-4 w-4 text-aura" />TRANSCREVER AUDIO</span>
                <span className="text-xs text-muted">2 creditos</span>
              </button>
              <button
                type="button"
                disabled={busy || listening || (balance ?? 0) < TOOL_COST}
                onClick={() => startVoiceCommand("summary")}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.045] px-3 py-3 text-sm font-semibold text-white transition hover:border-accent/35 hover:bg-accent/[0.08] disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-2"><Paperclip className="h-4 w-4 text-aura" />CRIAR RESUMO DE AUDIO</span>
                <span className="text-xs text-muted">2 creditos</span>
              </button>
              {listening && <p className="text-sm text-aura">Ouvindo... limite de 5 minutos.</p>}
            </Card>
          </aside>
        </section>
      </div>
    </main>
  );
}

function MessageBubble({ message, onSpeak }: { message: AiMessage; onSpeak: (text: string) => void }) {
  const isAssistant = message.role === "assistant";
  return (
    <article className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[92%] rounded-lg border p-4 text-sm leading-7 sm:max-w-[78%] ${
          isAssistant
            ? "border-white/10 bg-white/[0.045] text-slate-100"
            : "border-accent/25 bg-accent/[0.13] text-white shadow-[0_0_24px_rgba(124,58,237,0.12)]"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {isAssistant && (
          <button
            type="button"
            onClick={() => onSpeak(message.content)}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-accent/35 hover:text-white"
          >
            <Volume2 className="h-3.5 w-3.5 text-aura" />
            Ouvir resposta
          </button>
        )}
      </div>
    </article>
  );
}
