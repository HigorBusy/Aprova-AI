import type { RawEssayReview } from "@/lib/ai/essay-review";

type CompetencyKey = "c1" | "c2" | "c3" | "c4" | "c5";

export type EssayCalibrationBenchmark = {
  id: string;
  title: string;
  essay: string;
  expectedScoreRange: {
    min: number;
    max: number;
  };
  assertions: Array<{
    competency: CompetencyKey;
    min: number;
    max: number;
  }>;
  modelDraft: RawEssayReview;
};

const weakEssay = `
A educacao no Brasil e ruim porque muitas pessoas nao estudam direito. Isso acontece porque falta interesse dos alunos e tambem porque as escolas nao ajudam muito.

Além disso, a internet atrapalha bastante, pois os jovens ficam no celular e esquecem de estudar. Portanto isso e um problema que precisa acabar.

O governo deve fazer campanhas para melhorar isso.
`.trim();

const averageEssay = `
No Brasil, a dificuldade de acesso a uma educacao de qualidade ainda prejudica muitos estudantes. Nesse sentido, observa-se que a desigualdade social limita oportunidades e impede que jovens desenvolvam melhor seu futuro.

Em primeiro lugar, a falta de estrutura escolar interfere no aprendizado. Muitas escolas publicas possuem poucos recursos, o que prejudica a concentracao e o rendimento dos alunos. Dessa forma, quem ja vive em situacao vulneravel encontra mais dificuldade para competir em provas importantes.

Além disso, a ausencia de acompanhamento familiar tambem agrava esse problema. Muitos responsaveis trabalham o dia inteiro e nao conseguem orientar os jovens nos estudos. Assim, o estudante fica sem direcao e perde constancia.

Portanto, o Governo Federal deve ampliar investimentos em escolas publicas, por meio de programas de reforco e melhoria estrutural, para que os alunos tenham melhores condicoes de aprender. Essa acao deve priorizar regioes vulneraveis.
`.trim();

const strongEssay = `
No Brasil contemporaneo, a democratizacao do acesso a educacao de qualidade ainda enfrenta entraves persistentes. Embora a Constituicao Federal de 1988 assegure a educacao como direito social, a permanencia de desigualdades territoriais e economicas impede que tal garantia alcance todos os estudantes de modo efetivo. Desse modo, defende-se que a precariedade estrutural das escolas e a ausencia de politicas de acompanhamento pedagogico aprofundam esse problema.

Em primeiro lugar, a desigualdade de infraestrutura compromete a aprendizagem. Sob essa perspectiva, Milton Santos, ao discutir a cidadania mutilada, ajuda a compreender como o territorio brasileiro distribui direitos de forma desigual. Nesse contexto, estudantes de regioes vulneraveis frequentemente lidam com escolas sem laboratorios, bibliotecas atualizadas ou acesso adequado a tecnologia. Como efeito, esses jovens acumulam lacunas formativas que reduzem suas chances em exames nacionais.

Ademais, a falta de acompanhamento continuo fragiliza a trajetoria escolar. Isso ocorre porque muitos alunos nao recebem diagnosticos frequentes sobre seus erros e, portanto, repetem falhas sem perceber. Alem disso, a ausencia de uma rotina orientada transforma o estudo em esforco disperso, pouco eficiente e dependente de motivacao momentanea. Dessa forma, mesmo estudantes dedicados podem evoluir lentamente quando nao sabem exatamente o que corrigir.

Portanto, o Ministerio da Educacao deve implementar um programa nacional de diagnostico e reforco escolar, por meio de plataformas digitais, tutoria presencial e formacao de professores, com o objetivo de identificar lacunas individuais e orientar planos de estudo personalizados. Tal medida deve detalhar metas por competencia e priorizar escolas em areas de maior vulnerabilidade, a fim de reduzir desigualdades e tornar o direito constitucional a educacao mais concreto.
`.trim();

const accentedStrongEssay = `
No Brasil contemporâneo, a democratização do acesso à educação de qualidade ainda enfrenta entraves persistentes. Embora a Constituição Federal de 1988 assegure a educação como direito social, a permanência de desigualdades territoriais e econômicas impede que tal garantia alcance todos os estudantes de modo efetivo. Desse modo, defende-se que a precariedade estrutural das escolas e a ausência de políticas de acompanhamento pedagógico aprofundam esse problema.

Em primeiro lugar, a desigualdade de infraestrutura compromete a aprendizagem. Sob essa perspectiva, Milton Santos, ao discutir a cidadania mutilada, ajuda a compreender como o território brasileiro distribui direitos de forma desigual. Nesse contexto, estudantes de regiões vulneráveis frequentemente lidam com escolas sem laboratórios, bibliotecas atualizadas ou acesso adequado à tecnologia. Como efeito, esses jovens acumulam lacunas formativas que reduzem suas chances em exames nacionais.

Ademais, a falta de acompanhamento contínuo fragiliza a trajetória escolar. Isso ocorre porque muitos alunos não recebem diagnósticos frequentes sobre seus erros e, portanto, repetem falhas sem perceber. Além disso, a ausência de uma rotina orientada transforma o estudo em esforço disperso, pouco eficiente e dependente de motivação momentânea. Dessa forma, mesmo estudantes dedicados podem evoluir lentamente quando não sabem exatamente o que corrigir.

Portanto, o Ministério da Educação deve implementar um programa nacional de diagnóstico e reforço escolar, por meio de plataformas digitais, tutoria presencial e formação de professores, com o objetivo de identificar lacunas individuais e orientar planos de estudo personalizados. Tal medida deve detalhar metas por competência e priorizar escolas em áreas de maior vulnerabilidade, a fim de reduzir desigualdades e tornar o direito constitucional à educação mais concreto.
`.trim();

function competency(score: number, label: string) {
  return {
    score,
    justificativa: `${label}: avaliacao simulada para calibragem interna.`,
    problemas_encontrados: [`Trecho observado no benchmark de ${label}.`],
    como_melhorar: "Ajustar o criterio com base em evidencia textual.",
    exemplo_pratico: "Usar trecho, problema e impacto na nota."
  };
}

export const essayCalibrationBenchmarks: EssayCalibrationBenchmark[] = [
  {
    id: "weak-essay-no-repertoire",
    title: "Redacao fraca, curta, sem repertorio e com proposta incompleta",
    essay: weakEssay,
    expectedScoreRange: { min: 360, max: 600 },
    assertions: [
      { competency: "c2", min: 0, max: 120 },
      { competency: "c3", min: 0, max: 120 },
      { competency: "c5", min: 0, max: 120 }
    ],
    modelDraft: {
      type: "essay_review",
      nota_competencia_1: 120,
      nota_competencia_2: 160,
      nota_competencia_3: 150,
      nota_competencia_4: 130,
      nota_competencia_5: 150,
      diagnostico_geral: "Texto curto, generico e sem repertorio produtivo.",
      principais_erros: ["O trecho \"a internet atrapalha bastante\" afirma o problema, mas nao prova."],
      pontos_fortes: ["Existe uma tentativa de organizar introducao, desenvolvimento e conclusao."],
      plano_de_melhoria: ["Adicionar repertorio legitimado.", "Desenvolver dois argumentos.", "Completar a intervencao."],
      missao_de_hoje: ["Reescrever a introducao com tese clara."]
    }
  },
  {
    id: "average-essay-basic-structure",
    title: "Redacao mediana com estrutura, mas repertorio fraco",
    essay: averageEssay,
    expectedScoreRange: { min: 600, max: 760 },
    assertions: [
      { competency: "c2", min: 0, max: 140 },
      { competency: "c3", min: 100, max: 170 },
      { competency: "c5", min: 120, max: 180 }
    ],
    modelDraft: {
      type: "essay_review",
      nota_competencia_1: 150,
      nota_competencia_2: 150,
      nota_competencia_3: 150,
      nota_competencia_4: 150,
      nota_competencia_5: 160,
      diagnostico_geral: "Texto organizado, mas ainda previsivel e sem repertorio legitimado.",
      principais_erros: ["O desenvolvimento explica causas, mas nao usa repertorio sociocultural legitimado."],
      pontos_fortes: ["Ha tese compreensivel e proposta de intervencao reconhecivel."],
      plano_de_melhoria: ["Integrar repertorio legitimado ao argumento.", "Detalhar melhor a execucao da proposta."],
      missao_de_hoje: ["Reescrever um desenvolvimento com repertorio produtivo."]
    }
  },
  {
    id: "strong-essay-excellence",
    title: "Redacao forte com repertorio produtivo e proposta completa",
    essay: strongEssay,
    expectedScoreRange: { min: 900, max: 1000 },
    assertions: [
      { competency: "c2", min: 180, max: 200 },
      { competency: "c4", min: 180, max: 200 },
      { competency: "c5", min: 180, max: 200 }
    ],
    modelDraft: {
      type: "essay_review",
      competencies: {
        c1: competency(180, "C1"),
        c2: competency(170, "C2"),
        c3: competency(180, "C3"),
        c4: competency(170, "C4"),
        c5: competency(170, "C5")
      },
      diagnostico_geral: "Texto excelente, com tese clara, repertorio conectado, coesao funcional e proposta completa.",
      principais_erros: ["O detalhamento poderia indicar melhor como a formacao dos professores seria acompanhada."],
      pontos_fortes: ["Repertorio de Milton Santos conectado ao argumento.", "Proposta completa e viavel."],
      plano_de_melhoria: ["Aprimorar o detalhamento operacional da intervencao."],
      missao_de_hoje: ["Revisar a proposta para deixar a execucao ainda mais objetiva."]
    }
  },
  {
    id: "accented-strong-essay-excellence",
    title: "Redação forte com acentos, repertório produtivo e proposta completa",
    essay: accentedStrongEssay,
    expectedScoreRange: { min: 900, max: 1000 },
    assertions: [
      { competency: "c2", min: 180, max: 200 },
      { competency: "c4", min: 180, max: 200 },
      { competency: "c5", min: 180, max: 200 }
    ],
    modelDraft: {
      type: "essay_review",
      competencies: {
        c1: competency(180, "C1"),
        c2: competency(170, "C2"),
        c3: competency(180, "C3"),
        c4: competency(170, "C4"),
        c5: competency(170, "C5")
      },
      diagnostico_geral: "Texto excelente, com tese clara, repertório conectado, coesão funcional e proposta completa.",
      principais_erros: ["O detalhamento poderia indicar melhor como a formação dos professores seria acompanhada."],
      pontos_fortes: ["Repertório de Milton Santos conectado ao argumento.", "Proposta completa e viável."],
      plano_de_melhoria: ["Aprimorar o detalhamento operacional da intervenção."],
      missao_de_hoje: ["Revisar a proposta para deixar a execução ainda mais objetiva."]
    }
  }
];
