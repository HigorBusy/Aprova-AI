type Repertorio = {
  autor: string | null;
  obra: string | null;
  tema: string | null;
  explicacao: string | null;
  categoria: string | null;
};

type StudentProfile = {
  average_score: number | null;
  best_score: number | null;
  worst_competency: string | null;
  best_competency: string | null;
  total_essays: number | null;
  last_essay_date: string | null;
  target_exam_year?: number | null;
  main_difficulty?: string | null;
  priority_area?: string | null;
  essay_level?: string | null;
  study_frequency?: string | null;
};

type EssaySnapshot = {
  score: number | null;
  c1: number | null;
  c2: number | null;
  c3: number | null;
  c4: number | null;
  c5: number | null;
  theme: string | null;
  created_at: string | null;
};

type QuestionTopicSnapshot = {
  name?: string | null;
  discipline?: string | null;
  attempts?: number | null;
  correct?: number | null;
  wrong?: number | null;
  accuracy?: number | null;
};

type QuestionCatalogSnapshot = {
  topics?: QuestionTopicSnapshot[] | null;
};

type LearningProfileSnapshot = {
  evidence?: { essayCount?: number; questionAttempts?: number; simulationCount?: number };
  recommendation?: { title?: string; description?: string };
  essay?: { averageScore?: number | null; latestScore?: number | null; priority?: Record<string, unknown> | null };
  questions?: { attempts?: number; accuracy?: number | null; priority?: Record<string, unknown> | null };
  simulations?: { count?: number; latest?: { accuracy?: number; completedAt?: string } | null };
};

export function formatRepertoryContext(repertorios: Repertorio[] | null | undefined) {
  const items = (repertorios ?? []).slice(0, 12);
  if (items.length === 0) return "Banco de repertorios: sem itens carregados agora.";

  return [
    "Banco de repertorios disponivel. Use apenas quando fizer sentido e conecte ao tema:",
    ...items.map((item) => {
      const obra = item.obra ? `, ${item.obra}` : "";
      const tema = item.tema ? ` Tema: ${item.tema}.` : "";
      const categoria = item.categoria ? ` Categoria: ${item.categoria}.` : "";
      return `- ${item.autor ?? "Repertorio"}${obra}.${tema}${categoria} ${item.explicacao ?? ""}`.trim();
    })
  ].join("\n");
}

export function formatStudentContext(profile: StudentProfile | null | undefined, essays: EssaySnapshot[] | null | undefined) {
  const recent = essays ?? [];
  if (!profile && recent.length === 0) {
    return "Perfil do aluno: ainda sem historico suficiente. Oriente com base na mensagem atual.";
  }

  const lines = [
    "Perfil do aluno para acompanhamento:",
    `- Total de redacoes: ${profile?.total_essays ?? recent.length ?? 0}.`,
    `- Media atual: ${formatScore(profile?.average_score)}.`,
    `- Melhor nota: ${formatScore(profile?.best_score)}.`,
    `- Competencia mais forte: ${profile?.best_competency ?? "indefinida"}.`,
    `- Competencia mais fraca: ${profile?.worst_competency ?? "indefinida"}.`
  ];

  if (profile?.target_exam_year) lines.push(`- ENEM alvo: ${profile.target_exam_year}.`);
  if (profile?.priority_area) lines.push(`- Área declarada como prioridade: ${profile.priority_area}.`);
  if (profile?.essay_level) lines.push(`- Nível percebido em redação: ${profile.essay_level}.`);
  if (profile?.study_frequency) lines.push(`- Frequência de estudo declarada: ${profile.study_frequency} dias por semana.`);
  if (profile?.main_difficulty) lines.push(`- Principal dificuldade declarada: ${profile.main_difficulty}.`);

  if (recent.length > 0) {
    lines.push("- Ultimas redacoes:");
    for (const essay of recent.slice(0, 3)) {
      lines.push(`  - ${essay.theme ?? "Tema nao identificado"}: ${essay.score ?? 0} pontos (C1 ${essay.c1 ?? 0}, C2 ${essay.c2 ?? 0}, C3 ${essay.c3 ?? 0}, C4 ${essay.c4 ?? 0}, C5 ${essay.c5 ?? 0}).`);
    }
  }

  lines.push("Se houver padrao de queda ou repeticao de erro, mencione isso de forma especifica.");
  return lines.join("\n");
}

export function formatQuestionContext(catalog: QuestionCatalogSnapshot | null | undefined) {
  const topics = catalog?.topics ?? [];
  const attempted = topics.filter((topic) => (topic.attempts ?? 0) > 0);
  if (attempted.length === 0) {
    return "Desempenho em questoes: ainda sem tentativas registradas.";
  }

  const attempts = attempted.reduce((sum, topic) => sum + (topic.attempts ?? 0), 0);
  const correct = attempted.reduce((sum, topic) => sum + (topic.correct ?? 0), 0);
  const priorities = [...attempted]
    .filter((topic) => (topic.attempts ?? 0) >= 2)
    .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100))
    .slice(0, 3);

  return [
    "Desempenho em questoes:",
    `- Total respondido: ${attempts}.`,
    `- Aproveitamento geral: ${attempts ? Math.round((correct / attempts) * 100) : 0}%.`,
    ...(priorities.length
      ? ["- Assuntos prioritarios:", ...priorities.map((topic) => `  - ${topic.discipline ?? "Area"} / ${topic.name ?? "Assunto"}: ${topic.accuracy ?? 0}% em ${topic.attempts ?? 0} tentativas.`)]
      : ["- Ainda nao ha repeticao suficiente para definir um assunto prioritario."]),
    "Use esses dados apenas quando ajudarem a responder a solicitacao atual."
  ].join("\n");
}

export function formatLearningProfileContext(profile: LearningProfileSnapshot | null | undefined) {
  if (!profile) return "Perfil unificado: ainda não disponível.";
  const evidence = profile.evidence ?? {};
  const recommendation = profile.recommendation;
  return [
    "Perfil unificado de aprendizagem:",
    `- Evidências: ${evidence.essayCount ?? 0} redações, ${evidence.questionAttempts ?? 0} respostas e ${evidence.simulationCount ?? 0} simulados.`,
    `- Redação: última nota ${profile.essay?.latestScore ?? "indefinida"}; média ${profile.essay?.averageScore ?? "indefinida"}.`,
    `- Questões: ${profile.questions?.accuracy ?? "sem base"}% de aproveitamento em ${profile.questions?.attempts ?? 0} tentativas.`,
    profile.simulations?.latest ? `- Último simulado: ${profile.simulations.latest.accuracy ?? 0}% de acerto.` : "- Ainda não há simulado concluído.",
    recommendation?.title ? `- Próximo passo recomendado pelo sistema: ${recommendation.title}. ${recommendation.description ?? ""}` : "- Próximo passo ainda não definido.",
    "Use o perfil somente quando ele for relevante. Não invente evolução sem evidência."
  ].join("\n");
}

function formatScore(value: number | null | undefined) {
  return typeof value === "number" ? Math.round(value).toString() : "indefinida";
}
