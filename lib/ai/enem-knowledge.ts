export const ENEM_BASE_KNOWLEDGE = `
BASE FIXA DO APROVAAI PARA ENEM

REDACAO ENEM
- A nota vai de 0 a 1000 e soma cinco competencias de 0 a 200.
- Competencia 1: dominio da norma padrao, ortografia, concordancia, regencia, pontuacao e sintaxe.
- Competencia 2: compreensao do tema, atendimento ao tipo dissertativo-argumentativo e uso produtivo de repertorio sociocultural.
- Competencia 3: selecao, organizacao e desenvolvimento dos argumentos. Avalia projeto de texto, profundidade e progressao logica.
- Competencia 4: coesao, conectivos, retomadas, encadeamento entre frases e paragrafos.
- Competencia 5: proposta de intervencao com agente, acao, meio/modo, finalidade e detalhamento, respeitando direitos humanos.

RUBRICA POR FAIXA
- 40 pontos: dominio precario, muitos desvios ou estrutura muito insuficiente.
- 80 pontos: dominio insuficiente, ideia reconhecivel, mas com falhas graves e frequentes.
- 120 pontos: dominio mediano, atende parcialmente ao criterio, mas com lacunas claras.
- 160 pontos: bom dominio, poucas falhas, desenvolvimento consistente, mas ainda sem excelencia.
- 200 pontos: dominio excelente, controle pleno do criterio, precisao e produtividade.

BENCHMARK INTERNO DE CALIBRAGEM
Use estes padroes apenas para calibrar nota, nunca para copiar texto:
- nota_1000: tese explicita, repertorio legitimado e produtivo, dois argumentos desenvolvidos, coesao variada, proposta completa com agente, acao, meio, finalidade e detalhamento. Penalizacoes so devem ocorrer com evidencias reais.
- nota_960: desempenho excelente com pequena limitacao localizada, como detalhamento menos robusto, conectivo pouco variado em um ponto ou um trecho que poderia aprofundar mais. Competencias geralmente ficam entre 180 e 200.
- nota_920: texto muito bom, com projeto claro e proposta completa, mas uma competencia apresenta limitacao perceptivel. Nao confundir ausencia de estilo sofisticado com erro.
- nota_800: bom texto, mas com desenvolvimento irregular, repertorio pouco explorado ou proposta menos detalhada. Competencias tendem a 140-180.
- nota_600: estrutura basica, tese reconhecivel, mas argumentos genericos, repertorio fraco ou intervencao incompleta.
- nota_400: texto curto, superficial, com falhas fortes de tema, argumentacao, coesao ou intervencao.

MODO EXCELENCIA
Ative mentalmente o modo excelencia quando o texto apresentar simultaneamente:
- tese clara;
- progressao argumentativa;
- repertorio legitimado e conectado a tese;
- boa coesao com conectivos e retomadas;
- proposta de intervencao com agente, acao, meio, finalidade e detalhamento.
Nesse modo, procure motivos reais para penalizar. Nao invente problemas genericos.

COMPETENCIA 1
- 40: muitos desvios que dificultam leitura.
- 80: desvios frequentes de ortografia, concordancia, regencia, pontuacao ou sintaxe.
- 120: desvios pontuais, mas repetidos o suficiente para comprometer fluidez.
- 160: poucos desvios e bom controle da norma padrao.
- 200: escrita segura, variada e praticamente sem desvios.

COMPETENCIA 2
- 40: fuga forte, tangenciamento severo ou repertorio inexistente.
- 80: compreende parcialmente o tema, mas desenvolve de modo generico.
- 120: atende ao tema, mas repertorio e pouco produtivo ou pouco conectado.
- 160: repertorio legitimado e conectado, com boa compreensao da proposta.
- 200: repertorio pertinente, produtivo e integrado ao projeto argumentativo.
- Nao avalie vocabulario, formalidade ou estilo como criterio central da C2. C2 avalia tema, tipo textual, repertorio legitimado, produtividade e articulacao com a tese.
- Se houver repertorio legitimado bem conectado ao argumento, a C2 deve ficar em 180-200, salvo fuga, tangenciamento ou uso improdutivo comprovado.

COMPETENCIA 3
- 40: ideias soltas, sem projeto de texto.
- 80: argumentacao muito previsivel, com pouca organizacao.
- 120: ha tese e argumentos, mas desenvolvimento superficial.
- 160: projeto claro, argumentos organizados e bem explicados.
- 200: argumentacao consistente, progressiva e convincente.

COMPETENCIA 4
- 40: coesao muito falha, frases desconectadas.
- 80: conectivos raros, repetitivos ou usados mecanicamente.
- 120: coesao mediana, com encadeamento simples e retomadas limitadas.
- 160: bom uso de conectivos e progressao entre ideias.
- 200: coesao fluida, variada e funcional em todo o texto.
- Se o texto usa corretamente conectivos como "entretanto", "ademais", "alem disso", "nesse contexto", "portanto" e "dessa forma", com progressao textual e retomadas, a C4 deve se aproximar de 180-200.

COMPETENCIA 5
- 40: proposta ausente ou quase inexistente.
- 80: proposta vaga, sem partes essenciais.
- 120: proposta com agente e acao, mas sem meio, finalidade ou detalhamento suficiente.
- 160: proposta completa, mas com detalhamento ainda pouco sofisticado.
- 200: agente, acao, meio, finalidade e detalhamento claros, viaveis e articulados ao problema.
- A avaliacao da C5 deve verificar objetivamente: agente, acao, meio/modo, finalidade e detalhamento.
- Se os cinco elementos estiverem presentes, a C5 deve ficar em 180-200. Pequenas limitacoes de estilo nao justificam reduzir para 140.

ESTRUTURA RECOMENDADA DE REDACAO
- Introducao: contextualizacao, recorte do tema e tese clara.
- Desenvolvimento 1: primeiro argumento com prova, explicacao e relacao com a tese.
- Desenvolvimento 2: segundo argumento com prova, explicacao e relacao com a tese.
- Conclusao: retomada da tese e proposta de intervencao completa.

REPERTORIOS CORINGA, SEM INVENTAR FONTE
- Constituicao Federal de 1988: direitos sociais, cidadania, educacao, saude, dignidade.
- Paulo Freire: educacao como pratica de liberdade e formacao critica.
- Zygmunt Bauman: modernidade liquida, fragilidade de vinculos e instituicoes.
- Pierre Bourdieu: desigualdade, capital cultural e reproducao social.
- Milton Santos: cidadania mutilada e desigualdades no territorio.
- Hannah Arendt: responsabilidade coletiva e espaco publico.
- IBGE, Inep, OMS e ONU podem ser citados apenas quando o aluno ou o contexto trouxer dado verificavel. Nao invente numeros.

ERROS COMUNS
- Tese vaga ou ausente.
- Argumento que apenas repete o problema.
- Repertorio citado sem conexao com o tema.
- Desenvolvimento sem exemplo, causa, consequencia ou explicacao.
- Conectivos repetidos: "alem disso", "portanto", "dessa forma" usados sem funcao real.
- Proposta de intervencao incompleta, sem agente, meio ou detalhamento.
- Conclusao que so resume e nao intervem.
- Criticas genericas proibidas: "linguagem excessivamente formal", "frases longas" ou "analise superficial" sem citar trecho especifico. Toda critica deve apontar trecho, problema e impacto na nota.

CONECTIVOS UTEIS
- Causa: visto que, uma vez que, em razao de.
- Consequencia: desse modo, por conseguinte, como efeito.
- Oposicao: contudo, entretanto, apesar disso.
- Adicao qualificada: alem disso, soma-se a isso, outro fator relevante.
- Exemplificacao: por exemplo, nesse sentido, a exemplo de.
- Conclusao: portanto, assim, diante disso.

TECNICAS DE ESTUDO
- Revisao ativa: fechar o material e tentar explicar de memoria.
- Questoes primeiro: identificar lacunas pela pratica antes de reler teoria.
- Correcao de erro: registrar por que errou, qual regra faltou e como resolveria de novo.
- Ciclo curto: teoria essencial, questoes, correcao, revisao.
- Gestao de tempo: blocos de 25 a 50 minutos com meta concreta.

FUTURO, NAO IMPLEMENTAR AGORA
- Leitura de PDF.
- Leitura de imagem/OCR.
- Comando de voz.
- Voz real.
- Geracao de apresentacoes.
- Integracao Gamma API.
- Geracao de slides por Markdown/Marp.
`.trim();
