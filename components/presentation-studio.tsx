"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Files,
  FolderOpen,
  HelpCircle,
  LayoutPanelTop,
  Library,
  ListPlus,
  MessageSquareText,
  Minus,
  NotebookTabs,
  Palette,
  Pause,
  PencilLine,
  Play,
  RotateCcw,
  Send,
  Share2,
  Sparkles,
  Trash2,
  X,
  WandSparkles
} from "lucide-react";

import { Button, GhostButton } from "@/components/ui";
import { Loader } from "@/components/ui/loader-15";
import {
  slideTypes,
  type PresentationPlan,
  type PresentationPlanSlide,
  type PresentationRehearsal,
  type PresentationStudioDeck,
  type PresentationStudioSlide,
  type SlideType
} from "@/lib/ai/presentations/schema";
import { deckFromRecords, planFromRecord, type PresentationRecord, type PresentationSlideRecord } from "@/lib/ai/presentations/records";
import { normalizePresentationTheme, presentationThemeNames, presentationThemes, type PresentationThemeName } from "@/lib/ai/presentations/themes";
import { getSupabaseClient } from "@/lib/supabase/client";

type Stage = "loading" | "start" | "clarifying" | "plan" | "generating" | "editor" | "rehearsal";

type ShareState = { open: boolean; loading: boolean; enabled: boolean; url: string };

const promptExamples = [
  "Revolução Francesa em 8 slides",
  "Seminário sobre inteligência artificial",
  "Pitch de startup em 10 slides",
  "Aula sobre fotossíntese",
  "Apresentação de TCC"
];

const slideTypeLabels: Record<SlideType, string> = {
  cover: "Capa",
  section: "Seção",
  text_image: "Texto + imagem",
  comparison: "Comparação",
  timeline: "Timeline",
  process: "Processo",
  data: "Dado",
  chart: "Gráfico",
  quote: "Citação",
  conclusion: "Conclusão",
  call_to_action: "Chamada final"
};

export function PresentationStudio() {
  const [stage, setStage] = useState<Stage>("loading");
  const [request, setRequest] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("Didático");
  const [durationMinutes, setDurationMinutes] = useState(8);
  const [balance, setBalance] = useState<number | null>(null);
  const [plan, setPlan] = useState<PresentationPlan | null>(null);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<string[]>([]);
  const [deck, setDeck] = useState<PresentationStudioDeck | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [aiEditing, setAiEditing] = useState(false);
  const [presentations, setPresentations] = useState<PresentationRecord[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [exporting, setExporting] = useState<"pdf" | "pptx" | null>(null);
  const [shareState, setShareState] = useState<ShareState>({ open: false, loading: false, enabled: false, url: "" });
  const [rehearsal, setRehearsal] = useState<PresentationRehearsal | null>(null);
  const [rehearsalLoading, setRehearsalLoading] = useState(false);
  const saveTimers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("A conexão com sua conta não está configurada.");
      setStage("start");
      return;
    }

    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        window.location.assign("/");
        return;
      }
      const [creditResult, libraryResult] = await Promise.all([
        supabase.from("user_credits").select("balance").eq("user_id", data.session.user.id).maybeSingle<{ balance: number }>(),
        supabase.from("presentations").select("*").eq("user_id", data.session.user.id).order("updated_at", { ascending: false }).limit(24).returns<PresentationRecord[]>()
      ]);
      if (!active) return;
      setBalance(creditResult.data?.balance ?? 0);
      setPresentations(libraryResult.data ?? []);
      setLibraryLoading(false);
      setStage("start");
    })();

    return () => {
      active = false;
      saveTimers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  async function createPlan(options?: { answers?: string[]; variation?: boolean }) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    if (request.trim().length < 12) {
      setError("Descreva o que você precisa criar com um pouco mais de contexto.");
      return;
    }

    setError("");
    setStage("generating");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
      const answers = options?.variation
        ? ["Crie uma estrutura realmente diferente, mantendo o mesmo objetivo e público."]
        : options?.answers;
      const response = await fetch("/api/presentations/plan", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          request: request.trim(),
          audience,
          tone,
          durationMinutes,
          answers,
          presentationId
        })
      });
      const result = await response.json() as {
        presentationId?: string;
        plan?: PresentationPlan;
        balance?: number;
        error?: string;
      };
      if (!response.ok || !result.plan) throw new Error(result.error || "Não foi possível criar o plano.");
      setBalance(result.balance ?? balance);
      setPlan(result.plan);
      if (result.presentationId) setPresentationId(result.presentationId);
      if (!result.plan.ready) {
        setClarificationAnswers(result.plan.clarificationQuestions.map(() => ""));
        setStage("clarifying");
      } else {
        setStage("plan");
      }
    } catch (planningError) {
      setError(planningError instanceof Error ? planningError.message : "Não foi possível criar o plano.");
      setStage(plan?.ready ? "plan" : "start");
    }
  }

  async function generatePresentation() {
    const supabase = getSupabaseClient();
    if (!supabase || !plan || !presentationId) return;
    setError("");
    setStage("generating");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
      const response = await fetch(`/api/presentations/${presentationId}/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const result = await response.json() as { deck?: PresentationStudioDeck; balance?: number; error?: string };
      if (!response.ok || !result.deck) throw new Error(result.error || "Não foi possível gerar os slides.");
      setDeck(result.deck);
      setSelectedSlideId(result.deck.slides[0]?.id ?? null);
      setBalance(result.balance ?? balance);
      setShareState({ open: false, loading: false, enabled: false, url: "" });
      setStage("editor");
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Não foi possível gerar os slides.");
      setStage("plan");
    }
  }

  function updatePlanSlide(id: string, patch: Partial<PresentationPlanSlide>) {
    setPlan((current) => current ? {
      ...current,
      slides: current.slides.map((slide) => slide.id === id ? { ...slide, ...patch } : slide)
    } : current);
  }

  function movePlanSlide(index: number, direction: -1 | 1) {
    setPlan((current) => {
      if (!current) return current;
      const target = index + direction;
      if (target < 0 || target >= current.slides.length) return current;
      const slides = [...current.slides];
      [slides[index], slides[target]] = [slides[target], slides[index]];
      return { ...current, slides: slides.map((slide, itemIndex) => ({ ...slide, order: itemIndex + 1 })) };
    });
  }

  function addPlanSlide() {
    setPlan((current) => {
      if (!current || current.slides.length >= 14) return current;
      const order = current.slides.length + 1;
      return {
        ...current,
        slides: [...current.slides, {
          id: `manual-${Date.now()}`,
          order,
          type: "text_image",
          title: "Novo slide",
          purpose: "Defina o papel deste slide na narrativa."
        }]
      };
    });
  }

  function removePlanSlide(id: string) {
    setPlan((current) => {
      if (!current || current.slides.length <= 3) return current;
      return {
        ...current,
        slides: current.slides.filter((slide) => slide.id !== id).map((slide, index) => ({ ...slide, order: index + 1 }))
      };
    });
  }

  function updateDeckSlide(id: string, patch: Partial<PresentationStudioSlide>) {
    const currentSlide = deck?.slides.find((slide) => slide.id === id);
    if (!currentSlide) return;
    const nextSlide = { ...currentSlide, ...patch };
    setDeck((current) => {
      if (!current) return current;
      const slides = current.slides.map((slide) => slide.id === id ? nextSlide : slide);
      return { ...current, slides };
    });
    scheduleSlideSave(nextSlide);
  }

  function scheduleSlideSave(slide: PresentationStudioSlide) {
    const previous = saveTimers.current.get(slide.id);
    if (previous) window.clearTimeout(previous);
    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      const saved = await persistSlide(slide);
      setSaveState(saved ? "saved" : "error");
      saveTimers.current.delete(slide.id);
    }, 650);
    saveTimers.current.set(slide.id, timer);
  }

  async function updateTheme(theme: PresentationThemeName) {
    if (!deck || !presentationId) return;
    setDeck((current) => current ? { ...current, theme } : current);
    setSaveState("saving");
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error: themeError } = await supabase
      .from("presentations")
      .update({ theme, updated_at: new Date().toISOString() })
      .eq("id", presentationId);
    setSaveState(themeError ? "error" : "saved");
  }

  async function editSlideWithAi(slide: PresentationStudioSlide, instruction: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !deck || !presentationId || aiEditing) return;
    if ((balance ?? 0) < 1) {
      setError("Você precisa de 1 crédito para editar este slide com IA.");
      return;
    }
    setAiEditing(true);
    setError("");
    try {
      const pendingSave = saveTimers.current.get(slide.id);
      if (pendingSave) {
        window.clearTimeout(pendingSave);
        saveTimers.current.delete(slide.id);
      }
      setSaveState("saving");
      if (!await persistSlide(slide)) throw new Error("Não foi possível salvar suas últimas alterações antes de usar a IA.");

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
      const response = await fetch(`/api/presentations/${presentationId}/slides/${slide.id}/edit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ instruction })
      });
      const result = await response.json() as { slide?: PresentationStudioSlide; balance?: number; error?: string };
      if (!response.ok || !result.slide) throw new Error(result.error || "Não foi possível editar este slide.");
      setDeck((current) => current ? {
        ...current,
        slides: current.slides.map((item) => item.id === slide.id ? result.slide as PresentationStudioSlide : item)
      } : current);
      setBalance(result.balance ?? balance);
      setSaveState("saved");
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : "Não foi possível editar este slide.");
    } finally {
      setAiEditing(false);
    }
  }

  async function persistSlide(slide: PresentationStudioSlide) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { error: saveError } = await supabase
      .from("presentation_slides")
      .update({
        slide_type: slide.type,
        title: slide.title,
        subtitle: slide.subtitle,
        body: slide.body,
        visual: slide.visual,
        speaker_notes: slide.speaker_notes,
        sources: slide.sources,
        updated_at: new Date().toISOString()
      })
      .eq("id", slide.id);
    return !saveError;
  }

  async function getAccessToken() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function refreshLibrary() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setLibraryLoading(true);
    const { data } = await supabase.from("presentations").select("*").order("updated_at", { ascending: false }).limit(24).returns<PresentationRecord[]>();
    setPresentations(data ?? []);
    setLibraryLoading(false);
  }

  function startNewPresentation() {
    setRequest("");
    setAudience("");
    setTone("Didático");
    setDurationMinutes(8);
    setPlan(null);
    setDeck(null);
    setPresentationId(null);
    setSelectedSlideId(null);
    setShareState({ open: false, loading: false, enabled: false, url: "" });
    setRehearsal(null);
    setError("");
    setStage("start");
  }

  async function openPresentation(id: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setError("");
    setStage("loading");
    const [presentationResult, slidesResult] = await Promise.all([
      supabase.from("presentations").select("*").eq("id", id).maybeSingle<PresentationRecord>(),
      supabase.from("presentation_slides").select("id, order_index, slide_type, title, subtitle, body, visual, speaker_notes, sources").eq("presentation_id", id).order("order_index", { ascending: true }).returns<PresentationSlideRecord[]>()
    ]);
    const record = presentationResult.data;
    if (!record) {
      setError("Não foi possível abrir esta apresentação.");
      setStage("start");
      return;
    }
    setPresentationId(record.id);
    setRequest(record.source_prompt);
    setAudience(record.audience);
    setTone(record.tone);
    setDurationMinutes(record.duration_minutes);
    if (record.status === "planned") {
      setPlan(planFromRecord(record));
      setStage("plan");
      return;
    }
    const loadedDeck = deckFromRecords(record, slidesResult.data ?? []);
    if (!loadedDeck.slides.length) {
      setError("Esta apresentação não possui slides disponíveis.");
      setStage("start");
      return;
    }
    setDeck(loadedDeck);
    setSelectedSlideId(loadedDeck.slides[0].id);
    setShareState({ open: false, loading: false, enabled: Boolean(record.is_public), url: record.is_public && record.share_token ? `${window.location.origin}/apresentacoes/compartilhada/${record.share_token}` : "" });
    setStage("editor");
  }

  async function duplicatePresentation(id: string) {
    const token = await getAccessToken();
    if (!token) return;
    setError("");
    const response = await fetch(`/api/presentations/${id}/duplicate`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json() as { presentationId?: string; error?: string };
    if (!response.ok || !result.presentationId) {
      setError(result.error || "Não foi possível duplicar esta apresentação.");
      return;
    }
    await refreshLibrary();
    await openPresentation(result.presentationId);
  }

  async function deletePresentation(id: string, title: string) {
    if (!window.confirm(`Excluir “${title}” permanentemente? Esta ação não pode ser desfeita.`)) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error: deleteError } = await supabase.from("presentations").delete().eq("id", id);
    if (deleteError) {
      setError("Não foi possível excluir esta apresentação.");
      return;
    }
    setPresentations((current) => current.filter((item) => item.id !== id));
  }

  async function renamePresentation(title: string) {
    if (!presentationId || !deck) return;
    const cleaned = title.trim().slice(0, 160);
    if (!cleaned) return;
    setDeck((current) => current ? { ...current, title: cleaned } : current);
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setSaveState("saving");
    const { error: renameError } = await supabase.from("presentations").update({ title: cleaned, updated_at: new Date().toISOString() }).eq("id", presentationId);
    setSaveState(renameError ? "error" : "saved");
  }

  async function flushPendingSlides() {
    if (!deck) return false;
    const pendingIds = [...saveTimers.current.keys()];
    if (!pendingIds.length) return true;
    pendingIds.forEach((id) => {
      const timer = saveTimers.current.get(id);
      if (timer) window.clearTimeout(timer);
      saveTimers.current.delete(id);
    });
    setSaveState("saving");
    const pendingSlides = deck.slides.filter((slide) => pendingIds.includes(slide.id));
    const results = await Promise.all(pendingSlides.map((slide) => persistSlide(slide)));
    const saved = results.every(Boolean);
    setSaveState(saved ? "saved" : "error");
    return saved;
  }

  async function exportPresentation(format: "pdf" | "pptx") {
    if (!presentationId || exporting) return;
    setError("");
    setExporting(format);
    try {
      if (!await flushPendingSlides()) throw new Error("Não foi possível salvar as alterações antes da exportação.");
      const token = await getAccessToken();
      if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
      const response = await fetch(`/api/presentations/${presentationId}/export?format=${format}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error || "Não foi possível exportar a apresentação.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? `apresentacao.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Não foi possível exportar a apresentação.");
    } finally {
      setExporting(null);
    }
  }

  async function changeSharing(enabled: boolean) {
    if (!presentationId) return;
    setShareState((current) => ({ ...current, open: true, loading: true }));
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
      const response = await fetch(`/api/presentations/${presentationId}/share`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
      const result = await response.json() as { enabled?: boolean; url?: string | null; error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível alterar o compartilhamento.");
      setShareState({ open: true, loading: false, enabled: Boolean(result.enabled), url: result.url ?? "" });
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : "Não foi possível alterar o compartilhamento.");
      setShareState((current) => ({ ...current, loading: false }));
    }
  }

  async function prepareRehearsal() {
    if (!presentationId || !deck || rehearsalLoading) return;
    setError("");
    setRehearsalLoading(true);
    try {
      if (!await flushPendingSlides()) throw new Error("Não foi possível salvar os slides antes do treino.");
      const token = await getAccessToken();
      if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
      const response = await fetch(`/api/presentations/${presentationId}/rehearsal`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json() as { rehearsal?: PresentationRehearsal; error?: string };
      if (!response.ok || !result.rehearsal) throw new Error(result.error || "Não foi possível preparar o treino.");
      setRehearsal(result.rehearsal);
      setStage("rehearsal");
    } catch (rehearsalError) {
      setError(rehearsalError instanceof Error ? rehearsalError.message : "Não foi possível preparar o treino.");
    } finally {
      setRehearsalLoading(false);
    }
  }

  if (stage === "loading") {
    return <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas"><Loader size="lg" /></main>;
  }

  if (stage === "rehearsal" && deck && rehearsal) {
    return <RehearsalWorkspace deck={deck} rehearsal={rehearsal} initialSlideId={selectedSlideId} onExit={(slideId) => { setSelectedSlideId(slideId); setStage("editor"); }} />;
  }

  if (stage === "editor" && deck) {
    const selected = deck.slides.find((slide) => slide.id === selectedSlideId) ?? deck.slides[0];
    return (
      <>
      <EditorWorkspace
        deck={deck}
        selected={selected}
        saveState={saveState}
        balance={balance}
        aiEditing={aiEditing}
        error={error}
        onSelect={setSelectedSlideId}
        onUpdate={updateDeckSlide}
        onThemeChange={(theme) => void updateTheme(theme)}
        onAiEdit={(slide, instruction) => void editSlideWithAi(slide, instruction)}
        exporting={exporting}
        onBack={() => { void refreshLibrary(); startNewPresentation(); }}
        onRename={(title) => void renamePresentation(title)}
        onExport={(format) => void exportPresentation(format)}
        onShare={() => setShareState((current) => ({ ...current, open: true }))}
        rehearsalLoading={rehearsalLoading}
        onRehearse={() => void prepareRehearsal()}
      />
      {shareState.open ? <ShareDialog state={shareState} onEnable={() => void changeSharing(true)} onDisable={() => void changeSharing(false)} onClose={() => setShareState((current) => ({ ...current, open: false }))} /> : null}
      </>
    );
  }

  return (
    <main className="mission-grid min-h-[100dvh] bg-canvas px-4 py-5 text-white sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <StudioHeader balance={balance} />

        {stage === "start" ? (
          <>
          <section className="mx-auto max-w-4xl py-12 sm:py-16">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.08] px-3 py-1.5 text-xs font-medium text-aura">
                <LayoutPanelTop className="h-3.5 w-3.5" /> Estúdio de apresentações
              </span>
              <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-6xl">Crie sua apresentação.</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                Diga o tema. O Pontuei estrutura, escreve e monta os slides para você editar.
              </p>
            </div>

            <div className="premium-glow mt-10 rounded-lg border border-white/10 bg-black/35 p-3 shadow-command sm:p-4">
              <textarea
                value={request}
                onChange={(event) => setRequest(event.target.value)}
                placeholder="Ex: apresentação de 8 minutos sobre aquecimento global para o ensino médio"
                className="min-h-36 w-full resize-none bg-transparent px-2 py-2 text-base leading-7 text-white outline-none placeholder:text-slate-600 sm:text-lg"
              />
              <div className="grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-[1fr_130px_150px_auto]">
                <input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="Público (opcional)" className="studio-field" />
                <input type="number" min={1} max={180} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="studio-field" aria-label="Duração em minutos" />
                <select value={tone} onChange={(event) => setTone(event.target.value)} className="studio-field" aria-label="Tom da apresentação">
                  <option>Didático</option><option>Acadêmico</option><option>Profissional</option><option>Convincente</option><option>Visual</option>
                </select>
                <Button onClick={() => void createPlan()} className="min-w-44">
                  Criar apresentação <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {promptExamples.map((example) => (
                <button key={example} onClick={() => setRequest(example)} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-slate-400 transition-colors duration-200 hover:border-accent/30 hover:text-white active:scale-[0.98]">
                  {example}
                </button>
              ))}
            </div>
            {error ? <ErrorMessage message={error} /> : null}
          </section>
          <PresentationLibrary presentations={presentations} loading={libraryLoading} onOpen={(id) => void openPresentation(id)} onDuplicate={(id) => void duplicatePresentation(id)} onDelete={(id, title) => void deletePresentation(id, title)} />
          </>
        ) : null}

        {stage === "clarifying" && plan ? (
          <section className="mx-auto max-w-2xl py-12 sm:py-16">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-aura">Só o essencial</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Preciso alinhar {plan.clarificationQuestions.length === 1 ? "um ponto" : "alguns pontos"}.</h1>
            <p className="mt-3 text-sm leading-6 text-muted">Responda de forma curta. Depois disso, o plano fica pronto para sua aprovação.</p>
            <div className="mt-8 grid gap-5">
              {plan.clarificationQuestions.map((question, index) => (
                <label key={question} className="grid gap-2 text-sm text-slate-200">
                  {question}
                  <input value={clarificationAnswers[index] ?? ""} onChange={(event) => setClarificationAnswers((current) => current.map((answer, itemIndex) => itemIndex === index ? event.target.value : answer))} className="studio-field min-h-12" />
                </label>
              ))}
            </div>
            <Button onClick={() => void createPlan({ answers: clarificationAnswers })} className="mt-7 w-full">Continuar <ArrowRight className="h-4 w-4" /></Button>
            {error ? <ErrorMessage message={error} /> : null}
          </section>
        ) : null}

        {stage === "plan" && plan ? (
          <PlanEditor
            plan={plan}
            balance={balance}
            error={error}
            onChange={setPlan}
            onSlideChange={updatePlanSlide}
            onMove={movePlanSlide}
            onAdd={addPlanSlide}
            onRemove={removePlanSlide}
            onRegenerate={() => void createPlan({ variation: true })}
            onGenerate={() => void generatePresentation()}
          />
        ) : null}

        {stage === "generating" ? <GenerationProgress hasPlan={Boolean(plan?.ready)} /> : null}
      </div>
      {shareState.open ? <ShareDialog state={shareState} onEnable={() => void changeSharing(true)} onDisable={() => void changeSharing(false)} onClose={() => setShareState((current) => ({ ...current, open: false }))} /> : null}
    </main>
  );
}

function StudioHeader({ balance }: { balance: number | null }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-slate-300 transition-colors duration-200 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>
      <Image src="/pontuei-logo-lockup.svg" alt="Pontuei" width={640} height={220} priority className="h-9 w-auto object-contain" />
      <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-300">
        <CircleDollarSign className="h-4 w-4 text-aura" /> {balance ?? 0}
      </span>
    </header>
  );
}

function PresentationLibrary({ presentations, loading, onOpen, onDuplicate, onDelete }: {
  presentations: PresentationRecord[];
  loading: boolean;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string, title: string) => void;
}) {
  return (
    <section className="border-t border-white/10 pb-16 pt-9">
      <div className="flex items-end justify-between gap-4">
        <div><p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-aura"><Library className="h-3.5 w-3.5" /> Biblioteca</p><h2 className="mt-2 text-2xl font-semibold text-white">Minhas apresentações</h2></div>
        <span className="text-xs text-muted">{presentations.length} {presentations.length === 1 ? "arquivo" : "arquivos"}</span>
      </div>
      {loading ? <div className="grid min-h-40 place-items-center"><Loader size="md" /></div> : presentations.length ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {presentations.map((presentation) => (
            <article key={presentation.id} className="group rounded-lg border border-white/10 bg-white/[0.03] p-4 transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.045]">
              <button type="button" onClick={() => onOpen(presentation.id)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-md border border-accent/20 bg-accent/[0.08] text-aura"><FolderOpen className="h-4 w-4" /></span><span className={`rounded-full border px-2 py-1 text-[0.62rem] ${presentation.status === "generated" ? "border-emerald-300/20 text-emerald-200" : "border-amber-300/20 text-amber-100"}`}>{presentation.status === "generated" ? "Pronta" : "Em planejamento"}</span></div>
                <h3 className="mt-4 line-clamp-2 min-h-12 font-semibold leading-6 text-white">{presentation.title}</h3>
                <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-muted">{presentation.objective || presentation.source_prompt}</p>
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-[0.68rem] text-muted"><span>{presentation.slide_count} slides · {presentation.theme}</span><span>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(presentation.updated_at))}</span></div>
              </button>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <button type="button" onClick={() => onDuplicate(presentation.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 text-xs text-slate-300 transition-colors hover:border-accent/30 hover:text-white"><Files className="h-3.5 w-3.5" /> Duplicar</button>
                <button type="button" onClick={() => onDelete(presentation.id, presentation.title)} title="Excluir apresentação" aria-label={`Excluir ${presentation.title}`} className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-slate-500 transition-colors hover:border-rose-300/30 hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 flex min-h-40 items-center justify-center rounded-lg border border-dashed border-white/10 text-center"><div><Files className="mx-auto h-5 w-5 text-slate-600" /><p className="mt-3 text-sm text-slate-300">Sua primeira apresentação aparecerá aqui.</p><p className="mt-1 text-xs text-muted">Comece pelo pedido acima.</p></div></div>
      )}
    </section>
  );
}

function ShareDialog({ state, onEnable, onDisable, onClose }: { state: ShareState; onEnable: () => void; onDisable: () => void; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  async function copyLink() {
    if (!state.url) return;
    await navigator.clipboard.writeText(state.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div className="w-full max-w-lg rounded-lg border border-white/10 bg-[#0b1714] p-5 shadow-command sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-aura">Compartilhamento</p><h2 id="share-title" className="mt-2 text-xl font-semibold text-white">Apresentação somente leitura</h2></div><button type="button" onClick={onClose} aria-label="Fechar" className="grid h-9 w-9 place-items-center rounded-md text-slate-400 hover:bg-white/[0.05] hover:text-white"><X className="h-4 w-4" /></button></div>
        <p className="mt-4 text-sm leading-6 text-muted">Quem tiver o link poderá visualizar e apresentar os slides. Edição, notas e seus dados de conta permanecem privados.</p>
        {state.enabled && state.url ? (
          <div className="mt-5">
            <div className="flex gap-2"><input readOnly value={state.url} className="studio-field min-w-0 flex-1" /><button type="button" onClick={() => void copyLink()} className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-accent/25 bg-accent/[0.08] text-aura">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button><a href={state.url} target="_blank" rel="noreferrer" aria-label="Abrir link" className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-white/10 text-slate-300 hover:text-white"><ExternalLink className="h-4 w-4" /></a></div>
            <button type="button" disabled={state.loading} onClick={onDisable} className="mt-4 min-h-10 text-sm text-rose-200 hover:text-rose-100 disabled:opacity-50">Desativar link público</button>
          </div>
        ) : (
          <Button disabled={state.loading} onClick={onEnable} className="mt-6 w-full">{state.loading ? <><Loader size="sm" /> Criando link</> : <><Share2 className="h-4 w-4" /> Criar link de visualização</>}</Button>
        )}
      </div>
    </div>
  );
}

function PlanEditor({ plan, balance, error, onChange, onSlideChange, onMove, onAdd, onRemove, onRegenerate, onGenerate }: {
  plan: PresentationPlan;
  balance: number | null;
  error: string;
  onChange: (plan: PresentationPlan) => void;
  onSlideChange: (id: string, patch: Partial<PresentationPlanSlide>) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRegenerate: () => void;
  onGenerate: () => void;
}) {
  return (
    <section className="py-8 sm:py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-aura">Plano da apresentação</p>
          <input value={plan.title} onChange={(event) => onChange({ ...plan, title: event.target.value })} className="mt-3 w-full bg-transparent text-3xl font-semibold leading-tight text-white outline-none sm:text-5xl" />
          <textarea value={plan.objective} onChange={(event) => onChange({ ...plan, objective: event.target.value })} className="mt-4 min-h-16 w-full resize-none bg-transparent text-sm leading-6 text-muted outline-none" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <PlanMetric label="público" value={plan.audience} />
          <PlanMetric label="duração" value={`${plan.durationMinutes} min`} />
          <PlanMetric label="slides" value={String(plan.slides.length)} />
        </div>
      </div>

      <div className="mt-8 grid gap-3">
        {plan.slides.map((slide, index) => (
          <div key={slide.id} className="group grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 transition-colors duration-200 hover:border-white/20 md:grid-cols-[42px_160px_minmax(0,1fr)_auto] md:items-center">
            <span className="energy-text text-lg text-aura">{String(index + 1).padStart(2, "0")}</span>
            <select value={slide.type} onChange={(event) => onSlideChange(slide.id, { type: event.target.value as SlideType })} className="studio-field">
              {slideTypes.map((type) => <option key={type} value={type}>{slideTypeLabels[type]}</option>)}
            </select>
            <div className="min-w-0">
              <input value={slide.title} onChange={(event) => onSlideChange(slide.id, { title: event.target.value })} className="w-full bg-transparent font-semibold text-white outline-none" />
              <input value={slide.purpose} onChange={(event) => onSlideChange(slide.id, { purpose: event.target.value })} className="mt-1 w-full bg-transparent text-sm text-muted outline-none" />
            </div>
            <div className="flex gap-1">
              <IconButton label="Mover para cima" disabled={index === 0} onClick={() => onMove(index, -1)}><ChevronUp className="h-4 w-4" /></IconButton>
              <IconButton label="Mover para baixo" disabled={index === plan.slides.length - 1} onClick={() => onMove(index, 1)}><ChevronDown className="h-4 w-4" /></IconButton>
              <IconButton label="Remover slide" disabled={plan.slides.length <= 3} onClick={() => onRemove(slide.id)}><Minus className="h-4 w-4" /></IconButton>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <GhostButton onClick={onAdd} disabled={plan.slides.length >= 14}><ListPlus className="h-4 w-4" /> Adicionar slide</GhostButton>
        <p className="text-xs text-muted">Arrume a narrativa antes de gastar créditos. Depois você edita cada slide.</p>
      </div>

      {error ? <ErrorMessage message={error} /> : null}
      <div className="sticky bottom-4 z-10 mt-8 flex flex-col gap-3 rounded-lg border border-white/10 bg-[#07110f]/90 p-3 shadow-command backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <GhostButton onClick={onRegenerate}><RotateCcw className="h-4 w-4" /> Outra estrutura</GhostButton>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="text-xs text-muted">A geração completa usa 10 créditos. Saldo: {balance ?? 0}</span>
          <Button onClick={onGenerate} disabled={(balance ?? 0) < 10}>Aprovar e gerar slides <Sparkles className="h-4 w-4" /></Button>
        </div>
      </div>
    </section>
  );
}

function GenerationProgress({ hasPlan }: { hasPlan: boolean }) {
  const labels = hasPlan
    ? ["Escrevendo os slides…", "Definindo a composição…", "Revisando a apresentação…"]
    : ["Entendendo o tema…", "Criando a estrutura…", "Organizando a narrativa…"];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => Math.min(labels.length - 1, current + 1)), 1700);
    return () => window.clearInterval(timer);
  }, [labels.length]);
  return (
    <section className="grid min-h-[65dvh] place-items-center py-12 text-center">
      <div>
        <Loader size="lg" />
        <p className="mt-7 text-lg font-semibold text-white">{labels[index]}</p>
        <p className="mt-2 text-sm text-muted">Seu trabalho continuará editável quando ficar pronto.</p>
      </div>
    </section>
  );
}

function EditorWorkspace({ deck, selected, saveState, balance, aiEditing, error, exporting, rehearsalLoading, onSelect, onUpdate, onThemeChange, onAiEdit, onBack, onRename, onExport, onShare, onRehearse }: {
  deck: PresentationStudioDeck;
  selected: PresentationStudioSlide;
  saveState: "idle" | "saving" | "saved" | "error";
  balance: number | null;
  aiEditing: boolean;
  error: string;
  exporting: "pdf" | "pptx" | null;
  rehearsalLoading: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PresentationStudioSlide>) => void;
  onThemeChange: (theme: PresentationThemeName) => void;
  onAiEdit: (slide: PresentationStudioSlide, instruction: string) => void;
  onBack: () => void;
  onRename: (title: string) => void;
  onExport: (format: "pdf" | "pptx") => void;
  onShare: () => void;
  onRehearse: () => void;
}) {
  const [panel, setPanel] = useState<"content" | "design" | "notes" | "ai">("content");
  const [instruction, setInstruction] = useState("");
  const theme = presentationThemes[normalizePresentationTheme(deck.theme)];
  const quickActions = [
    ["Resumir", "Reduza o texto visível e preserve apenas as ideias essenciais."],
    ["Mais visual", "Torne este slide mais visual, reduza texto e melhore a direção de layout."],
    ["Simplificar", "Explique este slide de forma mais simples para o público definido."],
    ["Adicionar exemplo", "Adicione um exemplo curto, concreto e coerente com o tema."],
    ["Mais acadêmico", "Deixe a linguagem mais acadêmica sem criar texto excessivo."],
    ["Melhorar conclusão", "Reforce a conclusão deste slide e sua ligação com a narrativa."]
  ] as const;

  return (
    <main className="mission-grid min-h-[100dvh] bg-canvas text-white">
      <header className="flex min-h-16 items-center gap-2 border-b border-white/10 bg-black/35 px-3 backdrop-blur-xl sm:px-5">
        <button type="button" onClick={onBack} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-2 text-sm text-slate-300 hover:bg-white/[0.04] hover:text-white"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Biblioteca</span></button>
        <div className="min-w-0 flex-1 px-1 sm:px-3">
          <input defaultValue={deck.title} onBlur={(event) => onRename(event.target.value)} aria-label="Nome da apresentação" className="w-full truncate bg-transparent text-center text-sm font-semibold text-white outline-none focus:text-aura" />
          <p className="text-center text-[0.68rem] text-muted">{deck.slides.length} slides · {deck.theme}</p>
        </div>
        <span className={`hidden min-w-16 text-right text-[0.68rem] sm:block ${saveState === "error" ? "text-rose-300" : "text-muted"}`}>{saveState === "saving" ? "Salvando…" : saveState === "saved" ? "Salvo" : saveState === "error" ? "Erro ao salvar" : ""}</span>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" title="Treinar apresentação" aria-label="Treinar apresentação" disabled={rehearsalLoading} onClick={onRehearse} className="inline-flex h-10 items-center gap-2 rounded-md border border-accent/25 bg-accent/[0.07] px-3 text-xs text-aura transition-colors hover:border-accent/45 hover:bg-accent/[0.12] disabled:opacity-50">{rehearsalLoading ? <Loader size="sm" /> : <Play className="h-4 w-4" />}<span className="hidden xl:inline">Treinar</span></button>
          <button type="button" title="Exportar PDF" aria-label="Exportar PDF" disabled={Boolean(exporting)} onClick={() => onExport("pdf")} className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-slate-300 transition-colors hover:border-accent/35 hover:text-white disabled:opacity-40">{exporting === "pdf" ? <Loader size="sm" /> : <FileText className="h-4 w-4" />}</button>
          <button type="button" title="Exportar PowerPoint" aria-label="Exportar PowerPoint" disabled={Boolean(exporting)} onClick={() => onExport("pptx")} className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-slate-300 transition-colors hover:border-accent/35 hover:text-white disabled:opacity-40">{exporting === "pptx" ? <Loader size="sm" /> : <Download className="h-4 w-4" />}</button>
          <button type="button" title="Compartilhar" aria-label="Compartilhar" onClick={onShare} className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-slate-300 transition-colors hover:border-accent/35 hover:text-white"><Share2 className="h-4 w-4" /></button>
        </div>
      </header>

      <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-[220px_minmax(0,1fr)_370px]">
        <aside className="order-2 overflow-x-auto border-t border-white/10 bg-black/20 p-3 lg:order-none lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:border-r lg:border-t-0">
          <div className="flex gap-3 lg:grid">
            {deck.slides.map((slide, index) => (
              <button key={slide.id} onClick={() => onSelect(slide.id)} className={`min-w-40 rounded-lg border p-2 text-left transition-colors duration-150 active:scale-[0.98] lg:min-w-0 ${slide.id === selected.id ? "border-accent/50 bg-accent/10" : "border-white/10 bg-white/[0.025] hover:border-white/20"}`}>
                <div className="aspect-video rounded-md border p-2" style={{ backgroundColor: theme.background, borderColor: theme.border }}><p className="line-clamp-2 text-[0.64rem] font-semibold leading-4" style={{ color: theme.foreground }}>{slide.title}</p></div>
                <p className="mt-2 truncate text-xs text-muted">{index + 1}. {slideTypeLabels[slide.type]}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="order-1 grid min-w-0 place-items-center overflow-hidden p-4 sm:p-8 lg:order-none lg:p-10">
          <SlideCanvas slide={selected} deck={deck} />
        </section>

        <aside className="order-3 border-t border-white/10 bg-black/25 lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:border-l lg:border-t-0">
          <div className="sticky top-0 z-10 grid grid-cols-4 border-b border-white/10 bg-[#07110f]/95 p-2 backdrop-blur-xl">
            <PanelTab active={panel === "content"} label="Conteúdo" onClick={() => setPanel("content")}><PencilLine className="h-4 w-4" /></PanelTab>
            <PanelTab active={panel === "design"} label="Design" onClick={() => setPanel("design")}><Palette className="h-4 w-4" /></PanelTab>
            <PanelTab active={panel === "notes"} label="Notas" onClick={() => setPanel("notes")}><NotebookTabs className="h-4 w-4" /></PanelTab>
            <PanelTab active={panel === "ai"} label="IA" onClick={() => setPanel("ai")}><Sparkles className="h-4 w-4" /></PanelTab>
          </div>

          <div className="p-5">
            {panel === "content" ? (
              <div>
                <h2 className="font-semibold">Conteúdo do slide</h2>
                <label className="mt-6 grid gap-2 text-xs text-muted">Tipo
                  <select value={selected.type} onChange={(event) => onUpdate(selected.id, { type: event.target.value as SlideType })} className="studio-field">
                    {slideTypes.map((type) => <option key={type} value={type}>{slideTypeLabels[type]}</option>)}
                  </select>
                </label>
                <label className="mt-4 grid gap-2 text-xs text-muted">Título
                  <textarea value={selected.title} onChange={(event) => onUpdate(selected.id, { title: event.target.value })} className="studio-field min-h-20 resize-none" />
                </label>
                <label className="mt-4 grid gap-2 text-xs text-muted">Subtítulo
                  <textarea value={selected.subtitle} onChange={(event) => onUpdate(selected.id, { subtitle: event.target.value })} className="studio-field min-h-20 resize-none" />
                </label>
                <label className="mt-4 grid gap-2 text-xs text-muted">Conteúdo <span className="text-[0.68rem]">Uma linha por item, até cinco</span>
                  <textarea value={selected.body.join("\n")} onChange={(event) => onUpdate(selected.id, { body: event.target.value.split("\n").slice(0, 5) })} className="studio-field min-h-40 resize-y leading-6" />
                </label>
              </div>
            ) : null}

            {panel === "design" ? (
              <div>
                <h2 className="font-semibold">Tema e direção visual</h2>
                <p className="mt-2 text-xs leading-5 text-muted">O tema muda a apresentação inteira sem alterar o conteúdo.</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {presentationThemeNames.map((themeName) => {
                    const option = presentationThemes[themeName];
                    const active = option.name === theme.name;
                    return (
                      <button key={themeName} type="button" onClick={() => onThemeChange(themeName)} className={`rounded-lg border p-3 text-left transition-colors duration-150 active:scale-[0.98] ${active ? "border-accent/55 bg-accent/10" : "border-white/10 bg-white/[0.025] hover:border-white/20"}`}>
                        <span className="flex gap-1.5"><i className="h-3 w-3 rounded-full" style={{ backgroundColor: option.background }} /><i className="h-3 w-3 rounded-full" style={{ backgroundColor: option.accent }} /><i className="h-3 w-3 rounded-full" style={{ backgroundColor: option.foreground }} /></span>
                        <span className="mt-2 block text-xs font-semibold text-white">{themeName}</span>
                      </button>
                    );
                  })}
                </div>
                <label className="mt-5 grid gap-2 text-xs text-muted">Composição
                  <textarea value={selected.visual.layout} onChange={(event) => onUpdate(selected.id, { visual: { ...selected.visual, layout: event.target.value } })} className="studio-field min-h-24 resize-y" />
                </label>
                <label className="mt-4 grid gap-2 text-xs text-muted">Elemento visual sugerido
                  <textarea value={selected.visual.imageSuggestion} onChange={(event) => onUpdate(selected.id, { visual: { ...selected.visual, imageSuggestion: event.target.value } })} className="studio-field min-h-24 resize-y" />
                </label>
                <label className="mt-4 grid gap-2 text-xs text-muted">Destaque principal
                  <textarea value={selected.visual.emphasis} onChange={(event) => onUpdate(selected.id, { visual: { ...selected.visual, emphasis: event.target.value } })} className="studio-field min-h-20 resize-y" />
                </label>
              </div>
            ) : null}

            {panel === "notes" ? (
              <div>
                <h2 className="font-semibold">Notas do apresentador</h2>
                <p className="mt-2 text-xs leading-5 text-muted">A explicação fica aqui, longe do conteúdo visual do slide.</p>
                <textarea value={selected.speaker_notes} onChange={(event) => onUpdate(selected.id, { speaker_notes: event.target.value })} placeholder="O que você deve falar neste slide…" className="studio-field mt-5 min-h-72 w-full resize-y leading-6" />
                {selected.sources.length ? (
                  <div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs font-medium text-aura">Fontes vinculadas</p>{selected.sources.map((source) => <p key={source} className="mt-2 break-words text-xs leading-5 text-muted">{source}</p>)}</div>
                ) : null}
              </div>
            ) : null}

            {panel === "ai" ? (
              <div>
                <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">Copiloto do slide</h2><p className="mt-2 text-xs leading-5 text-muted">A IA altera somente o slide selecionado.</p></div><span className="rounded-full border border-accent/20 bg-accent/[0.07] px-2 py-1 text-[0.65rem] text-aura">1 crédito</span></div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {quickActions.map(([label, prompt]) => <button key={label} disabled={aiEditing || (balance ?? 0) < 1} onClick={() => onAiEdit(selected, prompt)} className="min-h-12 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-left text-xs text-slate-300 transition-colors duration-150 hover:border-accent/30 hover:text-white active:scale-[0.98] disabled:opacity-40">{label}</button>)}
                </div>
                <label className="mt-5 grid gap-2 text-xs text-muted">Pedido personalizado
                  <textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="Ex: transforme em comparação e inclua um exemplo…" className="studio-field min-h-28 resize-y" />
                </label>
                <Button disabled={aiEditing || instruction.trim().length < 3 || (balance ?? 0) < 1} onClick={() => { onAiEdit(selected, instruction.trim()); setInstruction(""); }} className="mt-3 w-full">
                  {aiEditing ? <><Loader size="sm" /> Editando slide</> : <>Aplicar neste slide <Send className="h-4 w-4" /></>}
                </Button>
                <p className="mt-3 text-center text-xs text-muted">Saldo disponível: {balance ?? 0}</p>
              </div>
            ) : null}

            {error ? <ErrorMessage message={error} /> : null}
          </div>
        </aside>
      </div>
    </main>
  );
}

function RehearsalWorkspace({ deck, rehearsal, initialSlideId, onExit }: {
  deck: PresentationStudioDeck;
  rehearsal: PresentationRehearsal;
  initialSlideId: string | null;
  onExit: (slideId: string) => void;
}) {
  const initialIndex = Math.max(0, deck.slides.findIndex((slide) => slide.id === initialSlideId));
  const [index, setIndex] = useState(initialIndex);
  const [duration, setDuration] = useState<30 | 60 | 120>(60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [showScript, setShowScript] = useState(true);
  const currentSlide = deck.slides[index];
  const training = rehearsal.slides.find((item) => item.slideId === currentSlide.id) ?? rehearsal.slides[index];
  const script = duration === 30 ? training?.script30 : duration === 60 ? training?.script60 : training?.script120;
  const progress = Math.min(100, (elapsed / duration) * 100);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setElapsed((current) => {
        if (current + 1 >= duration) {
          setRunning(false);
          return duration;
        }
        return current + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [duration, running]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") changeSlide(Math.min(deck.slides.length - 1, index + 1));
      if (event.key === "ArrowLeft") changeSlide(Math.max(0, index - 1));
      if (event.key === "Escape") onExit(currentSlide.id);
      if (event.key === " " && event.target === document.body) {
        event.preventDefault();
        setRunning((value) => !value);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  function changeSlide(nextIndex: number) {
    setIndex(nextIndex);
    setElapsed(0);
    setRunning(false);
  }

  function changeDuration(nextDuration: 30 | 60 | 120) {
    setDuration(nextDuration);
    setElapsed(0);
    setRunning(false);
  }

  return (
    <main className="mission-grid flex min-h-[100dvh] flex-col bg-canvas text-white">
      <header className="flex min-h-16 items-center gap-3 border-b border-white/10 bg-black/40 px-3 backdrop-blur-xl sm:px-5">
        <button type="button" onClick={() => onExit(currentSlide.id)} className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm text-slate-300 hover:bg-white/[0.04] hover:text-white"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Voltar ao editor</span></button>
        <div className="min-w-0 flex-1 text-center"><p className="truncate text-sm font-semibold">Modo ensaio</p><p className="text-[0.68rem] text-muted">{deck.title}</p></div>
        <span className="min-w-16 text-right text-xs text-muted">{index + 1} / {deck.slides.length}</span>
      </header>

      <div className="grid flex-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,.6fr)]">
        <section className="flex min-w-0 flex-col border-b border-white/10 p-4 sm:p-7 lg:border-b-0 lg:border-r">
          <div className="flex flex-1 items-center justify-center"><SlideCanvas slide={currentSlide} deck={deck} /></div>
          <div className="mx-auto mt-5 flex w-full max-w-5xl items-center gap-3">
            <button type="button" aria-label="Slide anterior" disabled={index === 0} onClick={() => changeSlide(index - 1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-white/10 text-slate-300 disabled:opacity-30"><ChevronDown className="h-4 w-4 rotate-90" /></button>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${((index + 1) / deck.slides.length) * 100}%` }} /></div>
            <button type="button" aria-label="Próximo slide" disabled={index === deck.slides.length - 1} onClick={() => changeSlide(index + 1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-white/10 text-slate-300 disabled:opacity-30"><ChevronDown className="h-4 w-4 -rotate-90" /></button>
          </div>
        </section>

        <aside className="min-h-0 bg-black/25 lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-aura">Tempo por slide</p><p className="mt-1 text-xs text-muted">Escolha o nível de profundidade.</p></div><Clock3 className="h-4 w-4 text-muted" /></div>
            <div className="mt-4 grid grid-cols-3 rounded-lg border border-white/10 bg-black/20 p-1">
              {([30, 60, 120] as const).map((seconds) => <button key={seconds} type="button" onClick={() => changeDuration(seconds)} className={`min-h-10 rounded-md text-xs transition-colors ${duration === seconds ? "bg-accent/15 text-aura" : "text-muted hover:text-white"}`}>{seconds === 120 ? "2 min" : `${seconds}s`}</button>)}
            </div>
            <div className="mt-5 flex items-end justify-between"><span className="energy-text text-4xl text-white">{formatClock(elapsed)}</span><span className={`text-xs ${elapsed >= duration ? "text-emerald-200" : "text-muted"}`}>{elapsed >= duration ? "Tempo concluído" : `${duration - elapsed}s restantes`}</span></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2"><Button onClick={() => setRunning((value) => !value)}>{running ? <><Pause className="h-4 w-4" /> Pausar</> : <><Play className="h-4 w-4" /> {elapsed ? "Continuar" : "Iniciar fala"}</>}</Button><button type="button" title="Reiniciar cronômetro" aria-label="Reiniciar cronômetro" onClick={() => { setElapsed(0); setRunning(false); }} className="grid h-11 w-11 place-items-center rounded-md border border-white/10 text-slate-300 hover:text-white"><RotateCcw className="h-4 w-4" /></button></div>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Roteiro de fala</h2><button type="button" onClick={() => setShowScript((value) => !value)} className="text-xs text-aura hover:text-white">{showScript ? "Ocultar" : "Revelar"}</button></div>
            {index === 0 && rehearsal.opening ? <div className="mt-4 border-l-2 border-accent/50 pl-3"><p className="text-[0.68rem] uppercase tracking-[0.12em] text-aura">Abertura</p><p className="mt-2 text-sm leading-6 text-slate-300">{rehearsal.opening}</p></div> : null}
            <div className={`mt-4 min-h-40 rounded-lg border border-white/10 bg-white/[0.025] p-4 transition-opacity ${showScript ? "opacity-100" : "select-none opacity-10 blur-sm"}`}><p className="text-sm leading-7 text-slate-200">{script || currentSlide.speaker_notes}</p></div>
            {training?.keyPoints.length ? <div className="mt-5"><p className="text-[0.68rem] uppercase tracking-[0.12em] text-muted">Pontos que não podem faltar</p><div className="mt-3 flex flex-wrap gap-2">{training.keyPoints.map((point) => <span key={point} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-slate-300">{point}</span>)}</div></div> : null}
            {training?.questions.length ? <div className="mt-6 border-t border-white/10 pt-5"><p className="flex items-center gap-2 text-sm font-semibold"><HelpCircle className="h-4 w-4 text-aura" /> Perguntas prováveis</p><div className="mt-3 grid gap-2">{training.questions.map((question) => <details key={question.question} className="rounded-lg border border-white/10 bg-white/[0.025] p-3"><summary className="cursor-pointer text-sm text-slate-200">{question.question}</summary><p className="mt-3 border-t border-white/10 pt-3 text-sm leading-6 text-muted">{question.answer}</p></details>)}</div></div> : null}
            {index === deck.slides.length - 1 && rehearsal.closing ? <div className="mt-6 border-l-2 border-emerald-300/40 pl-3"><p className="text-[0.68rem] uppercase tracking-[0.12em] text-emerald-200">Fechamento</p><p className="mt-2 text-sm leading-6 text-slate-300">{rehearsal.closing}</p></div> : null}
            {index === deck.slides.length - 1 && rehearsal.generalQuestions.length ? <div className="mt-6 border-t border-white/10 pt-5"><p className="text-sm font-semibold">Perguntas sobre o trabalho completo</p><div className="mt-3 grid gap-2">{rehearsal.generalQuestions.map((question) => <details key={question.question} className="rounded-lg border border-white/10 p-3"><summary className="cursor-pointer text-sm text-slate-200">{question.question}</summary><p className="mt-3 text-sm leading-6 text-muted">{question.answer}</p></details>)}</div></div> : null}
          </div>
        </aside>
      </div>
    </main>
  );
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function SlideCanvas({ slide, deck }: { slide: PresentationStudioSlide; deck: PresentationStudioDeck }) {
  const split = slide.type === "comparison";
  const theme = presentationThemes[normalizePresentationTheme(deck.theme)];
  return (
    <article className="aspect-video w-full max-w-5xl overflow-hidden rounded-lg border p-[clamp(1.25rem,4vw,4rem)] shadow-[0_30px_90px_rgba(0,0,0,0.45)]" style={{ backgroundColor: theme.background, borderColor: theme.border, color: theme.foreground }}>
      <div className="flex h-full flex-col">
        <p className="text-[0.56rem] font-medium uppercase tracking-[0.18em] sm:text-xs" style={{ color: theme.accent }}>{deck.title}</p>
        <div className={`flex flex-1 ${slide.type === "cover" || slide.type === "quote" ? "items-center justify-center text-center" : "items-start"}`}>
          <div className={slide.type === "cover" || slide.type === "quote" ? "max-w-3xl" : "w-full pt-[6%]"}>
            <h1 className="text-[clamp(1.35rem,4.2vw,4.5rem)] font-semibold leading-[1.04]" style={{ color: theme.foreground, fontFamily: theme.headingFamily }}>{slide.title || "Sem título"}</h1>
            {slide.subtitle ? <p className="mt-[3%] text-[clamp(0.7rem,1.5vw,1.35rem)] leading-relaxed" style={{ color: theme.muted }}>{slide.subtitle}</p> : null}
            {slide.body.length ? (
              <div className={`mt-[5%] ${split ? "grid grid-cols-2 gap-[6%]" : "grid gap-[clamp(0.35rem,1vw,0.9rem)]"}`}>
                {slide.body.map((item, index) => (
                  <div key={`${item}-${index}`} className={`flex items-start gap-3 text-left text-[clamp(0.62rem,1.4vw,1.25rem)] leading-snug ${split ? "rounded-lg border p-[6%]" : ""}`} style={split ? { color: theme.foreground, backgroundColor: theme.surface, borderColor: theme.border } : { color: theme.foreground }}>
                    {!split ? <span className="mt-[0.42em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: theme.accent, boxShadow: `0 0 12px ${theme.accentSoft}` }} /> : null}{item}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-end justify-between text-[0.5rem] uppercase tracking-[0.14em] sm:text-[0.65rem]" style={{ color: theme.muted }}><span>{slideTypeLabels[slide.type]}</span><span>{String(slide.order).padStart(2, "0")}</span></div>
      </div>
    </article>
  );
}

function PanelTab({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[0.62rem] transition-colors duration-150 active:scale-[0.98] ${active ? "bg-accent/10 text-aura" : "text-slate-500 hover:text-slate-200"}`}>{children}<span>{label}</span></button>;
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-24 rounded-lg border border-white/10 bg-white/[0.035] p-3"><p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted">{label}</p><p className="mt-1 max-w-32 truncate font-medium text-white">{value}</p></div>;
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} className="grid h-9 w-9 place-items-center rounded-md border border-white/10 text-slate-400 transition-colors duration-150 hover:border-accent/30 hover:text-white active:scale-95 disabled:opacity-30">{children}</button>;
}

function ErrorMessage({ message }: { message: string }) {
  return <p className="mt-5 rounded-lg border border-rose-300/20 bg-rose-300/[0.06] p-3 text-sm text-rose-100">{message}</p>;
}
