"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  MessageCircle,
  Target
} from "lucide-react";

type LandingPageProps = {
  onStart: () => void;
};

type Plan = {
  name: string;
  price: string;
  detail: string;
  hook: string;
  featured?: boolean;
  daily?: string;
  cta?: string;
  checkoutUrl?: string;
  trial?: boolean;
};

const howItWorks = [
  {
    step: "1. enviar",
    title: "Cole sua redação",
    text: "Sem fricção. O texto entra e vira um relatório de correção."
  },
  {
    step: "2. entender",
    title: "Veja onde perdeu ponto",
    text: "Competência por competência, com evidência no próprio texto."
  },
  {
    step: "3. melhorar",
    title: "Receba a próxima missão",
    text: "Uma tarefa específica para reescrever melhor na próxima tentativa."
  }
];

const comfortCards = [
  {
    label: "conforto",
    title: "Off-white no texto",
    text: "Menos agressivo que branco puro em fundo escuro."
  },
  {
    label: "método",
    title: "Cores com função",
    text: "Azul para análise, verde para progresso, coral para erro."
  },
  {
    label: "uso longo",
    title: "Sem poluição visual",
    text: "Glow só onde ajuda a orientar o olhar."
  }
];

const plans: Plan[] = [
  {
    name: "Teste gratuito",
    price: "R$0",
    detail: "3 créditos",
    hook: "Três correções completas para conhecer o método antes de pagar.",
    cta: "Testar grátis",
    trial: true
  },
  {
    name: "Mensal",
    price: "R$29,90/mês",
    detail: "60 créditos por mês",
    hook: "Créditos para corrigir, tirar dúvidas e analisar seus erros durante o mês.",
    featured: true,
    daily: "Menos de R$1 por dia",
    cta: "Garantir mensal",
    checkoutUrl: "https://pay.cakto.com.br/d7tstmz_1049372"
  },
  {
    name: "Anual",
    price: "R$197/ano",
    detail: "720 créditos no ano",
    hook: "O equivalente a 60 créditos por mês, com o melhor custo-benefício.",
    daily: "Menos de R$0,55 por dia",
    cta: "Garantir anual",
    checkoutUrl: "https://pay.cakto.com.br/deea3ts"
  }
];

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid"
] as const;

function openCheckout(checkoutUrl: string) {
  const url = new URL(checkoutUrl);

  if (typeof window !== "undefined") {
    const currentParams = new URLSearchParams(window.location.search);
    TRACKING_PARAMS.forEach((param) => {
      const value = currentParams.get(param);
      if (value) url.searchParams.set(param, value);
    });
  }

  window.location.assign(url.toString());
}

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070d10] text-[#e8eee8]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(239,182,90,0.16),transparent_24rem),radial-gradient(circle_at_82%_18%,rgba(58,167,216,0.14),transparent_30rem),radial-gradient(circle_at_72%_86%,rgba(159,207,139,0.08),transparent_28rem),linear-gradient(145deg,#05090b_0%,#070d10_42%,#0d171b_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(232,238,232,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(232,238,232,0.024)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black_0%,transparent_92%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-6 lg:px-8">
        <a className="flex items-center gap-3 font-semibold tracking-[-0.04em]" href="#">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] border border-[#e8eee8]/10 bg-[#071014]/70 p-1.5 shadow-[0_0_42px_rgba(58,167,216,0.16)]">
            <img src="/aprova-ai-mark.svg" alt="" className="h-full w-full object-contain" />
          </span>
          <span className="text-lg">AprovaAI</span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-[#84938b] md:flex">
          <a className="transition hover:text-[#e8eee8]" href="#metodo">Método</a>
          <a className="transition hover:text-[#e8eee8]" href="#diferenca">Diferença</a>
          <a className="transition hover:text-[#e8eee8]" href="#planos">Planos</a>
        </nav>
        <button
          type="button"
          onClick={onStart}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#e8eee8]/15 bg-[#e8eee8]/[0.055] px-5 text-sm font-semibold text-[#e8eee8] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-[#3aa7d8]/45 hover:bg-[#e8eee8]/[0.085]"
        >
          Entrar
        </button>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-98px)] w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-6 lg:grid-cols-[0.96fr_1.04fr] lg:px-8 lg:pb-24">
        <div>
          <div className="inline-flex rounded-full border border-[#3aa7d8]/30 bg-[#3aa7d8]/10 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#8bd8f8]">
            corretor de redação para ENEM
          </div>
          <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[0.88] tracking-[-0.075em] text-[#e8eee8] sm:text-7xl lg:text-[6.75rem]">
            Treine redação sem cansar a vista.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#c9d4cc] sm:text-xl">
            Um ambiente escuro, claro de ler e feito para corrigir redações por horas: nota estimada, competências, trechos comentados e próxima missão.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#planos"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#eef6ef] via-[#b8dca8] to-[#64c3ed] px-6 text-base font-semibold text-[#041014] shadow-[0_22px_70px_rgba(58,167,216,0.16),0_0_42px_rgba(159,207,139,0.16)] transition hover:-translate-y-0.5"
            >
              Corrigir minha redação
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#metodo"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-[#e8eee8]/15 bg-[#e8eee8]/[0.055] px-6 text-base font-semibold text-[#e8eee8] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-[#3aa7d8]/45 hover:bg-[#e8eee8]/[0.085]"
            >
              Ver como funciona
              <ChevronDown className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              ["C1-C5", "correção por competência"],
              ["Trecho", "erro apontado no texto"],
              ["Missão", "próximo treino claro"]
            ].map(([title, text]) => (
              <div key={title} className="rounded-[22px] border border-[#e8eee8]/15 bg-[#e8eee8]/[0.045] p-4 shadow-[inset_0_1px_rgba(255,255,255,0.035)]">
                <strong className="block text-2xl font-semibold tracking-[-0.04em]">{title}</strong>
                <span className="mt-1 block text-sm leading-5 text-[#84938b]">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <HeroWorkspace />
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[2.6rem] border border-[#efb65a]/25 bg-[#e8eee8]/[0.055] px-6 py-14 text-center shadow-[0_34px_120px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:px-10 lg:py-20">
          <p className="mx-auto max-w-4xl text-balance text-4xl font-semibold leading-[0.95] tracking-[-0.075em] text-[#e8eee8] sm:text-6xl">
            O tempo vai passar de qualquer jeito. <span className="text-[#f0c777]">Corrija com direção.</span>
          </p>
        </div>
      </section>

      <section id="metodo" className="relative z-10 mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          title="Feito para a rotina real de quem treina redação."
          text="O produto precisa ficar aberto ao lado do texto. Por isso, a interface prioriza leitura, contraste calmo e ação objetiva."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {howItWorks.map((item) => (
            <InfoCard key={item.title} label={item.step} title={item.title} text={item.text} />
          ))}
        </div>
      </section>

      <section id="diferenca" className="relative z-10 mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          title="Não é mais uma IA de estudo solta."
          text="AprovaAI é um corretor de redação com método: identifica erro, explica impacto e transforma feedback em treino."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <ContrastCard
            tone="bad"
            title="Jeito comum"
            items={[
              "Receber uma nota solta.",
              "Reescrever sem saber o que mudou.",
              "Guardar feedback genérico e repetir o erro."
            ]}
          />
          <ContrastCard
            tone="good"
            title="Com AprovaAI"
            items={[
              "Nota estimada com C1, C2, C3, C4 e C5.",
              "Trechos marcados e motivo da perda de ponto.",
              "Missão objetiva para a próxima redação."
            ]}
          />
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          title="Clareza para estudar à noite, no notebook, com foco."
          text="Dark mode não precisa parecer jogo. Aqui ele vira ambiente de correção: silencioso, confortável e direto."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {comfortCards.map((item) => (
            <InfoCard key={item.title} label={item.label} title={item.title} text={item.text} />
          ))}
        </div>
      </section>

      <section id="planos" className="relative z-10 mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          title="Mais correções pelo mesmo investimento."
          text="Agora, um crédito libera uma correção completa pelas cinco competências do ENEM."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} onStart={onStart} />
          ))}
        </div>
        <div className="mt-5 grid gap-3 rounded-[1.5rem] border border-[#e8eee8]/15 bg-[#e8eee8]/[0.045] p-3 backdrop-blur-xl sm:grid-cols-3">
          {[
            ["Correção completa", "1", "crédito"],
            ["Pergunta ao Tutor", "1", "crédito"],
            ["Análise de arquivo", "2", "créditos"]
          ].map(([label, amount, unit]) => (
            <div key={label} className="rounded-2xl border border-[#e8eee8]/10 bg-[#041014]/55 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#84938b]">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-[#e8eee8]">{amount} <span className="text-sm font-medium text-[#9fcf8b]">{unit}</span></p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            ["Sem textão", "A resposta vem estruturada para você agir."],
            ["Sem nota solta", "A nota vem acompanhada de evidências e trechos."],
            ["Sem treino cego", "A próxima versão já nasce com uma missão."]
          ].map(([title, text]) => (
            <article key={title} className="rounded-[1.5rem] border border-[#e8eee8]/15 bg-[#e8eee8]/[0.045] p-5">
              <h3 className="text-xl font-semibold text-[#e8eee8]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#84938b]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-14 sm:px-6 lg:px-8">
        <div className="rounded-[2.6rem] border border-[#9fcf8b]/25 bg-[#e8eee8]/[0.055] px-6 py-14 text-center shadow-[0_34px_120px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:px-10">
          <p className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-[0.95] tracking-[-0.075em] text-[#e8eee8] sm:text-6xl">
            Cada redação corrigida é um erro a menos no dia da prova.
          </p>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#c9d4cc]">
            Redação não melhora no chute. Melhora com correção.
          </p>
          <button
            type="button"
            onClick={() => openCheckout("https://pay.cakto.com.br/69r8mre_934933")}
            className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#eef6ef] via-[#b8dca8] to-[#64c3ed] px-7 text-base font-semibold text-[#041014] shadow-[0_22px_70px_rgba(58,167,216,0.16),0_0_42px_rgba(159,207,139,0.16)] transition hover:-translate-y-0.5"
          >
            Entrar no AprovaAI
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.7fr] lg:items-end">
      <h2 className="max-w-3xl text-balance text-4xl font-semibold leading-[0.94] tracking-[-0.065em] text-[#e8eee8] sm:text-6xl">
        {title}
      </h2>
      <p className="max-w-xl text-base leading-7 text-[#84938b] sm:text-lg">{text}</p>
    </div>
  );
}

function InfoCard({ label, title, text }: { label: string; title: string; text: string }) {
  return (
    <article className="min-h-[235px] rounded-[2rem] border border-[#e8eee8]/15 bg-[#e8eee8]/[0.055] p-6 shadow-[inset_0_1px_rgba(255,255,255,0.035),0_24px_70px_rgba(0,0,0,0.20)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#3aa7d8]/35 hover:bg-[#e8eee8]/[0.085]">
      <small className="font-mono text-xs font-extrabold uppercase tracking-[0.12em] text-[#3aa7d8]">{label}</small>
      <h3 className="mt-7 text-2xl font-semibold tracking-[-0.045em] text-[#e8eee8]">{title}</h3>
      <p className="mt-3 text-base leading-7 text-[#84938b]">{text}</p>
    </article>
  );
}

function ContrastCard({ title, items, tone }: { title: string; items: string[]; tone: "bad" | "good" }) {
  return (
    <article className={`rounded-[2.125rem] border bg-[#e8eee8]/[0.055] p-7 backdrop-blur-xl ${
      tone === "bad" ? "border-[#e86f5c]/25" : "border-[#9fcf8b]/30"
    }`}>
      <h3 className="text-3xl font-semibold tracking-[-0.055em] text-[#e8eee8]">{title}</h3>
      <ul className="mt-6 grid gap-3 text-[#c9d4cc]">
        {items.map((item) => (
          <li key={item} className="flex gap-3 border-t border-[#e8eee8]/15 pt-3">
            {tone === "bad" ? (
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#e86f5c]" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#9fcf8b]" />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function PlanCard({ plan, onStart }: { plan: Plan; onStart: () => void }) {
  const hasCheckout = Boolean(plan.checkoutUrl);
  const canStart = hasCheckout || Boolean(plan.trial);

  return (
    <article className={`relative rounded-[2.125rem] border p-7 backdrop-blur-xl transition hover:-translate-y-1 ${
      plan.featured
        ? "border-[#9fcf8b]/40 bg-gradient-to-b from-[#9fcf8b]/15 to-[#e8eee8]/[0.07] shadow-[0_0_70px_rgba(159,207,139,0.10),0_34px_100px_rgba(0,0,0,0.28)] lg:-mt-3"
        : "border-[#e8eee8]/15 bg-[#e8eee8]/[0.055]"
    }`}>
      {plan.featured && (
        <div className="mb-5 inline-flex rounded-full border border-[#9fcf8b]/25 bg-[#9fcf8b]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#def4d6]">
          Melhor rotina
        </div>
      )}
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#84938b]">{plan.name}</p>
      <h3 className="mt-4 text-4xl font-semibold tracking-[-0.07em] text-[#e8eee8]">{plan.price}</h3>
      <p className="mt-3 text-lg font-medium text-[#9fcf8b]">{plan.detail}</p>
      {plan.daily && (
        <div className="mt-5 rounded-[1.25rem] border border-[#9fcf8b]/25 bg-[#9fcf8b]/10 p-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#84938b]">chamada principal</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#e8eee8]">{plan.daily}</p>
        </div>
      )}
      <p className="mt-6 min-h-16 text-base leading-7 text-[#84938b]">{plan.hook}</p>
      <button
        type="button"
        disabled={!canStart}
        onClick={() => plan.checkoutUrl ? openCheckout(plan.checkoutUrl) : onStart()}
        className={`mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full text-sm font-semibold transition hover:-translate-y-0.5 ${
          plan.featured
            ? "bg-gradient-to-br from-[#eef6ef] via-[#b8dca8] to-[#64c3ed] text-[#041014] shadow-[0_22px_70px_rgba(58,167,216,0.16),0_0_42px_rgba(159,207,139,0.16)]"
            : "border border-[#e8eee8]/15 bg-[#e8eee8]/[0.055] text-[#e8eee8] hover:border-[#3aa7d8]/45 hover:bg-[#e8eee8]/[0.085]"
        } disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0`}
      >
        {plan.cta ?? (hasCheckout ? "Comprar agora" : "Indisponível")}
      </button>
    </article>
  );
}

function HeroWorkspace() {
  const competencies = [
    ["C1", "160", "78%"],
    ["C2", "180", "84%"],
    ["C3", "120", "58%"],
    ["C4", "160", "80%"],
    ["C5", "160", "80%"]
  ];

  return (
    <div className="relative min-h-[660px] overflow-hidden rounded-[2.625rem] border border-[#e8eee8]/15 bg-[#e8eee8]/[0.055] shadow-[inset_0_1px_rgba(255,255,255,0.06),0_44px_130px_rgba(0,0,0,0.52)]">
      <div className="absolute left-1/2 top-[-120px] h-[330px] w-[330px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(239,182,90,0.42),transparent_68%)] blur-lg" />

      <div className="absolute inset-x-5 top-8 overflow-hidden rounded-[1.875rem] border border-[#e8eee8]/15 bg-[#040e12]/80 shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:inset-x-10 sm:top-14">
        <div className="flex items-center justify-between border-b border-[#e8eee8]/15 px-5 py-4 font-mono text-xs font-bold text-[#84938b]">
          <span>redacao-final.txt</span>
          <span className="flex gap-2">
            <i className="h-2.5 w-2.5 rounded-full bg-[#e8eee8]/20" />
            <i className="h-2.5 w-2.5 rounded-full bg-[#e8eee8]/20" />
            <i className="h-2.5 w-2.5 rounded-full bg-[#e8eee8]/20" />
          </span>
        </div>
        <div className="space-y-5 p-6 text-[15px] leading-8 text-[#d9e3db]">
          <p>
            A democratização do acesso à educação ainda enfrenta obstáculos no Brasil. Nesse contexto,{" "}
            <span className="rounded-lg bg-[#3aa7d8]/15 px-1.5 py-1 text-[#9adffc]">a desigualdade social limita oportunidades</span>{" "}
            e dificulta a permanência de estudantes na escola.
          </p>
          <p>
            Além disso,{" "}
            <span className="rounded-lg bg-[#e86f5c]/15 px-1.5 py-1 text-[#ffc0b7]">o argumento afirma o problema, mas não apresenta prova concreta</span>.
            Sem dado, exemplo ou consequência, a Competência 3 perde força.
          </p>
        </div>
      </div>

      <div className="absolute right-3 top-40 w-44 rotate-2 rounded-[22px] border border-[#efb65a]/25 bg-gradient-to-br from-[#ffe2a1] to-[#efb65a] p-4 text-sm font-bold text-[#1a1710] shadow-[0_24px_70px_rgba(239,182,90,0.24)] sm:right-6 sm:top-44 sm:w-52">
        Próxima missão: reescrever o segundo argumento com prova.
      </div>

      <div className="absolute inset-x-5 bottom-8 grid gap-5 rounded-[1.75rem] border border-[#e8eee8]/15 bg-[#061014]/90 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.44)] backdrop-blur-xl sm:inset-x-10 lg:grid-cols-[160px_1fr]">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#84938b]">nota estimada</p>
          <strong className="mt-3 block text-6xl font-semibold leading-none tracking-[-0.08em] text-[#e8eee8]">720</strong>
        </div>
        <div className="grid content-center gap-2.5">
          {competencies.map(([label, score, width]) => (
            <div key={label} className="grid grid-cols-[34px_1fr_38px] items-center gap-2.5 font-mono text-xs font-bold text-[#84938b]">
              <span>{label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-[#e8eee8]/10">
                <span
                  className={`block h-full rounded-full ${label === "C3" ? "bg-gradient-to-r from-[#e86f5c] to-[#efb65a]" : "bg-gradient-to-r from-[#9fcf8b] to-[#3aa7d8]"}`}
                  style={{ width }}
                />
              </span>
              <span>{score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-5 top-[31rem] hidden items-center gap-2 rounded-full border border-[#e8eee8]/15 bg-[#061014]/80 px-4 py-3 text-sm font-bold text-[#e8eee8] shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:inline-flex">
        <MessageCircle className="h-4 w-4 text-[#3aa7d8]" />
        Trecho comentado
      </div>
      <div className="absolute bottom-[12.5rem] right-5 hidden items-center gap-2 rounded-full border border-[#e8eee8]/15 bg-[#061014]/80 px-4 py-3 text-sm font-bold text-[#e8eee8] shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:inline-flex">
        <Target className="h-4 w-4 text-[#9fcf8b]" />
        Próximo treino
      </div>
    </div>
  );
}
