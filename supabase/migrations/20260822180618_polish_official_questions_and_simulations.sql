-- Strengthen the question bank with traceable INEP material and calibrate
-- simulations to the pace and composition of an ENEM knowledge-area block.

alter table public.question_sessions drop constraint if exists question_sessions_question_count_check;
alter table public.question_sessions add constraint question_sessions_question_count_check
  check (question_count between 1 and 45);

alter table public.question_sessions drop constraint if exists question_sessions_time_limit_check;
alter table public.question_sessions add constraint question_sessions_time_limit_check
  check (time_limit_minutes is null or time_limit_minutes between 5 and 330);

insert into public.question_topics (area_key, discipline, name, slug, sort_order) values
  ('languages', 'Redação', 'Competências da redação', 'linguagens-redacao-competencias', 60),
  ('humanities', 'Filosofia', 'Conhecimento e ética', 'humanas-conhecimento-etica', 60),
  ('humanities', 'Geografia', 'Questões socioambientais', 'humanas-socioambiental', 70),
  ('humanities', 'Sociologia', 'Trabalho e democracia', 'humanas-trabalho-democracia', 80),
  ('humanities', 'Geopolítica', 'Relações internacionais', 'humanas-relacoes-internacionais', 90),
  ('nature', 'Química', 'Soluções e estequiometria', 'natureza-solucoes-estequiometria', 60),
  ('nature', 'Biologia', 'Zoologia e evolução', 'natureza-zoologia-evolucao', 70),
  ('nature', 'Física', 'Mecânica e energia', 'natureza-mecanica-energia', 80),
  ('math', 'Matemática', 'Razão e proporcionalidade', 'matematica-razao-proporcao', 60),
  ('math', 'Matemática', 'Geometria espacial', 'matematica-geometria-espacial', 70)
on conflict (slug) do update set
  area_key = excluded.area_key,
  discipline = excluded.discipline,
  name = excluded.name,
  sort_order = excluded.sort_order;

insert into public.question_bank (
  topic_id, source_type, source_name, source_year, source_reference, rights_note,
  difficulty, prompt, alternatives, correct_option, explanation
)
select t.id, q.source_type, q.source_name, q.source_year, q.reference,
  q.rights_note, q.difficulty, q.prompt, q.alternatives::jsonb,
  q.correct_option, q.explanation
from public.question_topics t
join (values
  ('linguagens-interpretacao', 'official_enem', 'ENEM 2024 · 1º dia · Caderno Azul', 2024, 'ENEM-2024-D1-AZUL-Q40', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'medium',
   E'O festival folclórico de Parintins, no Amazonas, anunciou que o Boi Caprichoso levou, em 2018, seu 23º título — contra 31 do adversário Boi Garantido. Desde o fim do evento que não paro de cantar duas músicas que aprendi no Bumbódromo (arena onde ocorre o espetáculo). Revezo entre “meu amor, eu sou feliz, êêê azul o meu país”, obviamente do boi azul, o Caprichoso; e “vermelho é curral, a ideologia avermelhou”, do boi vermelho, o Garantido. Esse revezamento seria proibido em Parintins, cidade tão dividida entre as torcidas dos bois. Em Parintins, você tem de ter um lado. Há aqueles que tentam fugir e dizem que são “garanchoso”, com os quais me identifiquei, mas esses são vistos com certo desdém.\n\nDYNIEWICZ, L. Disponível em: https://viagem.estadao.com.br. Acesso em: 22 nov. 2018 (adaptado).\n\nA apropriação de elementos como rivalidade, competitividade, torcida e gritos de guerra pelo festival de Parintins evidencia a',
   '[{"key":"A","text":"escolha de um local específico para a festa."},{"key":"B","text":"importância atribuída pelos turistas aos bois."},{"key":"C","text":"interação social estabelecida após o evento."},{"key":"D","text":"aproximação da manifestação folclórica com o esporte."},{"key":"E","text":"composição de enredos musicais pelos garanchosos."}]', 'D',
   'A rivalidade organizada em torcidas, a competição por títulos e os gritos de guerra transportam para a manifestação folclórica elementos típicos do universo esportivo.'),

  ('linguagens-interpretacao', 'official_enem', 'ENEM 2024 · 1º dia · Caderno Azul', 2024, 'ENEM-2024-D1-AZUL-Q41', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'medium',
   E'O Brasil somou cerca de 60 mil novos casos de câncer de mama até o final de 2019, número que corresponde a 25% de todos os diagnósticos da condição registrados no país, segundo dados do Instituto Nacional do Câncer (Inca). Apesar de o Outubro Rosa ser o mês de conscientização sobre a questão voltada para as mulheres, é muito importante lembrar que um dos grandes mitos da medicina é o de que o câncer de mama não afeta o sexo masculino.\n\nFatores importantes para detectar o câncer de mama masculino:\n1. Genética: se houver casos na família, as chances são um pouco mais elevadas.\n2. Hormônios: homens podem desenvolver tecido real das glândulas mamárias por tomarem certos medicamentos ou apresentarem níveis hormonais anormais.\n3. Caroços: é necessário que os médicos se atentem a alguns sintomas suspeitos, como um caroço na área do tórax.\n4. Retração na pele: em situações mais graves do câncer de mama masculino, é possível também ocorrer uma retração do mamilo.\n\nDisponível em: https://pebmed.com.br. Acesso em: 24 nov. 2021 (adaptado).\n\nAs informações dessa reportagem auxiliam no combate ao câncer de mama masculino por apresentarem um alerta sobre o(s)',
   '[{"key":"A","text":"sinais indicadores da doença."},{"key":"B","text":"índice de crescimento de casos."},{"key":"C","text":"exames para diagnóstico do tumor."},{"key":"D","text":"mitos a respeito da herança genética."},{"key":"E","text":"período de campanhas de conscientização."}]', 'A',
   'A reportagem enumera fatores e manifestações observáveis, como caroços e retração do mamilo. Sua função central é alertar para sinais indicadores da doença.'),

  ('linguagens-interpretacao', 'official_enem', 'ENEM 2024 · 1º dia · Caderno Azul', 2024, 'ENEM-2024-D1-AZUL-Q42', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'hard',
   E'Feijoada à minha moda\n\nAmiga Helena Sangirardi\nConforme um dia prometi\nOnde, confesso que esqueci\nE embora — perdoe — tão tarde\n(Melhor do que nunca!) este poeta\nSegundo manda a boa ética\nEnvia-lhe a receita (poética)\nDe sua feijoada completa.\n[...]\nDever cumprido. Nunca é vão\nA palavra de um poeta... — jamais!\nAbraça-a, em Brillat-Savarin,\nO seu Vinicius de Moraes.\n\nMORAES, V. In: CÍCERO, A.; QUEIROZ, E. (Org.). Vinicius de Moraes: nova antologia poética. São Paulo: Cia. das Letras, 2005 (fragmento).\n\nApesar de haver marcas formais de carta e receita, a característica que define esse texto como poema é o(a)',
   '[{"key":"A","text":"nomeação de um interlocutor."},{"key":"B","text":"manifestação de intimidade."},{"key":"C","text":"descrição de procedimentos."},{"key":"D","text":"utilização de uma linguagem expressiva."},{"key":"E","text":"apresentação de ingredientes culinários."}]', 'D',
   'O texto combina gêneros, mas se define como poema pela elaboração estética e expressiva da linguagem, perceptível no ritmo, nas rimas e no jogo verbal.'),

  ('humanas-conhecimento-etica', 'official_enem', 'ENEM 2024 · 1º dia · Caderno Azul', 2024, 'ENEM-2024-D1-AZUL-Q54', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'hard',
   E'Os grupos dominantes são beneficiados em termos de credibilidade e podem, com isso, controlar falas de membros de outros grupos, descredibilizando seus testemunhos com base em concepções compartilhadas de preconceito de identidade (gênero e raça). Algumas formas de preconceito tornam as declarações das pessoas menos importantes devido ao seu pertencimento a determinado grupo social. Assim, um falante recebe menos credibilidade devido ao preconceito do ouvinte.\n\nKUHNEN, T. Resenha de The Power and Ethics of Knowing, de Miranda Fricker. Revista Princípios, n. 33, 2013.\n\nCom base na reflexão suscitada no texto, o preconceito de identidade é responsável por um tipo de injustiça',
   '[{"key":"A","text":"estética, que normatiza os padrões corporais."},{"key":"B","text":"sensorial, que privilegia as habilidades visuais."},{"key":"C","text":"afetiva, que impede as expressões emocionais."},{"key":"D","text":"epistêmica, que prejudica as trocas informacionais."},{"key":"E","text":"econômica, que perpetua as desigualdades materiais."}]', 'D',
   'A injustiça é epistêmica porque o preconceito reduz injustamente a credibilidade de quem produz ou transmite conhecimento, prejudicando a circulação de informações.'),

  ('humanas-conhecimento-etica', 'official_enem', 'ENEM 2024 · 1º dia · Caderno Azul', 2024, 'ENEM-2024-D1-AZUL-Q55', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'hard',
   E'A alma funciona no meu corpo de maneira maravilhosa. Nele se aloja, certamente, mas sabe bem dele escapar: escapa para ver as coisas através da janela dos meus olhos, escapa para sonhar quando durmo, para sobreviver quando morro. Minha alma durará muito tempo e mais que muito tempo, quando meu corpo vier a apodrecer. Viva minha alma! É meu corpo luminoso, purificado, virtuoso, ágil, móvel, tépido, viçoso; é meu corpo liso, castrado, arredondado como uma bolha de sabão.\n\nFOUCAULT, M. O corpo utópico, as heterotopias. São Paulo: Edições N-1, 2013.\n\nEsse texto reforça uma concepção metafísica clássica que remete a um(a)',
   '[{"key":"A","text":"pressuposto lógico."},{"key":"B","text":"pensamento dicotômico."},{"key":"C","text":"contemplação da natureza."},{"key":"D","text":"raciocínio argumentativo."},{"key":"E","text":"crítica à individualidade."}]', 'B',
   'A separação entre alma duradoura e corpo perecível retoma o dualismo corpo-alma, uma forma clássica de pensamento dicotômico.'),

  ('humanas-cidadania', 'official_enem', 'ENEM 2024 · 1º dia · Caderno Azul', 2024, 'ENEM-2024-D1-AZUL-Q57', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'hard',
   E'Espaços públicos não são produtos dados e acabados, uma instituição que, uma vez estabelecida, traria a paz da consensualidade e a perfeita igualdade. São os lugares em que os problemas aparecem e se transformam em debates, em diálogo e em possibilidade de ajuste e compromissos. Por isso, não anulam os conflitos, ao contrário, são canais de comunicação e de visibilidade de oposições.\n\nGOMES, P. C. C. Espaço público, espaços públicos. Geographia, n. 44, set.-dez. 2018 (adaptado).\n\nAs características descritas no texto exibem a importância dos espaços públicos para a',
   '[{"key":"A","text":"prática do lazer."},{"key":"B","text":"vigilância da sociedade."},{"key":"C","text":"erradicação da violência."},{"key":"D","text":"construção da democracia."},{"key":"E","text":"diversificação do trabalho."}]', 'D',
   'Ao permitir debate, visibilidade de oposições e negociação de conflitos, o espaço público participa diretamente da construção democrática.'),

  ('humanas-trabalho-democracia', 'official_enem', 'ENEM 2024 · 1º dia · Caderno Amarelo', 2024, 'ENEM-2024-D1-AMARELO-Q69', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'medium',
   E'A democracia responde a esta pergunta: quem deve exercer o poder público? A resposta é: o exercício do poder público corresponde à coletividade dos cidadãos. Contudo, nessa pergunta não se fala sobre qual extensão deve ter o poder público. Trata-se somente de determinar o sujeito a quem o mando compete. A democracia propõe que mandemos todos; quer dizer, que todos intervenham nos fatos sociais.\n\nORTEGA Y GASSET, J. apud MAIA, E. C. Mario Vargas Llosa e o indivíduo para além da tribo. Disponível em: www.estadaodaarte.estadao.com.br. Acesso em: 10 out. 2021 (adaptado).\n\nO que sustenta o exercício do poder, conforme a configuração apresentada no texto escrito na década de 1920?',
   '[{"key":"A","text":"Soberania popular."},{"key":"B","text":"Divisão de classes."},{"key":"C","text":"Acúmulo de capital."},{"key":"D","text":"Defesa da propriedade."},{"key":"E","text":"Centralização administrativa."}]', 'A',
   'O texto atribui o exercício do poder público à coletividade dos cidadãos. Esse fundamento corresponde à soberania popular.'),

  ('humanas-socioambiental', 'official_enem', 'ENEM 2024 · 1º dia · Caderno Amarelo', 2024, 'ENEM-2024-D1-AMARELO-Q70', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'medium',
   E'A mudança do clima nas cidades brasileiras é um desafio de adaptação e equidade. Inundações, alagamentos e ondas de calor são cada vez mais frequentes e intensas. Cidades precisam se adaptar com urgência, a começar pelas áreas e populações mais vulneráveis. Implementar soluções baseadas na natureza de forma sistêmica pode contribuir para a redução de desastres relacionados às mudanças do clima e ainda gerar múltiplos benefícios para a economia, o ambiente e as pessoas.\n\nEVERS, H. et al. Soluções baseadas na natureza para adaptação em cidades. Disponível em: www.wribrasil.org.br. Acesso em: 19 out. 2023 (adaptado).\n\nQual medida atenua os problemas abordados no texto?',
   '[{"key":"A","text":"Criação de faixas sinalizadoras."},{"key":"B","text":"Incineração de resíduos sólidos."},{"key":"C","text":"Implantação de parques públicos."},{"key":"D","text":"Verticalização de espaços centrais."},{"key":"E","text":"Construção de estacionamentos privados."}]', 'C',
   'Parques públicos ampliam áreas permeáveis, vegetação e sombreamento, funcionando como solução baseada na natureza contra alagamentos e ondas de calor.'),

  ('humanas-relacoes-internacionais', 'official_enem', 'ENEM 2024 · 1º dia · Caderno Amarelo', 2024, 'ENEM-2024-D1-AMARELO-Q71', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'hard',
   E'O Conselho de Segurança da Organização das Nações Unidas (ONU) é, junto com a Assembleia-Geral, um dos principais órgãos de tomada de decisão dentro da entidade. O Conselho lida com questões de segurança e paz internacionais, além de recomendar a admissão de novos membros à Assembleia-Geral e aprovar mudanças na Carta das Nações Unidas. Cinco dos quinze membros são permanentes e podem vetar resoluções, o que ocorreu 261 vezes até 2020.\n\nGOMES, L.; PRETTO, N. O funcionamento do Conselho de Segurança das Nações Unidas. Disponível em: www.nexojornal.com.br. Acesso em: 10 nov. 2021 (adaptado).\n\nA composição e o funcionamento do organismo internacional apresentados revelam a seguinte característica das relações internacionais entre os países-membros:',
   '[{"key":"A","text":"Igualdade militar."},{"key":"B","text":"Assimetria política."},{"key":"C","text":"Consenso multipolar."},{"key":"D","text":"Equilíbrio estratégico."},{"key":"E","text":"Soberania compartilhada."}]', 'B',
   'O poder de veto exclusivo dos cinco membros permanentes demonstra uma distribuição desigual de capacidade decisória, caracterizando assimetria política.'),

  ('humanas-trabalho-democracia', 'official_enem', 'ENEM 2024 · 1º dia · Caderno Amarelo', 2024, 'ENEM-2024-D1-AMARELO-Q72', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'hard',
   E'Uma fábrica na qual os operários fossem, efetiva e integralmente, simples peças de máquinas executando cegamente as ordens da direção pararia em quinze minutos. O capitalismo só pode funcionar com a contribuição constante da atividade propriamente humana de seus subjugados que, ao mesmo tempo, tenta reduzir e desumanizar o mais possível.\n\nCASTORIADIS, C. A instituição imaginária da sociedade. Rio de Janeiro: Paz e Terra, 1982.\n\nO texto apresenta uma contradição interna do capitalismo caracterizada pela',
   '[{"key":"A","text":"obsolescência associada ao uso da tecnologia."},{"key":"B","text":"orientação voltada à administração de conflitos."},{"key":"C","text":"alienação decorrente da organização do trabalho."},{"key":"D","text":"isonomia remanescente da geração de riquezas."},{"key":"E","text":"produtividade vinculada ao fortalecimento da autonomia."}]', 'C',
   'O sistema depende da iniciativa humana do trabalhador, mas simultaneamente procura reduzi-lo a executor passivo. A contradição expressa a alienação na organização do trabalho.'),

  ('natureza-solucoes-estequiometria', 'official_enem', 'ENEM 2024 · 2º dia · Caderno Azul', 2024, 'ENEM-2024-D2-AZUL-Q97', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'hard',
   E'O soro caseiro serve para combater a desidratação por meio da reposição da água e sais minerais perdidos, por exemplo, por diarreia. Uma receita simples para a sua preparação consiste em utilizar duas colheres grandes (de sopa) de açúcar e duas colheres pequenas (de café) de sal de cozinha, dissolvidos em 2 L de água fervida, obtendo-se uma solução com concentração de íon sódio de 1,4 mg/mL.\n\nConsidere as massas molares: NaCl = 58,5 g/mol; Na = 23 g/mol.\n\nQual é o valor mais próximo da massa, em grama, de cloreto de sódio presente em uma única colher pequena?',
   '[{"key":"A","text":"0,7 g"},{"key":"B","text":"1,8 g"},{"key":"C","text":"2,8 g"},{"key":"D","text":"3,6 g"},{"key":"E","text":"7,0 g"}]', 'D',
   'Há 2,8 g de sódio nos 2 L. Pela razão entre as massas molares, a massa de NaCl é 2,8 × 58,5/23, aproximadamente 7,1 g. Como são duas colheres, cada uma contém cerca de 3,6 g.'),

  ('natureza-zoologia-evolucao', 'official_enem', 'ENEM 2024 · 2º dia · Caderno Azul', 2024, 'ENEM-2024-D2-AZUL-Q111', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'medium',
   E'O exoesqueleto dos crustáceos é formado por quitina e impregnações de sais calcários e, por isso, é mais duro quando comparado com o exoesqueleto de outros artrópodes. Esse revestimento externo confere proteção, mas, por ser duro, limita o crescimento desses animais.\n\nPara superar essa limitação, o exoesqueleto deve ser',
   '[{"key":"A","text":"formado somente na fase adulta do animal."},{"key":"B","text":"fragmentado para expansão nas áreas de articulação."},{"key":"C","text":"modelado continuamente para ajuste ao tamanho do corpo."},{"key":"D","text":"substituído por meio de mudas que ocorrem periodicamente."},{"key":"E","text":"impregnado por pequena quantidade de sais para sua distensão."}]', 'D',
   'Artrópodes crescem por ecdise: abandonam periodicamente o exoesqueleto rígido e formam outro, maior, após a expansão corporal.'),

  ('matematica-razao-proporcao', 'official_enem', 'ENEM 2024 · 2º dia · Caderno Azul', 2024, 'ENEM-2024-D2-AZUL-Q136', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'hard',
   E'O tamanho mínimo que a visão humana é capaz de visualizar sem o uso de equipamento auxiliar é equivalente a 100 micrômetros (1 micrômetro = 10⁻³ milímetros). Uma estudante pretende visualizar e analisar hemácias do sangue humano, que medem 0,007 mm de diâmetro. Ela adquiriu um microscópio óptico que tem uma lente ocular que amplia em 10 vezes a imagem do objeto em observação, e um conjunto de lentes objetivas com estas capacidades de ampliação:\n• lente I: 2 vezes;\n• lente II: 10 vezes;\n• lente III: 15 vezes;\n• lente IV: 1,1 vez;\n• lente V: 1,4 vez.\n\nO funcionamento desse microscópio permite o uso da lente ocular sozinha ou a combinação dela com uma de suas lentes objetivas, proporcionando, nesse caso, um aumento de sua capacidade de ampliação final, que é dada pelo produto entre as capacidades de ampliação da ocular e da objetiva.\n\nEssa estudante pretende selecionar a lente objetiva de menor capacidade de ampliação que permita, na combinação com a ocular, visualizar hemácias do sangue humano. A lente objetiva a ser selecionada pela estudante é a',
   '[{"key":"A","text":"I."},{"key":"B","text":"II."},{"key":"C","text":"III."},{"key":"D","text":"IV."},{"key":"E","text":"V."}]', 'A',
   'A hemácia mede 7 micrômetros e precisa chegar a 100 micrômetros, exigindo ampliação de ao menos 100/7. A ocular amplia 10 vezes; com a lente I, o total é 20 vezes, suficiente e menor que as demais opções suficientes.'),

  ('matematica-estatistica', 'official_enem', 'ENEM 2024 · 2º dia · Caderno Azul', 2024, 'ENEM-2024-D2-AZUL-Q137', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'hard',
   E'Ao calcular a média de suas notas em 4 provas, um estudante dividiu, por engano, a soma das notas por 5. Com isso, a média obtida foi 1 unidade menor do que deveria ser, caso fosse calculada corretamente.\n\nO valor correto da média das notas desse estudante é',
   '[{"key":"A","text":"4."},{"key":"B","text":"5."},{"key":"C","text":"6."},{"key":"D","text":"19."},{"key":"E","text":"21."}]', 'B',
   'Se S é a soma, então S/4 - S/5 = 1. Logo, S/20 = 1 e S = 20. A média correta é 20/4 = 5.'),

  ('matematica-porcentagem', 'official_enem', 'ENEM 2024 · 2º dia · Caderno Azul', 2024, 'ENEM-2024-D2-AZUL-Q140', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'hard',
   E'João e Felipe participaram, na escola, de uma maratona de matemática na qual, durante uma semana, resolveram 200 questões cada. Nessa maratona, a porcentagem P de acertos de cada participante é convertida em um conceito:\n• insatisfatório: se 0 ≤ P < 50;\n• regular: se 50 ≤ P < 60;\n• bom: se 60 ≤ P < 75;\n• muito bom: se 75 ≤ P < 90;\n• excelente: se 90 ≤ P ≤ 100.\n\nJoão acertou 75% das questões da maratona e Felipe acertou 30% a menos que a quantidade de questões que João acertou.\n\nOs conceitos de João e Felipe foram, respectivamente,',
   '[{"key":"A","text":"muito bom e bom."},{"key":"B","text":"muito bom e regular."},{"key":"C","text":"muito bom e insatisfatório."},{"key":"D","text":"bom e regular."},{"key":"E","text":"bom e insatisfatório."}]', 'B',
   'João acertou 150 questões, portanto obteve 75% e conceito muito bom. Felipe acertou 30% menos que 150, isto é, 105 questões: 52,5% de 200, conceito regular.'),

  ('matematica-geometria-plana', 'official_enem', 'ENEM 2024 · 2º dia · Caderno Azul', 2024, 'ENEM-2024-D2-AZUL-Q145', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'medium',
   E'O estádio do Maracanã passou por algumas modificações estruturais para a realização da Copa do Mundo de 2014, como, por exemplo, as dimensões do campo retangular. Para se adaptar aos padrões da Fifa, as dimensões do campo foram reduzidas de 110 m × 75 m para 105 m × 68 m.\n\nDisponível em: http://virgula.uol.com.br. Acesso em: 14 ago. 2013 (adaptado).\n\nEm quantos metros quadrados a área do campo do Maracanã foi reduzida?',
   '[{"key":"A","text":"24"},{"key":"B","text":"35"},{"key":"C","text":"555"},{"key":"D","text":"1 110"},{"key":"E","text":"1 145"}]', 'D',
   'A área anterior era 110 × 75 = 8 250 m². A nova área é 105 × 68 = 7 140 m². A redução foi de 1 110 m².'),

  ('matematica-estatistica', 'official_enem', 'ENEM 2024 · 2º dia · Caderno Azul', 2024, 'ENEM-2024-D2-AZUL-Q154', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'medium',
   E'Contratos de vários serviços disponíveis na internet apresentam uma quantidade excessiva de informações. Isso faz com que o tempo necessário para a leitura desses contratos possa ser longo.\n\nO quadro apresenta uma amostra do tempo considerado necessário para a leitura completa do contrato de alguns serviços digitais.\n\nServiço A: 36 minutos\nServiço B: 17 minutos\nServiço C: 27 minutos\nServiço D: 13 minutos\nServiço E: 13 minutos\nServiço F: 13 minutos\n\nROMERO, L. Não li e concordo. Superinteressante, n. 307, ago. 2012 (adaptado).\n\nO tempo médio, em minuto, necessário para a leitura completa de um contrato de serviço dentre os listados no quadro é, com uma casa decimal, aproximadamente,',
   '[{"key":"A","text":"13,0."},{"key":"B","text":"15,0."},{"key":"C","text":"19,8."},{"key":"D","text":"20,0."},{"key":"E","text":"23,3."}]', 'C',
   'A soma dos seis tempos é 119 minutos. Dividindo por 6, obtém-se aproximadamente 19,8 minutos.'),

  ('matematica-razao-proporcao', 'official_enem', 'ENEM 2024 · 2º dia · Caderno Azul', 2024, 'ENEM-2024-D2-AZUL-Q160', 'Questão oficial publicada pelo Inep, reproduzida integralmente com atribuição. Licença CC BY-ND 3.0.', 'hard',
   E'Uma piscina tem capacidade de 2 500 000 litros. Seu sistema de abastecimento foi regulado para ter uma vazão constante de 6 000 litros de água por minuto. O mesmo sistema foi instalado em uma segunda piscina, com capacidade de 2 750 000 litros, e regulado para ter uma vazão, também constante, capaz de enchê-la em um tempo 20% maior que o gasto para encher a primeira piscina.\n\nA vazão do sistema de abastecimento da segunda piscina, em litro por minuto, é',
   '[{"key":"A","text":"8 250."},{"key":"B","text":"7 920."},{"key":"C","text":"6 545."},{"key":"D","text":"5 500."},{"key":"E","text":"5 280."}]', 'D',
   'A primeira piscina leva 2 500 000/6 000 minutos. A segunda deve levar 20% a mais. Dividindo 2 750 000 por esse novo tempo, a vazão é 5 500 L/min.'),

  ('linguagens-redacao-competencias', 'official_other', 'Cartilha do Participante ENEM 2025', 2025, 'INEP-CARTILHA-2025-RED-C2', 'Item autoral AprovaAI baseado em orientação oficial da Cartilha do Participante do Inep. Não é questão oficial do ENEM.', 'hard',
   E'Na proposta de redação de 2024, o tema completo era “Desafios para a valorização da herança africana no Brasil”. Um participante discute apenas desigualdade racial no mercado de trabalho, sem relacionar a discussão à valorização da herança africana.\n\nSegundo a orientação oficial de correção, a consequência mais direta dessa abordagem é',
   '[{"key":"A","text":"perda exclusiva na Competência 1, por inadequação vocabular."},{"key":"B","text":"tangenciamento do tema, com limite de 40 pontos na Competência 2."},{"key":"C","text":"anulação automática por desrespeito aos direitos humanos."},{"key":"D","text":"nota máxima na Competência 3, pela escolha de um recorte."},{"key":"E","text":"desconsideração apenas da proposta de intervenção."}]', 'B',
   'A Cartilha do Participante explica que abordar parcialmente a frase temática caracteriza tangenciamento e limita a Competência 2 a, no máximo, 40 pontos, além de repercutir nas Competências 3 e 5.'),

  ('linguagens-redacao-competencias', 'official_other', 'Cartilha do Participante ENEM 2025', 2025, 'INEP-CARTILHA-2025-RED-C5', 'Item autoral AprovaAI baseado em orientação oficial da Cartilha do Participante do Inep. Não é questão oficial do ENEM.', 'hard',
   E'Leia a proposta: “O Ministério da Educação deve criar campanhas nas escolas, por meio de oficinas mensais conduzidas por professores e representantes de movimentos culturais, para ampliar o reconhecimento da herança africana entre os estudantes.”\n\nConsiderando os elementos exigidos pelo ENEM, essa proposta apresenta',
   '[{"key":"A","text":"somente agente e ação, sem meio ou finalidade."},{"key":"B","text":"ação e finalidade, mas nenhum agente responsável."},{"key":"C","text":"agente, ação, meio, finalidade e detalhamento da execução."},{"key":"D","text":"apenas uma retomada genérica do tema."},{"key":"E","text":"uma ação incompatível com os direitos humanos."}]', 'C',
   'Há agente (MEC), ação (criar campanhas), meio (oficinas mensais), finalidade (ampliar o reconhecimento) e detalhamento (condução por professores e representantes culturais).'),

  ('linguagens-interpretacao', 'authored', 'AprovaAI · Matriz de Referência do ENEM', 2026, 'APROVA-MATRIZ-LIN-006', 'Conteúdo autoral calibrado pela Matriz de Referência do ENEM. Não é uma questão oficial.', 'hard',
   E'Em uma campanha de leitura, uma biblioteca publica: “Algoritmos recomendam o que se parece com você. Livros apresentam o que você ainda não conhece.”\n\nA estratégia argumentativa desse enunciado busca valorizar a leitura ao',
   '[{"key":"A","text":"negar que sistemas digitais possam organizar informação."},{"key":"B","text":"opor a repetição de preferências à ampliação de repertório."},{"key":"C","text":"afirmar que livros dispensam escolhas individuais."},{"key":"D","text":"substituir a leitura por mecanismos de recomendação."},{"key":"E","text":"equiparar toda experiência literária ao consumo digital."}]', 'B',
   'O contraste semântico entre “parece com você” e “ainda não conhece” apresenta a leitura como ruptura da repetição e expansão de repertório.'),

  ('humanas-socioambiental', 'authored', 'AprovaAI · Matriz de Referência do ENEM', 2026, 'APROVA-MATRIZ-HUM-006', 'Conteúdo autoral calibrado pela Matriz de Referência do ENEM. Não é uma questão oficial.', 'hard',
   E'Um município canalizou rios, impermeabilizou extensas áreas e concentrou moradias populares em regiões de várzea. Anos depois, chuvas intensas passaram a produzir alagamentos mais frequentes e perdas desiguais entre bairros.\n\nA interpretação socioespacial mais adequada relaciona esse quadro à',
   '[{"key":"A","text":"distribuição natural e homogênea dos riscos ambientais."},{"key":"B","text":"neutralidade do planejamento urbano diante das classes sociais."},{"key":"C","text":"produção social do risco combinada à segregação urbana."},{"key":"D","text":"redução da vulnerabilidade pela expansão da impermeabilização."},{"key":"E","text":"independência entre ocupação do solo e dinâmica hidrológica."}]', 'C',
   'O risco não decorre apenas da chuva: decisões de uso do solo ampliam o escoamento e expõem de modo desigual populações instaladas em áreas vulneráveis.'),

  ('natureza-mecanica-energia', 'authored', 'AprovaAI · Matriz de Referência do ENEM', 2026, 'APROVA-MATRIZ-NAT-006', 'Conteúdo autoral calibrado pela Matriz de Referência do ENEM. Não é uma questão oficial.', 'hard',
   E'Um elevador de massa total 800 kg sobe 15 m em 30 s com velocidade constante. Desprezando perdas e adotando g = 10 m/s², a potência mecânica média desenvolvida pelo motor é',
   '[{"key":"A","text":"2 kW"},{"key":"B","text":"4 kW"},{"key":"C","text":"8 kW"},{"key":"D","text":"12 kW"},{"key":"E","text":"120 kW"}]', 'B',
   'O trabalho contra a gravidade é mgh = 800 × 10 × 15 = 120 000 J. Dividindo por 30 s, a potência é 4 000 W, ou 4 kW.'),

  ('natureza-solucoes-estequiometria', 'authored', 'AprovaAI · Matriz de Referência do ENEM', 2026, 'APROVA-MATRIZ-NAT-007', 'Conteúdo autoral calibrado pela Matriz de Referência do ENEM. Não é uma questão oficial.', 'hard',
   E'Uma estação precisa preparar 500 L de solução contendo 20 mg de íon fluoreto por litro. O sal disponível é fluoreto de sódio (NaF), cuja massa molar é 42 g/mol; a massa molar do flúor é 19 g/mol. Considerando dissolução completa, a massa aproximada de NaF necessária é',
   '[{"key":"A","text":"4,5 g"},{"key":"B","text":"10,0 g"},{"key":"C","text":"22,1 g"},{"key":"D","text":"42,0 g"},{"key":"E","text":"84,0 g"}]', 'C',
   'São necessários 10 g de flúor. Como 42 g de NaF contêm 19 g de F, a massa de sal é 10 × 42/19, aproximadamente 22,1 g.'),

  ('matematica-funcoes', 'authored', 'AprovaAI · Matriz de Referência do ENEM', 2026, 'APROVA-MATRIZ-MAT-006', 'Conteúdo autoral calibrado pela Matriz de Referência do ENEM. Não é uma questão oficial.', 'hard',
   E'Uma cultura de microrganismos começa com 1 200 indivíduos e cresce 50% a cada 2 horas. Mantido esse padrão, a população após 8 horas será',
   '[{"key":"A","text":"3 600"},{"key":"B","text":"4 050"},{"key":"C","text":"5 400"},{"key":"D","text":"6 075"},{"key":"E","text":"9 600"}]', 'D',
   'Em 8 horas ocorrem quatro períodos de crescimento. A população é 1 200 × 1,5⁴ = 1 200 × 5,0625 = 6 075.'),

  ('matematica-probabilidade', 'authored', 'AprovaAI · Matriz de Referência do ENEM', 2026, 'APROVA-MATRIZ-MAT-007', 'Conteúdo autoral calibrado pela Matriz de Referência do ENEM. Não é uma questão oficial.', 'hard',
   E'Em um processo seletivo, 60% dos candidatos estudaram em escola pública. Entre esses, 30% foram aprovados; entre os demais, 20% foram aprovados. Escolhendo ao acaso um candidato aprovado, a probabilidade de ele ter estudado em escola pública é',
   '[{"key":"A","text":"45%"},{"key":"B","text":"60%"},{"key":"C","text":"69,2%"},{"key":"D","text":"75%"},{"key":"E","text":"80%"}]', 'C',
   'Em 100 candidatos, 18 aprovados vêm da escola pública e 8 das demais escolas. Entre os 26 aprovados, 18/26 corresponde a aproximadamente 69,2%.')
) as q(topic_slug, source_type, source_name, source_year, reference, rights_note, difficulty, prompt, alternatives, correct_option, explanation)
  on q.topic_slug = t.slug
on conflict (source_reference) do update set
  topic_id = excluded.topic_id,
  source_type = excluded.source_type,
  source_name = excluded.source_name,
  source_year = excluded.source_year,
  rights_note = excluded.rights_note,
  difficulty = excluded.difficulty,
  prompt = excluded.prompt,
  alternatives = excluded.alternatives,
  correct_option = excluded.correct_option,
  explanation = excluded.explanation,
  is_active = true,
  updated_at = now();

create or replace function public.start_question_session(
  p_mode text default 'quick',
  p_area_key text default null,
  p_topic_id uuid default null,
  p_count integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
  v_count integer := greatest(1, least(coalesce(p_count, 5), 10));
  v_inserted integer;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_mode not in ('quick', 'area', 'weakness', 'errors') then raise exception 'INVALID_MODE'; end if;
  if p_area_key is not null and p_area_key not in ('math', 'languages', 'humanities', 'nature') then raise exception 'INVALID_AREA'; end if;

  update public.question_sessions set status = 'abandoned'
  where user_id = v_user_id and status = 'active';

  insert into public.question_sessions (user_id, mode, area_key, topic_id, question_count)
  values (v_user_id, p_mode, p_area_key, p_topic_id, v_count)
  returning id into v_session_id;

  with ranked_weaknesses as (
    select s.topic_id from public.question_topic_stats s
    where s.user_id = v_user_id and s.total_attempts >= 2
    order by (s.wrong_attempts::numeric / nullif(s.total_attempts, 0)) desc, s.total_attempts desc
    limit 3
  ),
  previous_errors as (
    select distinct i.question_id from public.question_session_items i
    where i.user_id = v_user_id and i.is_correct = false
  ),
  candidates as (
    select q.id
    from public.question_bank q
    join public.question_topics t on t.id = q.topic_id
    where q.is_active
      and (p_mode <> 'area' or t.area_key = p_area_key)
      and (p_topic_id is null or q.topic_id = p_topic_id)
      and (p_mode <> 'weakness' or q.topic_id in (select topic_id from ranked_weaknesses))
      and (p_mode <> 'errors' or q.id in (select question_id from previous_errors))
    order by (-ln(greatest(random(), 0.000001))) /
      ((case q.difficulty when 'hard' then 4.0 when 'medium' then 3.2 else 1.2 end) *
       (case q.source_type when 'official_enem' then 1.5 when 'official_other' then 1.2 else 1.0 end))
    limit v_count
  )
  insert into public.question_session_items (session_id, user_id, question_id, position)
  select v_session_id, v_user_id, c.id, row_number() over () from candidates c;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    delete from public.question_sessions where id = v_session_id;
    raise exception 'NO_QUESTIONS_AVAILABLE';
  end if;

  update public.question_sessions set question_count = v_inserted where id = v_session_id;
  return public.get_question_session(v_session_id);
end;
$$;

create or replace function public.start_simulation(
  p_question_count integer default 15,
  p_area_keys text[] default array['math', 'languages', 'humanities', 'nature']::text[],
  p_time_limit_minutes integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
  v_count integer := greatest(5, least(coalesce(p_question_count, 15), 45));
  v_time integer := greatest(5, least(coalesce(p_time_limit_minutes, 50), 330));
  v_areas text[] := coalesce(p_area_keys, array['math', 'languages', 'humanities', 'nature']::text[]);
  v_inserted integer;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if cardinality(v_areas) = 0 or exists (
    select 1 from unnest(v_areas) area_key
    where area_key not in ('math', 'languages', 'humanities', 'nature')
  ) then raise exception 'INVALID_AREAS'; end if;

  update public.question_sessions set status = 'abandoned', last_activity_at = now()
  where user_id = v_user_id and status = 'active';

  insert into public.question_sessions (user_id, mode, question_count, selected_areas, time_limit_minutes)
  values (v_user_id, 'simulation', v_count, v_areas, v_time)
  returning id into v_session_id;

  with weighted as (
    select q.id, t.area_key,
      row_number() over (
        partition by t.area_key
        order by (-ln(greatest(random(), 0.000001))) /
          ((case q.difficulty when 'hard' then 4.0 when 'medium' then 3.2 else 1.0 end) *
           (case q.source_type when 'official_enem' then 1.6 when 'official_other' then 1.25 else 1.0 end))
      ) as area_rank
    from public.question_bank q
    join public.question_topics t on t.id = q.topic_id
    where q.is_active and t.area_key = any(v_areas)
  ),
  candidates as (
    select id from weighted
    order by area_rank, area_key
    limit v_count
  )
  insert into public.question_session_items (session_id, user_id, question_id, position)
  select v_session_id, v_user_id, c.id, row_number() over () from candidates c;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    delete from public.question_sessions where id = v_session_id;
    raise exception 'NO_QUESTIONS_AVAILABLE';
  end if;

  update public.question_sessions set question_count = v_inserted where id = v_session_id;
  return public.get_question_session(v_session_id);
end;
$$;

revoke all on function public.start_question_session(text, text, uuid, integer) from public, anon;
revoke all on function public.start_simulation(integer, text[], integer) from public, anon;
grant execute on function public.start_question_session(text, text, uuid, integer) to authenticated;
grant execute on function public.start_simulation(integer, text[], integer) to authenticated;
