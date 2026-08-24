export const ESSAY_THEME_CATEGORIES = [
  { id: "all", label: "Todas as categorias" },
  { id: "education", label: "Educação" },
  { id: "technology", label: "Tecnologia" },
  { id: "environment", label: "Meio ambiente e biodiversidade" },
  { id: "health", label: "Saúde" },
  { id: "citizenship", label: "Cidadania e direitos humanos" },
  { id: "culture", label: "Cultura e diversidade" },
  { id: "economy", label: "Economia, capitalismo e trabalho" },
  { id: "politics", label: "Política e democracia" },
  { id: "inequality", label: "Desigualdade social" }
] as const;

export type EssayThemeCategory = Exclude<(typeof ESSAY_THEME_CATEGORIES)[number]["id"], "all">;
export type EssayThemeOrigin = "official" | "training";

export type EssayThemeProposal = {
  id: string;
  title: string;
  category: EssayThemeCategory;
  origin: EssayThemeOrigin;
  year?: number;
  context: string;
  motivatingPoints: Array<{ source: string; summary: string }>;
};

export const ESSAY_THEME_PROPOSALS: EssayThemeProposal[] = [
  {
    id: "enem-2024-heranca-africana",
    title: "Desafios para a valorização da herança africana no Brasil",
    category: "culture",
    origin: "official",
    year: 2024,
    context: "Tema oficial que exige discutir apagamento histórico, identidade, educação e valorização das contribuições africanas para a sociedade brasileira.",
    motivatingPoints: [
      { source: "ENEM 2024 / Inep", summary: "A herança africana participa da formação cultural, social e histórica do Brasil." },
      { source: "Lei 10.639/2003", summary: "O ensino de história e cultura afro-brasileira integra o currículo escolar obrigatório." },
      { source: "Recorte de reflexão", summary: "Reconhecimento legal não garante, sozinho, valorização cotidiana nem visibilidade social." }
    ]
  },
  {
    id: "enem-2023-trabalho-cuidado",
    title: "Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil",
    category: "economy",
    origin: "official",
    year: 2023,
    context: "Tema oficial sobre divisão sexual do trabalho, desigualdade de gênero e desvalorização econômica das tarefas de cuidado.",
    motivatingPoints: [
      { source: "ENEM 2023 / Inep", summary: "O cuidado sustenta famílias e a vida social, mas frequentemente permanece sem remuneração ou reconhecimento." },
      { source: "IBGE", summary: "Mulheres dedicam mais tempo que homens ao trabalho doméstico e de cuidado não remunerado." },
      { source: "Recorte de reflexão", summary: "A sobrecarga reduz tempo disponível para formação, descanso e participação no mercado de trabalho." }
    ]
  },
  {
    id: "enem-2022-povos-tradicionais",
    title: "Desafios para a valorização de comunidades e povos tradicionais no Brasil",
    category: "culture",
    origin: "official",
    year: 2022,
    context: "Tema oficial voltado ao reconhecimento de identidades, territórios, saberes e direitos de povos tradicionais.",
    motivatingPoints: [
      { source: "ENEM 2022 / Inep", summary: "Povos tradicionais preservam modos próprios de organização, cultura e relação com o território." },
      { source: "Constituição Federal", summary: "A proteção do patrimônio cultural brasileiro inclui formas de expressão e modos de criar, fazer e viver." },
      { source: "Recorte de reflexão", summary: "Pressões econômicas, preconceito e baixa representação pública dificultam a garantia desses direitos." }
    ]
  },
  {
    id: "enem-2021-registro-civil",
    title: "Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil",
    category: "citizenship",
    origin: "official",
    year: 2021,
    context: "Tema oficial sobre documentação básica, reconhecimento jurídico e acesso efetivo a direitos e serviços públicos.",
    motivatingPoints: [
      { source: "ENEM 2021 / Inep", summary: "Sem registro civil, a pessoa encontra barreiras para exercer direitos básicos de cidadania." },
      { source: "Declaração Universal dos Direitos Humanos", summary: "Toda pessoa tem direito ao reconhecimento de sua personalidade jurídica." },
      { source: "Recorte de reflexão", summary: "Distância, desinformação e vulnerabilidade social ajudam a manter o sub-registro." }
    ]
  },
  {
    id: "enem-2020-doencas-mentais",
    title: "O estigma associado às doenças mentais na sociedade brasileira",
    category: "health",
    origin: "official",
    year: 2020,
    context: "Tema oficial que relaciona preconceito, desinformação, acolhimento e acesso ao cuidado em saúde mental.",
    motivatingPoints: [
      { source: "ENEM 2020 / Inep", summary: "O estigma pode silenciar sintomas e afastar pessoas da busca por ajuda." },
      { source: "Organização Mundial da Saúde", summary: "Saúde mental integra o bem-estar e precisa ser tratada como questão de saúde pública." },
      { source: "Recorte de reflexão", summary: "Informação responsável e redes de atendimento contribuem para reduzir discriminação." }
    ]
  },
  {
    id: "enem-2019-cinema",
    title: "Democratização do acesso ao cinema no Brasil",
    category: "culture",
    origin: "official",
    year: 2019,
    context: "Tema oficial sobre desigualdade territorial, acesso à cultura e formação de público.",
    motivatingPoints: [
      { source: "ENEM 2019 / Inep", summary: "O acesso às salas de cinema é distribuído de forma desigual pelo território brasileiro." },
      { source: "Constituição Federal", summary: "O Estado deve garantir a todos o pleno exercício dos direitos culturais." },
      { source: "Recorte de reflexão", summary: "Preço, concentração urbana e infraestrutura limitam o contato de parte da população com o cinema." }
    ]
  },
  {
    id: "enem-2018-dados-internet",
    title: "Manipulação do comportamento do usuário pelo controle de dados na internet",
    category: "technology",
    origin: "official",
    year: 2018,
    context: "Tema oficial sobre coleta de dados, algoritmos, autonomia e influência das plataformas digitais.",
    motivatingPoints: [
      { source: "ENEM 2018 / Inep", summary: "Dados pessoais permitem personalizar conteúdos e também influenciar escolhas e comportamentos." },
      { source: "Cidadania digital", summary: "Transparência e letramento digital ajudam usuários a compreender a lógica das plataformas." },
      { source: "Recorte de reflexão", summary: "Conveniência tecnológica pode ocultar assimetrias entre usuários e empresas." }
    ]
  },
  {
    id: "enem-2017-surdos",
    title: "Desafios para a formação educacional de surdos no Brasil",
    category: "education",
    origin: "official",
    year: 2017,
    context: "Tema oficial sobre acessibilidade, Libras, formação docente e inclusão educacional de pessoas surdas.",
    motivatingPoints: [
      { source: "ENEM 2017 / Inep", summary: "A inclusão depende de comunicação acessível e condições adequadas de aprendizagem." },
      { source: "Lei Brasileira de Inclusão", summary: "A educação deve assegurar acesso, permanência, participação e aprendizagem." },
      { source: "Recorte de reflexão", summary: "Falta de profissionais preparados e barreiras comunicacionais comprometem a igualdade de oportunidades." }
    ]
  },
  {
    id: "enem-2016-intolerancia-religiosa",
    title: "Caminhos para combater a intolerância religiosa no Brasil",
    category: "citizenship",
    origin: "official",
    year: 2016,
    context: "Tema oficial sobre liberdade de crença, preconceito e convivência democrática.",
    motivatingPoints: [
      { source: "ENEM 2016 / Inep", summary: "A diversidade religiosa convive com práticas de discriminação e violência." },
      { source: "Constituição Federal", summary: "A liberdade de consciência e de crença é um direito fundamental." },
      { source: "Recorte de reflexão", summary: "Educação para a diversidade e responsabilização de agressões são frentes complementares." }
    ]
  },
  {
    id: "enem-2015-violencia-mulher",
    title: "A persistência da violência contra a mulher na sociedade brasileira",
    category: "citizenship",
    origin: "official",
    year: 2015,
    context: "Tema oficial que exige analisar raízes sociais da violência de gênero e caminhos de proteção e prevenção.",
    motivatingPoints: [
      { source: "ENEM 2015 / Inep", summary: "A violência contra a mulher possui dimensões física, psicológica, sexual, patrimonial e moral." },
      { source: "Lei Maria da Penha", summary: "A legislação estrutura mecanismos de prevenção, proteção e responsabilização." },
      { source: "Recorte de reflexão", summary: "Naturalização cultural e medo de denunciar dificultam o rompimento do ciclo de violência." }
    ]
  },
  {
    id: "treino-ia-educacao",
    title: "Desafios para o uso ético da inteligência artificial na educação brasileira",
    category: "technology",
    origin: "training",
    context: "Proposta autoral para discutir aprendizagem, autoria, desigualdade de acesso e responsabilidade no uso de IA por estudantes e escolas.",
    motivatingPoints: [
      { source: "Eixo tecnologia e educação", summary: "Ferramentas de IA podem personalizar o aprendizado, mas não substituem pensamento crítico nem mediação pedagógica." },
      { source: "Desigualdade digital", summary: "Acesso a equipamentos, conectividade e formação varia entre estudantes e redes de ensino." },
      { source: "Dilema central", summary: "O desafio é usar a tecnologia como apoio sem normalizar dependência, fraude ou exclusão." }
    ]
  },
  {
    id: "treino-desinformacao",
    title: "Caminhos para combater a desinformação digital entre jovens no Brasil",
    category: "technology",
    origin: "training",
    context: "Proposta autoral sobre educação midiática, plataformas digitais, confiança pública e formação crítica.",
    motivatingPoints: [
      { source: "Cidadania digital", summary: "O alto volume de conteúdo torna mais difícil distinguir informação, opinião e manipulação." },
      { source: "Ambiente escolar", summary: "Educação midiática pode ensinar verificação, leitura de fontes e responsabilidade no compartilhamento." },
      { source: "Dilema central", summary: "Combater boatos exige ação coordenada sem violar liberdade de expressão." }
    ]
  },
  {
    id: "treino-biodiversidade",
    title: "Desafios para a proteção da biodiversidade brasileira diante da expansão econômica",
    category: "environment",
    origin: "training",
    context: "Proposta autoral que contrapõe conservação ambiental, desenvolvimento, fiscalização e participação das comunidades locais.",
    motivatingPoints: [
      { source: "Constituição Federal, art. 225", summary: "O meio ambiente equilibrado é direito coletivo e sua defesa cabe ao poder público e à sociedade." },
      { source: "Patrimônio natural", summary: "A biodiversidade sustenta serviços ambientais, conhecimentos tradicionais e atividades econômicas." },
      { source: "Dilema central", summary: "Produção e infraestrutura precisam avançar sem transformar danos ambientais em custo invisível." }
    ]
  },
  {
    id: "treino-eventos-climaticos",
    title: "Desafios para reduzir a vulnerabilidade social diante de eventos climáticos extremos no Brasil",
    category: "environment",
    origin: "training",
    context: "Proposta autoral sobre prevenção, moradia, infraestrutura urbana, alertas e desigualdade socioambiental.",
    motivatingPoints: [
      { source: "Defesa Civil", summary: "Prevenção, monitoramento e comunicação de risco reduzem perdas humanas e materiais." },
      { source: "Desigualdade urbana", summary: "Populações em moradias precárias tendem a enfrentar maior exposição e menor capacidade de recuperação." },
      { source: "Dilema central", summary: "Responder depois do desastre não substitui planejamento territorial e adaptação climática." }
    ]
  },
  {
    id: "treino-saude-mental-jovens",
    title: "Caminhos para promover a saúde mental de adolescentes no Brasil",
    category: "health",
    origin: "training",
    context: "Proposta autoral sobre prevenção, acolhimento, ambiente escolar, família e uso responsável de tecnologias.",
    motivatingPoints: [
      { source: "Saúde pública", summary: "Prevenção e identificação precoce ampliam a possibilidade de cuidado adequado." },
      { source: "Escola e família", summary: "Redes de convivência podem acolher sinais de sofrimento sem substituir atendimento profissional." },
      { source: "Dilema central", summary: "Cobrança por desempenho e hiperconexão precisam ser discutidas sem simplificar causas complexas." }
    ]
  },
  {
    id: "treino-violencia-escolar",
    title: "Desafios para prevenir a violência no ambiente escolar brasileiro",
    category: "education",
    origin: "training",
    context: "Proposta autoral que envolve convivência, cultura de paz, saúde mental, segurança e participação da comunidade escolar.",
    motivatingPoints: [
      { source: "Direito à educação", summary: "Aprender exige um ambiente seguro, inclusivo e preparado para administrar conflitos." },
      { source: "Cultura de paz", summary: "Escuta, mediação e pertencimento ajudam a prevenir escaladas de violência." },
      { source: "Dilema central", summary: "Medidas de segurança precisam ser combinadas com prevenção e apoio psicossocial." }
    ]
  },
  {
    id: "treino-inclusao-digital",
    title: "Desafios para garantir inclusão digital de qualidade no Brasil",
    category: "inequality",
    origin: "training",
    context: "Proposta autoral sobre conectividade, equipamentos, alfabetização digital e acesso a oportunidades.",
    motivatingPoints: [
      { source: "IBGE", summary: "O acesso à internet avançou, mas ainda existem diferenças ligadas a renda, território e habilidades digitais." },
      { source: "Educação e trabalho", summary: "Serviços públicos, aprendizagem e vagas de emprego dependem cada vez mais de competências digitais." },
      { source: "Dilema central", summary: "Estar conectado não significa saber usar a rede com autonomia, segurança e finalidade produtiva." }
    ]
  },
  {
    id: "treino-plataformas-trabalho",
    title: "Desafios para a proteção social de trabalhadores de plataformas digitais no Brasil",
    category: "economy",
    origin: "training",
    context: "Proposta autoral sobre inovação, autonomia, remuneração, segurança e direitos no trabalho mediado por aplicativos.",
    motivatingPoints: [
      { source: "Transformações do trabalho", summary: "Plataformas ampliam flexibilidade e acesso a renda, mas transferem riscos para o trabalhador." },
      { source: "Proteção social", summary: "Jornada, previdência, acidentes e transparência algorítmica entram no debate regulatório." },
      { source: "Dilema central", summary: "A regulação precisa proteger sem eliminar oportunidades econômicas legítimas." }
    ]
  },
  {
    id: "treino-consumismo-endividamento",
    title: "Caminhos para enfrentar o endividamento associado ao consumo no Brasil",
    category: "economy",
    origin: "training",
    context: "Proposta autoral para discutir educação financeira, publicidade, crédito e vulnerabilidade econômica.",
    motivatingPoints: [
      { source: "Economia doméstica", summary: "Crédito pode antecipar oportunidades, mas compromete renda futura quando usado sem planejamento." },
      { source: "Cultura de consumo", summary: "Publicidade e comparação social estimulam decisões que nem sempre correspondem às necessidades reais." },
      { source: "Dilema central", summary: "Responsabilidade individual importa, mas informação, regulação e condições econômicas também influenciam escolhas." }
    ]
  },
  {
    id: "treino-modelos-economicos",
    title: "Desafios para qualificar o debate sobre modelos econômicos na sociedade brasileira",
    category: "politics",
    origin: "training",
    context: "Proposta autoral para discutir capitalismo, socialismo, comunismo, papel do Estado e circulação de informação sem reduzir o debate a rótulos.",
    motivatingPoints: [
      { source: "Formação cidadã", summary: "Conceitos econômicos distintos são frequentemente usados como ofensa ou slogan, sem definição histórica." },
      { source: "Debate democrático", summary: "Comparar ideias exige critérios, fontes e distinção entre teoria, experiência histórica e política pública." },
      { source: "Dilema central", summary: "Polarização e desinformação dificultam conversas sobre desigualdade, liberdade, propriedade e proteção social." }
    ]
  },
  {
    id: "treino-polarizacao",
    title: "Caminhos para reduzir os efeitos da polarização no debate democrático brasileiro",
    category: "politics",
    origin: "training",
    context: "Proposta autoral sobre diálogo público, radicalização, instituições e responsabilidade informacional.",
    motivatingPoints: [
      { source: "Democracia", summary: "Divergência é parte do regime democrático; desumanização do adversário compromete a convivência." },
      { source: "Redes sociais", summary: "Mecanismos de engajamento podem favorecer mensagens emocionais e grupos fechados de opinião." },
      { source: "Dilema central", summary: "Reduzir hostilidade não significa eliminar conflito político nem uniformizar ideias." }
    ]
  },
  {
    id: "treino-saneamento",
    title: "Desafios para universalizar o saneamento básico no Brasil",
    category: "health",
    origin: "training",
    context: "Proposta autoral sobre saúde pública, infraestrutura, desigualdade territorial e planejamento urbano.",
    motivatingPoints: [
      { source: "Saúde coletiva", summary: "Água segura, coleta e tratamento de esgoto previnem doenças e melhoram a qualidade de vida." },
      { source: "Desigualdade territorial", summary: "A oferta de infraestrutura varia entre regiões, cidades e áreas urbanas e rurais." },
      { source: "Dilema central", summary: "Universalização exige investimento contínuo, regulação e prioridade às populações mais vulneráveis." }
    ]
  },
  {
    id: "treino-seguranca-alimentar",
    title: "Caminhos para fortalecer a segurança alimentar no Brasil",
    category: "inequality",
    origin: "training",
    context: "Proposta autoral sobre acesso regular a alimentos, renda, desperdício e políticas públicas.",
    motivatingPoints: [
      { source: "Direito à alimentação", summary: "Segurança alimentar envolve quantidade, qualidade, regularidade e respeito à cultura alimentar." },
      { source: "Produção e acesso", summary: "Produzir alimentos em grande escala não garante que todas as famílias consigam adquiri-los." },
      { source: "Dilema central", summary: "Renda, distribuição, preços e desperdício precisam ser enfrentados de forma articulada." }
    ]
  }
];

export function pickEssayTheme(
  category: "all" | EssayThemeCategory,
  origin: "all" | EssayThemeOrigin,
  previousId?: string
) {
  const matching = ESSAY_THEME_PROPOSALS.filter((proposal) =>
    (category === "all" || proposal.category === category) &&
    (origin === "all" || proposal.origin === origin)
  );
  const withoutPrevious = matching.length > 1 ? matching.filter((proposal) => proposal.id !== previousId) : matching;
  return withoutPrevious[Math.floor(Math.random() * withoutPrevious.length)] ?? ESSAY_THEME_PROPOSALS[0];
}
