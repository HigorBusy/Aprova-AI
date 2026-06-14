import { NextRequest, NextResponse } from "next/server";

import { callGroq, COMMANDER_SYSTEM_PROMPT } from "@/lib/ai/groq";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CHAT_COST = 1;

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  let body: { message?: unknown };
  try {
    body = (await request.json()) as { message?: unknown };
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 8_000) {
    return NextResponse.json(
      { error: "Envie uma mensagem entre 1 e 8.000 caracteres." },
      { status: 400 }
    );
  }

  const { supabase, user } = auth;
  const { data: creditRow, error: creditError } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  if (creditError) return NextResponse.json({ error: "Não foi possível verificar seus créditos." }, { status: 500 });
  if (!creditRow || creditRow.balance < CHAT_COST) {
    return NextResponse.json({ error: "Você ficou sem créditos.", balance: creditRow?.balance ?? 0 }, { status: 402 });
  }

  const { data: recentMessages, error: historyError } = await supabase
    .from("ai_messages")
    .select("role,content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (historyError) return NextResponse.json({ error: "Não foi possível carregar o histórico." }, { status: 500 });

  try {
    const reply = await callGroq([
      { role: "system", content: COMMANDER…6817 tokens truncated…mt-2 truncate text-sm text-slate-200">{user.email}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">plano</p>
              <p className="mt-1 text-sm text-aura">{planTag === "premium" ? "Premium" : "Free"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                <CreditCard className="h-3 w-3" /> créditos
              </p>
              <p className="mt-1 text-sm text-aura">{creditBalance ?? 0}</p>
            </div>
          </div>
          <GhostButton onClick={() => void handleSignOut()} className="mt-3 w-full">
            <LogOut className="h-4 w-4" />
            Sair
          </GhostButton>
        </div>
      </aside>

      <section className="flex min-h-screen flex-col px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
        <header className="mx-auto w-full max-w-7xl animate-float-in lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex h-12 w-40 items-center justify-center">
              <Image
                src="/aprova-ai-logo-hd.png"
                alt="AprovaAI"
                width={1449}
                height={676}
                priority
                className="h-10 w-auto max-w-full object-contain"
              />
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-slate-300">
              {state.name.slice(0, 1).toUpperCase()}
            </div>
          </div>
          <p className="energy-text mt-4 rounded-lg border border-accent/20 bg-accent/[0.07] p-3 text-center text-sm font-medium leading-6 text-white">
            {phrase}
          </p>
        </header>

        <div className="mx-auto mt-5 w-full max-w-7xl lg:mt-0">
          <Dashboard
            state={state}
            user={user}
            planTag={planTag}
            creditBalance={creditBalance}
            onCreditBalanceChange={setCreditBalance}
            onSignOut={() => void handleSignOut()}
          />
        </div>
      </section>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/80 px-3 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === "home";
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`rounded-lg px-2 py-2 text-xs transition duration-300 ${
                  active ? "bg-accent/10 text-aura" : "text-slate-500 hover:text-slate-200"
                }`}
              >
                <Icon className="mx-auto h-5 w-5" />
                <span className="mt-1 block">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas px-5">
      <Loader size="lg" />
    </main>
  );
}
