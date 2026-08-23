"use client";

import { ArrowRight, Check, ChevronDown, CircleCheck, FilePenLine, Highlighter, Quote, ShieldCheck } from "lucide-react";

import { FreeEssayTrial } from "@/components/free-essay-trial";

type LandingPageProps = { onStart: () => void };
type Plan = { name: string; price: string; credits: string; description: string; daily?: string; featured?: boolean; checkoutUrl?: string };

const TRACKING_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"] as const;
const plans: Plan[] = [
  { name: "Primeira correção", price: "R$0", credits: "1 correção completa", description: "Sem login e sem cartão. Descubra onde sua redação perde pontos antes de escolher um plano." },
  { name: "Plano mensal", price: "R$29,90/mês", credits: "60 créditos por mês", description: "Treino recorrente para quem quer chegar ao ENEM escrevendo melhor.", daily: "Cerca de R$1 por dia", featured: true, checkoutUrl: "https://pay.cakto.com.br/d7tstmz_1049372" },
  { name: "Plano anual", price: "R$197/ano", credits: "720 créditos no ano", description: "O mesmo ritmo do mensal com o menor custo por correção.", daily: "Melhor custo por crédito", checkoutUrl: "https://pay.cakto.com.br/deea3ts" }
];

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
  const openFreeTrial = () => document.querySelector("#correcao-gratis")?.scrollIntoView({ behavior: "smooth" });
  return (
    <main className="landing-shell min-h-screen overflow-hidden bg-[#08111f] text-[#f4f1e8]">
      <header className="relative z-30 mx-auto flex min-h-20 w-full max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <a href="#inicio" aria-label="AprovaAI - início" className="flex items-center">
          <img src="/aprova-ai-logo-lockup.svg" alt="AprovaAI" className="h-10 w-auto object-contain sm:h-11" />
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#8fa3b8] md:flex" aria-label="Navegação da página">
          <a className="transition-colors hover:text-[#f4f1e8]" href="#como-funciona">Como funciona</a>
          <a className="transition-colors hover:text-[#f4f1e8]" href="#correcao">A correção</a>
          <a className="transition-colors hover:text-[#f4f1e8]" href="#planos">Planos</a>
        </nav>
        <button type="button" onClick={onStart} className="min-h-11 rounded-lg border border-[#8fa3b8]/25 bg-[#0f1e31]/80 px-5 text-sm font-semibold transition hover:border-[#35bfe7]/55 hover:bg-[#14263d]">Entrar</button>
      </header>

      <section id="inicio" className="relative mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-[1440px] items-center gap-14 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:px-12 lg:py-16">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-balance text-[clamp(3.2rem,7vw,6rem)] font-semibold leading-[0.92] tracking-[-0.04em]">Sua redação já mostra onde você perde pontos.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#b9c8d5] sm:text-xl">O AprovaAI lê pelas cinco competências do ENEM, aponta o trecho que enfraqueceu sua nota e mostra o que corrigir na próxima tentativa.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={openFreeTrial} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-[#f2c94c] px-6 font-bold text-[#08111f] shadow-[0_18px_48px_rgba(2,7,15,0.34)] transition hover:-translate-y-0.5 hover:bg-[#f8d866]">Fazer 1ª correção grátis <ArrowRight className="h-4 w-4" /></button>
            <a href="#como-funciona" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-[#8fa3b8]/25 bg-[#0f1e31]/70 px-6 font-semibold text-[#dce6ec] transition hover:border-[#35bfe7]/50 hover:bg-[#14263d]">Ver o método <ChevronDown className="h-4 w-4" /></a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#8fa3b8]">
            <span className="inline-flex items-center gap-2"><CircleCheck className="h-4 w-4 text-[#65d69e]" /> 1 correção grátis, sem login</span>
            <span className="inline-flex items-center gap-2"><CircleCheck className="h-4 w-4 text-[#65d69e]" /> Sem nota inventada</span>
            <span className="inline-flex items-center gap-2"><CircleCheck className="h-4 w-4 text-[#65d69e]" /> Ação prática no final</span>
          </div>
        </div>
        <EssayDiagnosticPreview />
      </section>

      <FreeEssayTrial onLogin={onStart} />

      <section className="border-y border-[#8fa3b8]/12 bg-[#050a12]/55">
        <div className="mx-auto grid w-full max-w-[1280px] gap-px bg-[#8fa3b8]/12 sm:grid-cols-3">
          {[["5 competências", "A nota é aberta em C1, C2, C3, C4 e C5."], ["Trechos apontados", "A crítica mostra a evidência no seu próprio texto."], ["Próxima missão", "Você termina sabendo exatamente o que treinar."]].map(([title, text]) => (
            <div key={title} className="bg-[#08111f] px-6 py-8 sm:px-8"><strong className="text-lg text-[#f4f1e8]">{title}</strong><p className="mt-2 text-sm leading-6 text-[#8fa3b8]">{text}</p></div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="mx-auto w-full max-w-[1280px] px-5 py-24 sm:px-8 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
          <div><h2 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">Pare de escrever no escuro.</h2><p className="mt-6 max-w-md text-lg leading-8 text-[#9fb1c1]">Uma nota solta não ensina. O que melhora sua próxima redação é enxergar o padrão do erro e saber como quebrá-lo.</p></div>
          <ol className="divide-y divide-[#8fa3b8]/15 border-y border-[#8fa3b8]/15">
            <ProcessRow index="01" title="Envie o texto" text="Cole sua redação. O sistema organiza a análise sem transformar seu texto em um chat infinito." />
            <ProcessRow index="02" title="Veja a perda de pontos" text="Cada competência recebe nota, justificativa, evidências e um próximo nível possível." />
            <ProcessRow index="03" title="Reescreva com direção" text="A correção termina com uma missão objetiva para você aplicar no próximo texto." />
          </ol>
        </div>
      </section>

      <section id="correcao" className="bg-[#edf2f4] text-[#0b1726]">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-12 lg:py-32">
          <div className="max-w-xl"><Highlighter className="h-9 w-9 text-[#05799a]" /><h2 className="mt-6 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl">A crítica precisa apontar o trecho. Não inventar um defeito.</h2><p className="mt-6 text-lg leading-8 text-[#4f6477]">O AprovaAI foi calibrado para reconhecer textos fracos e também excelência. Toda penalização precisa explicar o trecho, o problema e o impacto na competência.</p></div>
          <div className="relative rounded-2xl bg-white p-6 shadow-[0_28px_80px_rgba(20,43,63,0.14)] sm:p-9">
            <div className="flex items-center justify-between gap-4 border-b border-[#d8e1e6] pb-5"><div><p className="text-sm font-semibold text-[#05799a]">Competência 3</p><p className="mt-1 text-sm text-[#6c7f8f]">Argumentação e projeto de texto</p></div><strong className="font-mono text-3xl tabular-nums">160/200</strong></div>
            <blockquote className="mt-7 border-l border-[#ff6b6b] pl-5 text-lg leading-8 text-[#24384a]">“A educação é importante para resolver diversos problemas da sociedade.”</blockquote>
            <div className="mt-6 bg-[#fff4f2] p-5 text-sm leading-7 text-[#6a3131]">A afirmação apresenta o tema, mas não desenvolve uma relação de causa e consequência. O argumento perde força porque afirma sem provar.</div>
            <div className="mt-6 flex items-start gap-3 text-sm leading-6 text-[#344b5f]"><FilePenLine className="mt-0.5 h-5 w-5 shrink-0 text-[#05799a]" /><span><strong>Próximo nível:</strong> acrescente um exemplo concreto e explique como ele sustenta sua tese.</span></div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-5 py-24 sm:px-8 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-end"><div><Quote className="h-9 w-9 text-[#35bfe7]" /><p className="mt-7 max-w-4xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-6xl">“Você não precisa escrever mais redações no automático. Precisa parar de repetir o mesmo erro.”</p></div><p className="max-w-md text-lg leading-8 text-[#8fa3b8] lg:justify-self-end">O produto não promete aprovação. Ele entrega um ciclo de correção que torna cada nova tentativa mais consciente que a anterior.</p></div>
      </section>

      <section id="planos" className="border-t border-[#8fa3b8]/12 bg-[#050a12]/50 px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="max-w-3xl"><h2 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl">Comece corrigindo. Continue evoluindo.</h2><p className="mt-6 text-lg leading-8 text-[#9fb1c1]">Uma correção completa custa 1 crédito. Você escolhe o ritmo sem pagar R$19,70 por cada texto.</p></div>
          <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:items-stretch">{plans.map((plan) => <PlanCard key={plan.name} plan={plan} onStart={plan.checkoutUrl ? onStart : openFreeTrial} />)}</div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[#8fa3b8]"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#65d69e]" /> Pagamento processado pela Cakto</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#65d69e]" /> Acesso imediato</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#65d69e]" /> Uso no celular e computador</span></div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-5 py-24 sm:px-8 lg:py-32"><div className="border-y border-[#8fa3b8]/18 py-16 sm:py-24"><div className="max-w-4xl"><h2 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl">Cada erro corrigido hoje é ponto que você deixa de perder na prova.</h2><button type="button" onClick={openFreeTrial} className="mt-9 inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-[#f2c94c] px-7 font-bold text-[#08111f] transition hover:bg-[#f8d866]">Fazer minha correção grátis <ArrowRight className="h-4 w-4" /></button></div></div></section>

      <footer className="border-t border-[#8fa3b8]/12 px-5 py-8 text-sm text-[#6f8498] sm:px-8"><div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><img src="/aprova-ai-logo-lockup.svg" alt="AprovaAI" className="h-8 w-auto self-start object-contain" /><p>Preparação orientada para redação do ENEM.</p></div></footer>
    </main>
  );
}

function EssayDiagnosticPreview() {
  const competencies = [["C1", 160, "Norma padrão"], ["C2", 180, "Tema e repertório"], ["C3", 160, "Argumentação"], ["C4", 180, "Coesão"], ["C5", 160, "Intervenção"]] as const;
  return (
    <div className="relative z-10 mx-auto w-full max-w-[680px] lg:rotate-[0.75deg]">
      <div className="absolute -inset-12 -z-10 bg-[radial-gradient(ellipse,rgba(53,191,231,0.15),transparent_68%)]" />
      <article className="overflow-hidden rounded-2xl border border-[#8fa3b8]/18 bg-[#0b1829] shadow-[0_38px_100px_rgba(2,7,15,0.58)]">
        <div className="flex items-center justify-between border-b border-[#8fa3b8]/14 px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-[#65d69e]" /><p className="text-sm font-semibold">Correção concluída</p></div><span className="text-xs text-[#8fa3b8]">Redação ENEM</span></div>
        <div className="grid md:grid-cols-[0.86fr_1.14fr]">
          <div className="border-b border-[#8fa3b8]/14 bg-[#edf2f4] p-6 text-[#14283a] md:border-b-0 md:border-r sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#567082]">Nota estimada</p><p className="mt-2 font-mono text-6xl font-semibold tracking-[-0.04em] tabular-nums">840</p><div className="mt-7 space-y-4"><p className="text-sm leading-7">A persistência da desigualdade educacional no Brasil exige <mark className="bg-[#ffe992] px-1 text-inherit">medidas articuladas</mark> entre poder público e comunidade escolar.</p><p className="text-sm leading-7">Entretanto, a ausência de infraestrutura <span className="border-b-2 border-[#ff6b6b]">limita oportunidades</span> e amplia diferenças históricas.</p></div><p className="mt-7 border-t border-[#cad6dd] pt-4 text-xs leading-5 text-[#607689]">2 trechos exigem revisão antes da próxima versão.</p></div>
          <div className="p-5 sm:p-7"><p className="text-sm font-semibold">Desempenho por competência</p><div className="mt-6 space-y-4">{competencies.map(([key, value, label]) => <div key={key} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3"><span className="font-mono text-xs text-[#9de8fb]">{key}</span><div><div className="text-xs text-[#8fa3b8]">{label}</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#050a12]"><div className="h-full rounded-full bg-[#35bfe7]" style={{ width: `${value / 2}%` }} /></div></div><strong className="font-mono text-sm tabular-nums">{value}</strong></div>)}</div><div className="mt-7 border-t border-[#8fa3b8]/14 pt-5"><p className="text-xs font-semibold text-[#f2c94c]">Sua próxima missão</p><p className="mt-2 text-sm leading-6 text-[#c4d1dc]">Desenvolver o segundo argumento com evidência concreta e relação de causa.</p></div></div>
        </div>
      </article>
    </div>
  );
}

function ProcessRow({ index, title, text }: { index: string; title: string; text: string }) {
  return <li className="grid gap-4 py-7 sm:grid-cols-[3rem_0.65fr_1fr] sm:items-start"><span className="font-mono text-sm text-[#35bfe7]">{index}</span><strong className="text-xl">{title}</strong><p className="leading-7 text-[#8fa3b8]">{text}</p></li>;
}

function PlanCard({ plan, onStart }: { plan: Plan; onStart: () => void }) {
  const action = () => plan.checkoutUrl ? openCheckout(plan.checkoutUrl) : onStart();
  return <article className={`relative flex min-h-[410px] flex-col rounded-2xl p-7 sm:p-8 ${plan.featured ? "bg-[#f2c94c] text-[#08111f] shadow-[0_28px_80px_rgba(2,7,15,0.46)]" : "border border-[#8fa3b8]/18 bg-[#0b1829]"}`}>{plan.featured ? <span className="absolute right-5 top-5 rounded-full bg-[#08111f] px-3 py-1.5 text-xs font-bold text-[#f4f1e8]">Mais escolhido</span> : null}<p className={`text-sm font-semibold ${plan.featured ? "text-[#314155]" : "text-[#9de8fb]"}`}>{plan.name}</p><p className="mt-8 text-4xl font-semibold tracking-[-0.035em]">{plan.price}</p><p className={`mt-3 font-semibold ${plan.featured ? "text-[#203247]" : "text-[#dce6ec]"}`}>{plan.credits}</p>{plan.daily ? <p className={`mt-5 w-fit text-lg font-bold underline decoration-2 underline-offset-8 ${plan.featured ? "decoration-[#08111f]" : "text-[#f2c94c] decoration-[#f2c94c]"}`}>{plan.daily}</p> : null}<p className={`mt-5 text-sm leading-6 ${plan.featured ? "text-[#34485a]" : "text-[#8fa3b8]"}`}>{plan.description}</p><button type="button" onClick={action} className={`mt-auto min-h-12 rounded-lg px-5 font-bold transition ${plan.featured ? "bg-[#08111f] text-[#f4f1e8] hover:bg-[#14263d]" : "border border-[#8fa3b8]/25 bg-[#13243a] text-[#f4f1e8] hover:border-[#35bfe7]/50 hover:bg-[#172b45]"}`}>{plan.checkoutUrl ? "Escolher este plano" : "Começar grátis"}</button></article>;
}
