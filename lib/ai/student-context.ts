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

  if (recent.length > 0) {
    lines.push("- Ultimas redacoes:");
    for (const essay of recent.slice(0, 3)) {
      lines.push(`  - ${essay.theme ?? "Tema nao identificado"}: ${essay.score ?? 0} pontos (C1 ${essay.c1 ?? 0}, C2 ${essay.c2 ?? 0}, C3 ${essay.c3 ?? 0}, C4 ${essay.c4 ?? 0}, C5 ${essay.c5 ?? 0}).`);
    }
  }

  lines.push("Se houver padrao de queda ou repeticao de erro, mencione isso de forma especifica.");
  return lines.join("\n");
}

function formatScore(value: number | null | undefined) {
  return typeof value === "number" ? Math.round(value).toString() : "indefinida";
}
