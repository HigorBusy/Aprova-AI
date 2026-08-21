"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Coins,
  Database,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  X
} from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "spacekase925@gmail.com";
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

type AdminUser = {
  user_id: string;
  email: string;
  full_name: string;
  plan_tag: string;
  balance: number;
  is_blocked: boolean;
  last_seen_at: string | null;
  created_at: string;
};

type Feedback = { kind: "success" | "error"; text: string } | null;

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [messageUser, setMessageUser] = useState<AdminUser | null>(null);
  const [messageText, setMessageText] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [clock, setClock] = useState(() => Date.now());

  const loadUsers = useCallback(async (silent = false) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_tag")
      .eq("id", user.id)
      .maybeSingle<{ plan_tag: string }>();

    if (profile?.plan_tag !== "ADM") {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) {
      setFeedback({ kind: "error", text: "Não foi possível carregar os usuários." });
    } else {
      setUsers((data ?? []) as AdminUser[]);
      setAuthorized(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadUsers();
    const interval = window.setInterval(() => {
      setClock(Date.now());
      void loadUsers(true);
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [loadUsers]);

  const isOnline = useCallback(
    (user: AdminUser) =>
      !user.is_blocked &&
      Boolean(user.last_seen_at) &&
      clock - new Date(user.last_seen_at as string).getTime() <= ONLINE_WINDOW_MS,
    [clock]
  );

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) =>
      `${user.full_name} ${user.email} ${user.plan_tag}`.toLowerCase().includes(normalized)
    );
  }, [query, users]);

  const stats = useMemo(
    () => ({
      total: users.length,
      online: users.filter(isOnline).length,
      blocked: users.filter((user) => user.is_blocked).length,
      credits: users.reduce((total, user) => total + user.balance, 0)
    }),
    [isOnline, users]
  );

  async function runAction(userId: string, action: () => Promise<{ error: unknown }>, success: string) {
    setBusyUserId(userId);
    setFeedback(null);
    const { error } = await action();
    if (error) setFeedback({ kind: "error", text: "A operação não pôde ser concluída." });
    else {
      setFeedback({ kind: "success", text: success });
      await loadUsers(true);
    }
    setBusyUserId(null);
  }

  async function addCredits(user: AdminUser) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await runAction(
      user.user_id,
      async () => {
        const { error } = await supabase.rpc("admin_add_credits", { p_user_id: user.user_id });
        return { error };
      },
      `5 créditos adicionados para ${user.full_name}.`
    );
  }

  async function toggleBlock(user: AdminUser) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await runAction(
      user.user_id,
      async () => {
        const { error } = await supabase.rpc("admin_set_user_blocked", {
          p_user_id: user.user_id,
          p_blocked: !user.is_blocked
        });
        return { error };
      },
      user.is_blocked ? `${user.full_name} foi desbloqueado.` : `${user.full_name} foi bloqueado.`
    );
  }

  async function sendMessage() {
    const supabase = getSupabaseClient();
    const cleanMessage = messageText.trim();
    if (!supabase || !messageUser || !cleanMessage) return;

    await runAction(
      messageUser.user_id,
      async () => {
        const { error } = await supabase.rpc("admin_send_message", {
          p_user_id: messageUser.user_id,
          p_message: cleanMessage
        });
        return { error };
      },
      `Mensagem enviada para ${messageUser.full_name}.`
    );
    setMessageUser(null);
    setMessageText("");
  }

  if (loading && authorized === null) return <AdminLoading />;

  if (authorized === false) {
    return (
      <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas px-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-7 text-center backdrop-blur-xl">
          <ShieldCheck className="mx-auto h-8 w-8 text-slate-500" />
          <h1 className="mt-4 text-2xl font-semibold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-slate-400">Este painel está disponível apenas para a conta administradora.</p>
          <Link href="/" className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg border border-white/10 px-5 text-sm text-slate-200 hover:bg-white/[0.06]">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mission-grid min-h-[100dvh] bg-canvas px-4 py-5 text-white sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Central de controle
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-[#3aa7d8]/25 bg-[#3aa7d8]/10 text-[#8bd8f8]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold sm:text-3xl">Painel administrativo</h1>
                <p className="mt-1 text-sm text-slate-400">Contas, presença, créditos e comunicação.</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </button>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={Users} label="Usuários" value={stats.total} />
          <Stat icon={UserCheck} label="Online agora" value={stats.online} accent="text-emerald-300" />
          <Stat icon={Ban} label="Bloqueados" value={stats.blocked} accent="text-red-300" />
          <Stat icon={Coins} label="Créditos em contas" value={stats.credits} accent="text-[#8bd8f8]" />
        </section>

        {feedback && (
          <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${feedback.kind === "success" ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200" : "border-red-400/20 bg-red-400/[0.08] text-red-200"}`}>
            {feedback.text}
          </div>
        )}

        <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl">
          <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Base de usuários</h2>
              <p className="mt-1 text-xs text-slate-500">Presença atualizada automaticamente a cada 30 segundos.</p>
            </div>
            <label className="relative block w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar usuário ou e-mail"
                className="h-11 w-full rounded-lg border border-white/10 bg-black/25 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#3aa7d8]/45"
              />
            </label>
          </div>

          <div className="hidden grid-cols-[minmax(220px,1.7fr)_110px_110px_130px_300px] gap-4 border-b border-white/10 px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-600 lg:grid">
            <span>Usuário</span><span>Status</span><span>Plano</span><span>Créditos</span><span>Ações</span>
          </div>

          <div className="divide-y divide-white/[0.07]">
            {filteredUsers.map((user) => {
              const online = isOnline(user);
              const busy = busyUserId === user.user_id;
              return (
                <article key={user.user_id} className="grid gap-4 px-4 py-5 transition hover:bg-white/[0.025] lg:grid-cols-[minmax(220px,1.7fr)_110px_110px_130px_300px] lg:items-center lg:px-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-slate-100">{user.full_name}</p>
                      {user.email.toLowerCase() === ADMIN_EMAIL && <span className="rounded-full border border-[#3aa7d8]/25 bg-[#3aa7d8]/10 px-2 py-0.5 text-[0.62rem] font-semibold text-[#8bd8f8]">ADM</span>}
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
                    <p className="mt-1 text-[0.68rem] text-slate-600">Criado em {formatDate(user.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full ${user.is_blocked ? "bg-red-400" : online ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" : "bg-slate-600"}`} />
                    <span className={user.is_blocked ? "text-red-300" : online ? "text-emerald-300" : "text-slate-500"}>{user.is_blocked ? "Bloqueado" : online ? "Online" : "Offline"}</span>
                  </div>
                  <p className="text-sm text-slate-300">{user.plan_tag}</p>
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#8bd8f8]"><Coins className="h-4 w-4" /> {user.balance}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <ActionButton label="+5 créditos" icon={Coins} disabled={busy} onClick={() => void addCredits(user)} />
                    <ActionButton label="Mensagem" icon={MessageSquare} disabled={busy} onClick={() => { setMessageUser(user); setMessageText(""); }} />
                    <ActionButton label={user.is_blocked ? "Desbloquear" : "Bloquear"} icon={user.is_blocked ? UserCheck : Ban} danger={!user.is_blocked} disabled={busy || user.email.toLowerCase() === ADMIN_EMAIL} onClick={() => void toggleBlock(user)} />
                  </div>
                </article>
              );
            })}
            {!filteredUsers.length && <p className="px-5 py-12 text-center text-sm text-slate-500">Nenhum usuário encontrado.</p>}
          </div>
        </section>
      </div>

      {messageUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#090b18] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Enviar mensagem</h2>
                <p className="mt-1 text-sm text-slate-400">O aviso aparecerá diretamente na tela de {messageUser.full_name}.</p>
              </div>
              <button type="button" aria-label="Fechar" onClick={() => setMessageUser(null)} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <textarea
              autoFocus
              value={messageText}
              onChange={(event) => setMessageText(event.target.value.slice(0, 500))}
              placeholder="Escreva um recado claro para o usuário..."
              className="mt-5 min-h-36 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-[#3aa7d8]/45"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-600"><span>Texto simples e seguro</span><span>{messageText.length}/500</span></div>
            <button type="button" disabled={!messageText.trim() || busyUserId === messageUser.user_id} onClick={() => void sendMessage()} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#9fcf8b] to-[#3aa7d8] px-5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(58,167,216,0.28)] transition hover:bg-[#b8dca8]-500 disabled:cursor-not-allowed disabled:opacity-50">
              {busyUserId === messageUser.user_id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />} Enviar recado
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ icon: Icon, label, value, accent = "text-white" }: { icon: typeof Users; label: string; value: number; accent?: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl sm:p-5"><Icon className={`h-4 w-4 ${accent}`} /><p className={`mt-4 text-2xl font-semibold ${accent}`}>{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>;
}

function ActionButton({ label, icon: Icon, onClick, disabled, danger = false }: { label: string; icon: typeof Coins; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled} className={`flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${danger ? "border-red-400/15 bg-red-400/[0.06] text-red-300 hover:bg-red-400/10" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}><Icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{label}</span></button>;
}

function AdminLoading() {
  return <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas text-[#8bd8f8]"><LoaderCircle className="h-7 w-7 animate-spin" /></main>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}
