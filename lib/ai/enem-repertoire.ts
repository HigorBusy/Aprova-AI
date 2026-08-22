type RepertoireEntry = {
  reference: string;
  application: string;
  tags: string[];
};

const REPERTOIRE_BANK: RepertoireEntry[] = [
  {
    reference: "Constituição Federal de 1988, artigo 5º",
    application: "igualdade perante a lei, combate à discriminação e proteção de direitos fundamentais",
    tags: ["desigualdade", "racismo", "violencia", "cidadania", "direitos", "discriminacao"]
  },
  {
    reference: "Constituição Federal de 1988, artigo 6º",
    application: "direitos sociais como educação, saúde, trabalho, moradia, segurança e assistência",
    tags: ["educacao", "saude", "trabalho", "moradia", "pobreza", "direitos"]
  },
  {
    reference: "Constituição Federal de 1988, artigo 205",
    application: "educação como direito de todos e dever compartilhado pelo Estado e pela família",
    tags: ["educacao", "escola", "ensino", "evasao", "alfabetizacao"]
  },
  {
    reference: "Constituição Federal de 1988, artigos 215 e 216",
    application: "proteção das manifestações culturais e do patrimônio material e imaterial brasileiro",
    tags: ["cultura", "patrimonio", "africana", "indigena", "memoria", "arte"]
  },
  {
    reference: "Constituição Federal de 1988, artigo 225",
    application: "direito ao meio ambiente equilibrado e responsabilidade coletiva por sua preservação",
    tags: ["ambiente", "clima", "desmatamento", "sustentabilidade", "poluicao"]
  },
  {
    reference: "Estatuto da Criança e do Adolescente",
    application: "proteção integral e prioridade de direitos de crianças e adolescentes",
    tags: ["crianca", "adolescente", "infancia", "violencia", "educacao", "internet"]
  },
  {
    reference: "Lei 10.639/2003",
    application: "obrigatoriedade do ensino de história e cultura afro-brasileira no currículo escolar",
    tags: ["racismo", "africana", "cultura", "educacao", "memoria", "escola"]
  },
  {
    reference: "Agenda 2030 da ONU",
    application: "metas integradas para redução das desigualdades, educação, saúde, trabalho digno e sustentabilidade",
    tags: ["desigualdade", "sustentabilidade", "educacao", "saude", "trabalho", "pobreza"]
  },
  {
    reference: "Paulo Freire",
    application: "educação como formação crítica e instrumento de autonomia, não mera transmissão de conteúdo",
    tags: ["educacao", "escola", "alfabetizacao", "cidadania", "autonomia"]
  },
  {
    reference: "Pierre Bourdieu",
    application: "capital cultural e reprodução de desigualdades por instituições que tratam condições desiguais como equivalentes",
    tags: ["desigualdade", "educacao", "meritocracia", "classe", "cultura"]
  },
  {
    reference: "Milton Santos",
    application: "cidadania incompleta e acesso desigual a serviços e oportunidades conforme o território",
    tags: ["cidade", "territorio", "desigualdade", "mobilidade", "tecnologia", "cidadania"]
  },
  {
    reference: "Hannah Arendt",
    application: "a normalização de práticas nocivas pode tornar injustiças socialmente toleradas e pouco questionadas",
    tags: ["violencia", "omissao", "preconceito", "trabalho", "etica", "sociedade"]
  },
  {
    reference: "Zygmunt Bauman",
    application: "fragilidade de vínculos e de instituições diante de relações sociais marcadas por instabilidade",
    tags: ["sociedade", "internet", "relacoes", "consumo", "instituicoes", "solidao"]
  },
  {
    reference: "Djamila Ribeiro, Pequeno Manual Antirracista",
    application: "enfrentamento do racismo estrutural exige tornar visíveis práticas naturalizadas e reconhecer lugares sociais",
    tags: ["racismo", "africana", "preconceito", "invisibilidade", "cultura"]
  },
  {
    reference: "Ailton Krenak",
    application: "crítica à separação entre humanidade e natureza e à exclusão de povos colocados à margem do projeto social",
    tags: ["indigena", "ambiente", "sustentabilidade", "exclusao", "cultura"]
  },
  {
    reference: "Carolina Maria de Jesus, Quarto de Despejo",
    application: "experiência concreta da fome, da pobreza urbana, da desigualdade e da invisibilidade social",
    tags: ["pobreza", "fome", "cidade", "desigualdade", "mulher", "invisibilidade"]
  },
  {
    reference: "Graciliano Ramos, Vidas Secas",
    application: "vulnerabilidade provocada pela seca, pobreza, migração e ausência de proteção estatal",
    tags: ["seca", "pobreza", "migracao", "ambiente", "desigualdade"]
  },
  {
    reference: "Jorge Amado, Capitães da Areia",
    application: "abandono de crianças, exclusão social e resposta insuficiente das instituições",
    tags: ["infancia", "abandono", "pobreza", "violencia", "cidade"]
  },
  {
    reference: "George Orwell, 1984",
    application: "vigilância, manipulação da informação e controle social por estruturas de poder",
    tags: ["tecnologia", "inteligencia", "vigilancia", "privacidade", "dados", "redes", "midia", "politica", "informacao"]
  },
  {
    reference: "Aldous Huxley, Admirável Mundo Novo",
    application: "controle social sustentado por consumo, distração e condicionamento dos indivíduos",
    tags: ["tecnologia", "inteligencia", "consumo", "midia", "manipulacao", "sociedade"]
  },
  {
    reference: "José Saramago, Ensaio sobre a Cegueira",
    application: "indiferença coletiva, ruptura da solidariedade e dificuldade de reconhecer o sofrimento do outro",
    tags: ["indiferenca", "saude", "crise", "solidariedade", "violencia"]
  },
  {
    reference: "Machado de Assis, O Alienista",
    application: "questionamento dos limites da autoridade científica e dos critérios usados para definir normalidade",
    tags: ["saude", "ciencia", "poder", "preconceito", "normalidade"]
  },
  {
    reference: "Chimamanda Ngozi Adichie, O perigo de uma história única",
    application: "estereótipos surgem quando um grupo é reduzido a uma narrativa única e sem diversidade interna",
    tags: ["preconceito", "racismo", "midia", "cultura", "representacao", "mulher"]
  },
  {
    reference: "Byung-Chul Han, Sociedade do Cansaço",
    application: "pressão por desempenho e produtividade pode produzir exaustão e responsabilização individual excessiva",
    tags: ["saude", "trabalho", "produtividade", "ansiedade", "tecnologia"]
  },
  {
    reference: "Amartya Sen",
    application: "desenvolvimento depende da ampliação de liberdades e capacidades reais, não apenas de crescimento econômico",
    tags: ["desigualdade", "economia", "pobreza", "educacao", "saude", "liberdade"]
  },
  {
    reference: "Émile Durkheim",
    application: "instituições como a escola participam da socialização e da formação de normas coletivas",
    tags: ["educacao", "escola", "sociedade", "instituicoes", "cultura"]
  },
  {
    reference: "Simone de Beauvoir",
    application: "papéis de gênero são socialmente construídos e ajudam a manter desigualdades entre homens e mulheres",
    tags: ["mulher", "genero", "trabalho", "violencia", "desigualdade"]
  },
  {
    reference: "Manuel Castells",
    application: "redes de informação reorganizam relações de poder, participação e exclusão na sociedade",
    tags: ["internet", "tecnologia", "redes", "informacao", "midia", "politica"]
  }
];

const STOP_WORDS = new Set([
  "a", "ao", "aos", "as", "com", "como", "da", "das", "de", "do", "dos", "e", "em",
  "eu", "me", "na", "nas", "no", "nos", "o", "os", "ou", "para", "por", "pra", "que",
  "sem", "sobre", "um", "uma", "meu", "minha"
]);

export function selectEssayRepertoireContext(message: string, limit = 7) {
  const terms = normalize(message)
    .split(/\s+/)
    .filter((term) => term.length >= 4 && !STOP_WORDS.has(term));

  const ranked = REPERTOIRE_BANK
    .map((entry, index) => ({
      entry,
      index,
      score: entry.tags.reduce(
        (total, tag) => total + (terms.some((term) => tag === term || tag.startsWith(term) || term.startsWith(tag)) ? 3 : 0),
        0
      )
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const relevant = ranked.filter((item) => item.score > 0).slice(0, limit);
  const fallback = ranked.filter((item) => item.score === 0).slice(0, Math.max(0, 4 - relevant.length));
  const selected = [...relevant, ...fallback].slice(0, limit);

  return [
    "REPERTÓRIOS SELECIONADOS PARA ESTA CONVERSA",
    "Use apenas se houver conexão real com o argumento. Não force citação nem invente frase literal.",
    ...selected.map(({ entry }) => `- ${entry.reference}: ${entry.application}.`)
  ].join("\n");
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
