
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bot, CreditCard, Sparkles, UserRound } from "lucide-react";

import { Card } from "@/components/ui";
import { AiInput } from "@/components/ui/ai-input";
import { Loader } from "@/components/ui/loader-15";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { AiMessage } from "@/lib/ai/types";

export function Comandante() {
  const router = useRouter();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
        setError("Não foi possível carregar o histórico do Comandante.");
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
  }, [messages, sending]);

  async function sendMessage(content: string) {
    const supabase = getSupabaseClient();
    if (!supabase || sending || (balance ?? 0) < 1) return;

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
        body: JSON.stringify({ message: content })
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
      setError(requestError instanceof Error ? requestError.message : "Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas">
        <Loader size="lg" />
      </main>
    );
  }

  const hasCredits = (balance ?? 0) > 0;

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
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-aura">Módulo ativo</p>
              <h1 className="truncate text-xl font-semibold text-white sm:text-2xl">Comandante IA</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/[0.08] px-3 py-2 shadow-[0_0_24px_rgba(124,58,237,0.14)]">
            <CreditCard className="h-4 w-4 text-aura" />
            <span className="text-sm font-semibold text-white">{balance ?? 0}</span>
            <span className="hidden text-xs text-muted sm:inline">créditos</span>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 pt-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <Card className="flex min-h-[70dvh] min-w-0 flex-col overflow-hidden p-0 lg:min-h-0">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {messages.length === 0 ? (
                <div className="grid h-full min-h-[400px] place-items-center text-center">
                  <div>
                    <div className="ai-orb mx-auto h-28 w-28" aria-hidden="true">
                      <div className="ai-orb-core" />
                    </div>
                    <p className="mt-7 text-xs font-medium uppercase tracking-[0.22em] text-aura">Canal aberto</p>
                    <h2 className="mt-3 text-3xl font-semibold text-white">Qual é o bloqueio da missão?</h2>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">
                      Tire dúvidas do ENEM, organize sua rotina ou peça uma estratégia objetiva para avançar hoje.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {sending && (
                    <div className="flex items-center gap-3 text-sm text-muted">
                      <Loader size="sm" />
                      Comandante recalculando a rota...
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
            <div className="border-t border-white/10 bg-black/30 p-3 sm:p-4">
              {error && <p className="mb-3 text-sm text-rose-200">{error}</p>}
              {!hasCredits && (
                <p className="mb-3 rounded-lg border border-rose-400/20 bg-rose-500/[0.07] p-3 text-sm text-rose-100">
                  Você ficou sem créditos.
                </p>
              )}
              <AiInput
                disabled={!hasCredits}
                loading={sending}
                placeholder={hasCredits ? "Pergunte ao Comandante IA..." : "Saldo esgotado"}
                onSubmit={(message) => void sendMessage(message)}
              />
              <p className="mt-2 text-center text-[0.68rem] text-slate-600">
                Cada pergunta consome 1 crédito. Confirme informações críticas em fontes oficiais.
              </p>
            </div>
          </Card>

          <aside className="grid content-start gap-4">
            <Card className="premium-glow">
              <div className="flex items-center gap-2 text-aura">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs font-medium uppercase tracking-[0.18em]">Diretriz</p>
              </div>
              <p className="mt-4 text-lg font-semibold leading-7 text-white">
                Ninguém está vindo te salvar, então faça acontecer.
              </p>
            </Card>
            <Card>
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-aura" />
                <h2 className="font-semibold text-white">Especialidades</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li>Estratégia para o ENEM</li>
                <li>Organização e rotina</li>
                <li>Técnicas de estudo</li>
                <li>Dúvidas de matérias</li>
                <li>Orientação de redação</li>
              </ul>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

function MessageBubble({ message }: { message: AiMessage }) {
  const isUser = message.role === "user";
  const essayLabel = message.content.startsWith("[REDAÇÃO PARA CORREÇÃO]");

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-aura">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={`max-w-[88%] whitespace-pre-wrap rounded-lg border px-4 py-3 text-sm leading-6 sm:max-w-[76%] ${
          isUser
            ? "border-accent/25 bg-accent/15 text-slate-100"
            : "border-white/10 bg-white/[0.045] text-slate-200"
        }`}
      >
        {essayLabel ? "Redação enviada para correção." : formatAssistantContent(message.content)}
      </div>
      {isUser && (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400">
          <UserRound className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function formatAssistantContent(content: string) {
  try {
    const parsed = JSON.parse(content) as { type?: string; estimatedScore?: number; summary?: string };
    if (parsed.type === "essay_review") {
      return `Correção de redação concluída. Nota estimada: ${parsed.estimatedScore ?? 0}/1000. ${parsed.summary ?? ""}`;
    }
  } catch {
    return content;
  }
  return content;
}
