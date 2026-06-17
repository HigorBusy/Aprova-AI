"use client";

import Image from "next/image";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  FileText,
  LineChart,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target
} from "lucide-react";

type LandingPageProps = {
  onStart: () => void;
};

const howItWorks = [
  {
    title: "Envie sua redação",
    text: "Cole o texto ou envie sua redação.",
    icon: FileText
  },
  {
    title: "Receba a correção",
    text: "Veja nota, competências, erros e pontos fortes.",
    icon: ClipboardCheck
  },
  {
    title: "Evolua com direção",
    text: "Receba uma missão prática para melhorar.",
    icon: Target
  }
];

const valueCards = [
  { title: "Nota estimada", text: "Uma leitura rápida do seu nível atual.", icon: LineChart },
  { title: "Correção por competência", text: "C1 a C5 com foco no ENEM.", icon: ClipboardCheck },
  { title: "Plano de melhoria", text: "O próximo ajuste que mais importa.", icon: Target },
  { title: "Missão de hoje", text: "Uma ação curta para sair do lugar.", icon: Rocket },
  { title: "Histórico de evolução", text: "Veja sua rota ficando mais clara.", icon: BrainCircuit }
];

const plans = [
  {
    name: "Plano Avulso",
    price: "R$9,90",
    detail: "30 créditos",
    hook: "Ideal para testar sem compromisso.",
    featured: false
  },
  {
    name: "Plano Mensal",
    price: "R$29,90/mês",
    detail: "150 créditos por mês",
    hook: "Menos de R$1 por dia para corrigir e evoluir sua redação.",
    featured: true
  },
  {
    name: "Plano Anual",
    price: "R$197/ano",
    detail: "10 créditos por dia",
    hook: "Menos de R$0,55 por dia para estudar com direção o ano inteiro.",
    featured: false,
    extra: "3650 créditos no ano"
  }
];

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <main className="mission-grid min-h-screen overflow-hidden bg-canvas text-white">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
        <div className="flex h-12 w-40 items-center justify-center sm:w-44">
          <Image
            src="/aprova-ai-logo-hd.png"
            alt="AprovaAI"
            width={1449}
            height={676}
            priority
            className="h-10 w-auto max-w-full object-contain"
          />
        </div>
        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          <a className="transition hover:text-white" href="#como-funciona">Como funciona</a>
          <a className="transition hover:text-white" href="#planos">Planos</a>
          <a className="transition hover:text-white" href="#valor">Valor</a>
        </nav>
        <button
          type="button"
          onClick={onStart}
          className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:border-accent/40 hover:bg-accent/15"
        >
          Entrar
        </button>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pb-20 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-28 lg:pt-20">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.08] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-aura shadow-glow">
            <Sparkles className="h-3.5 w-3.5" />
            Correção ENEM com IA
          </div>

          <div className="space-y-5">
            <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[0.96] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
              Corrija sua redação do ENEM em segundos com IA.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Receba nota estimada, análise por competência e um plano claro para melhorar sua próxima redação.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-6 text-base font-semibold text-slate-950 shadow-[0_0_46px_rgba(168,85,247,0.30),0_24px_70px_rgba(0,0,0,0.42)] transition hover:-translate-y-0.5 hover:bg-aura"
            >
              Começar agora
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#como-funciona"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-6 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-white/[0.075]"
            >
              Ver como funciona
              <ChevronDown className="h-4 w-4" />
            </a>
          </div>

          <div className="grid max-w-2xl grid-cols-3 gap-3 pt-2">
            {["Nota", "Competências", "Missão"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">{item}</p>
                <CheckCircle2 className="mx-auto mt-2 h-5 w-5 text-aura" />
              </div>
            ))}
          </div>
        </div>

        <HeroMockup />
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="glass premium-glow rounded-[2rem] border border-accent/20 bg-accent/[0.055] px-6 py-12 text-center sm:px-10">
          <p className="energy-text mx-auto max-w-4xl text-balance text-3xl font-semibold leading-tight tracking-[-0.02em] text-white sm:text-5xl">
            Ninguém está vindo te salvar, então faça acontecer.
          </p>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Como funciona"
          title="Três passos. Uma direção."
          text="Redação não melhora no chute. Melhora com correção."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {howItWorks.map((card, index) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="glass group rounded-[1.75rem] p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:bg-accent/[0.055]">
                <div className="flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-accent/25 bg-accent/[0.12] text-aura">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-sm text-slate-500">0{index + 1}</span>
                </div>
                <h3 className="mt-8 text-2xl font-semibold tracking-[-0.02em] text-white">{card.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-300">{card.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="planos" className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Planos e créditos"
          title="Compre direção, não promessa."
          text="Créditos são usados para correções, ferramentas de IA e análises avançadas."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`glass rounded-[1.75rem] p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/40 ${
                plan.featured ? "premium-glow border-aura/30 bg-accent/[0.085]" : ""
              }`}
            >
              {plan.featured && (
                <div className="mb-5 inline-flex rounded-full border border-aura/30 bg-aura/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-aura">
                  Mais escolhido
                </div>
              )}
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">{plan.name}</p>
              <h3 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">{plan.price}</h3>
              <p className="mt-3 text-lg font-medium text-aura">{plan.detail}</p>
              {plan.extra && <p className="mt-1 text-sm text-slate-400">{plan.extra}</p>}
              <p className="mt-6 min-h-16 text-base leading-7 text-slate-300">{plan.hook}</p>
              <button
                type="button"
                onClick={onStart}
                className={`mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full text-sm font-semibold transition hover:-translate-y-0.5 ${
                  plan.featured
                    ? "bg-white text-slate-950 shadow-glow hover:bg-aura"
                    : "border border-white/10 bg-white/[0.055] text-white hover:border-accent/40 hover:bg-white/[0.08]"
                }`}
              >
                Começar agora
              </button>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300 backdrop-blur-xl sm:grid-cols-3">
          <span>Chat com IA: <strong className="text-white">1 crédito</strong></span>
          <span>Ferramenta rápida: <strong className="text-white">2 créditos</strong></span>
          <span>Correção de redação: <strong className="text-white">5 créditos</strong></span>
        </div>
      </section>

      <section id="valor" className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Prova de valor"
          title="Tudo aponta para a próxima redação."
          text="Você não precisa estudar mais. Precisa estudar com direção."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {valueCards.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="glass rounded-[1.5rem] p-5 transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:bg-accent/[0.055]">
                <Icon className="h-5 w-5 text-aura" />
                <h3 className="mt-6 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-24 pt-14 sm:px-6 lg:px-8">
        <div className="glass premium-glow rounded-[2rem] px-6 py-14 text-center sm:px-10">
          <p className="mx-auto max-w-3xl text-balance text-3xl font-semibold leading-tight tracking-[-0.02em] text-white sm:text-5xl">
            Cada redação corrigida é um erro a menos no dia da prova.
          </p>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-300">
            O tempo até o ENEM está passando.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-slate-950 shadow-[0_0_46px_rgba(168,85,247,0.30),0_24px_70px_rgba(0,0,0,0.42)] transition hover:-translate-y-0.5 hover:bg-aura"
          >
            Entrar no AprovaAI
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aura">{eyebrow}</p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">{title}</h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">{text}</p>
    </div>
  );
}

function HeroMockup() {
  return (
    <div className="animate-float-in relative mx-auto w-full max-w-2xl lg:mx-0">
      <div className="glass premium-glow rounded-[2.2rem] p-4 sm:p-5">
        <div className="rounded-[1.7rem] border border-white/10 bg-slate-950/70 p-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-aura">Centro de Redação</p>
              <h3 className="mt-1 text-xl font-semibold text-white">Análise da redação</h3>
            </div>
            <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm font-semibold text-emerald-200">
              Pronta
            </div>
          </div>

          <div className="grid gap-4 py-4 sm:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.4rem] border border-accent/25 bg-accent/[0.08] p-5 shadow-glow">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Nota estimada</p>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-6xl font-semibold tracking-[-0.06em] text-white">840</span>
                <span className="pb-2 text-sm text-slate-400">/1000</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">Cada erro corrigido hoje é ponto salvo na prova.</p>
            </div>

            <div className="space-y-3">
              {[
                ["C1", "160", "Norma padrão"],
                ["C2", "180", "Tema e repertório"],
                ["C3", "160", "Argumentação"],
                ["C4", "180", "Coesão"],
                ["C5", "160", "Intervenção"]
              ].map(([label, score, title]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-mono text-aura">{label}</span>
                    <span className="min-w-0 flex-1 truncate text-slate-300">{title}</span>
                    <span className="font-semibold text-white">{score}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-cosmic to-aura" style={{ width: `${Number(score) / 2}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
              <MessageCircle className="h-5 w-5 text-aura" />
              <p className="mt-4 text-sm font-semibold text-white">Comandante IA</p>
              <p className="mt-1 text-sm text-slate-400">Orienta sua próxima ação.</p>
            </div>
            <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
              <ShieldCheck className="h-5 w-5 text-aura" />
              <p className="mt-4 text-sm font-semibold text-white">Missão de hoje</p>
              <p className="mt-1 text-sm text-slate-400">Reescrever a conclusão.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="glass absolute left-0 top-10 z-10 hidden items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-glow sm:inline-flex">
        <CreditCard className="h-4 w-4 text-aura" />
        <span>5 créditos</span>
      </div>
      <div className="glass absolute bottom-10 right-0 z-10 hidden items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-glow sm:inline-flex">
        <Rocket className="h-4 w-4 text-aura" />
        <span>Próxima missão</span>
      </div>
    </div>
  );
}
