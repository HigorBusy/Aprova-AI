"use client";

import { useCallback, useEffect, useState } from "react";
import { LogOut, Radio, X } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase/client";

type AdminMessage = {
  id: string;
  message: string;
  created_at: string;
};

export function AccountRuntime() {
  const [message, setMessage] = useState<AdminMessage | null>(null);
  const [blocked, setBlocked] = useState(false);

  const markAsRead = useCallback(async (messageId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase
      .from("admin_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);
    setMessage((current) => (current?.id === messageId ? null : current));
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let heartbeat: number | null = null;
    let connecting = false;
    let connectedUserId: string | null = null;

    const connect = async () => {
      if (!active || connecting) return;
      connecting = true;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!active || !user || connectedUserId === user.id) return;
        connectedUserId = user.id;

        const updatePresence = async () => {
          const { data, error } = await supabase.rpc("touch_user_presence");
          if (!active || error) return;
          setBlocked(data === false);
        };

        const { data: unread } = await supabase
          .from("admin_messages")
          .select("id,message,created_at")
          .eq("user_id", user.id)
          .is("read_at", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<AdminMessage>();

        if (active && unread) setMessage(unread);
        await updatePresence();
        if (heartbeat) window.clearInterval(heartbeat);
        heartbeat = window.setInterval(() => void updatePresence(), 45_000);

        channel = supabase
          .channel(`admin-messages:${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "admin_messages",
              filter: `user_id=eq.${user.id}`
            },
            (payload) => setMessage(payload.new as AdminMessage)
          )
          .subscribe();
      } finally {
        connecting = false;
      }
    };

    void connect();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void connect();
      if (event === "SIGNED_OUT") {
        connectedUserId = null;
        setBlocked(false);
        setMessage(null);
      }
    });

    return () => {
      active = false;
      if (heartbeat) window.clearInterval(heartbeat);
      if (channel) void supabase.removeChannel(channel);
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (blocked) {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-[#02030a]/95 px-5 text-white backdrop-blur-xl">
        <div className="w-full max-w-md rounded-2xl border border-red-400/20 bg-white/[0.05] p-7 text-center shadow-[0_0_80px_rgba(239,68,68,0.12)]">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-red-300/25 bg-red-400/10 text-red-200">
            <Radio className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold">Acesso temporariamente bloqueado</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Sua conta foi pausada pela equipe do Pontuei. Entre em contato com o suporte para mais informações.
          </p>
          <button
            type="button"
            onClick={() => void getSupabaseClient()?.auth.signOut()}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-5 text-sm text-slate-200 transition hover:bg-white/[0.1]"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </button>
        </div>
      </div>
    );
  }

  if (!message) return null;

  return (
    <div className="fixed inset-x-4 top-4 z-[90] mx-auto max-w-lg animate-float-in sm:inset-x-auto sm:right-6 sm:top-6 sm:w-[26rem]">
      <div className="rounded-2xl border border-[#3aa7d8]/25 bg-[#071014]/95 p-5 text-white shadow-[0_24px_80px_rgba(58,167,216,0.28)] backdrop-blur-2xl">
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#3aa7d8]/25 bg-[#3aa7d8]/10 text-[#8bd8f8]">
            <Radio className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8bd8f8]">Mensagem da equipe</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{message.message}</p>
          </div>
          <button
            type="button"
            aria-label="Fechar mensagem"
            onClick={() => void markAsRead(message.id)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
