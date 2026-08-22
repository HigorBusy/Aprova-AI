---
name: AprovaAI
description: Sistema editorial noturno para correcao e evolucao em redacao ENEM.
colors:
  ink-night: "#08111f"
  ink-deep: "#050a12"
  work-surface: "#0f1e31"
  analysis-cyan: "#35bfe7"
  analysis-light: "#9de8fb"
  highlighter-yellow: "#f2c94c"
  progress-green: "#65d69e"
  correction-coral: "#ff6b6b"
  paper-ivory: "#f4f1e8"
  paper-cool: "#edf2f4"
  secondary-text: "#8fa3b8"
typography:
  display:
    fontFamily: "Space Grotesk, Geist, Inter, sans-serif"
    fontSize: "clamp(3.2rem, 7vw, 6rem)"
    fontWeight: 600
    lineHeight: 0.92
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Space Grotesk, Geist, Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  data:
    fontFamily: "ui-monospace, SFMono-Regular, monospace"
    fontWeight: 600
rounded:
  control: "8px"
  surface: "12px"
  focal: "16px"
spacing:
  compact: "8px"
  component: "16px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.highlighter-yellow}"
    textColor: "{colors.ink-night}"
    rounded: "{rounded.control}"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.paper-ivory}"
    rounded: "{rounded.control}"
    height: "56px"
  input:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.paper-ivory}"
    rounded: "{rounded.control}"
    height: "52px"
---

# Design System: AprovaAI

## Overview

**Creative North Star: "Mesa de Correcao Noturna"**

O AprovaAI e uma bancada digital para estudantes que escrevem, revisam e reescrevem por longos periodos. A interface combina a concentracao de uma mesa noturna com a precisao editorial de uma redacao corrigida. Papel, marca-texto e caneta aparecem como linguagem funcional, nunca como decoracao escolar.

Landing pages podem usar contraste de escala e alternar superficies escuras e papel frio. O aplicativo permanece mais silencioso: navegacao previsivel, conteudo amplo e cor reservada a estados ou acoes.

**Key Characteristics:**
- Escuro confortavel, sem preto puro.
- Papel frio para demonstracoes e resultados extensos.
- Cor com funcao semantica.
- Hierarquia editorial, nao futurista.
- Redacao sempre como elemento focal.

## Colors

A paleta parte de azul-tinta profundo e usa tres marcas de cor semelhantes aos instrumentos de uma correcao.

### Primary
- **Amarelo Marca-Texto** (`#f2c94c`): CTA principal, oferta em destaque e prioridade imediata.
- **Ciano de Analise** (`#35bfe7`): competencias, links, foco e informacao analitica.

### Secondary
- **Verde de Progresso** (`#65d69e`): sucesso, conclusao e estado saudavel.
- **Coral de Correcao** (`#ff6b6b`): erro, sublinhado critico e alerta. Nunca usar como decoracao.

### Neutral
- **Azul-Tinta** (`#08111f`): fundo principal.
- **Tinta Profunda** (`#050a12`): fundo de maior profundidade.
- **Superficie de Trabalho** (`#0f1e31`): cards, campos e paineis.
- **Marfim de Papel** (`#f4f1e8`): texto primario em fundo escuro.
- **Papel Frio** (`#edf2f4`): resultado, exemplo e contraste editorial.
- **Texto Secundario** (`#8fa3b8`): apoio em fundo escuro.

**The Functional Ink Rule.** Amarelo chama para agir, ciano explica, verde confirma e coral corrige. Nenhuma dessas cores existe apenas para preencher espaco.

## Typography

**Display Font:** Space Grotesk com Geist e Inter como fallback.
**Body Font:** Space Grotesk com Geist e Inter como fallback.
**Data Font:** pilha monospace nativa apenas para notas, credito, tempo e numeracao.

**Character:** direta e humana, com titulos densos e leitura aberta. O mesmo sans sustenta marketing e produto; escala e espacamento mudam conforme a superficie.

### Hierarchy
- **Display** (600, `clamp(3.2rem, 7vw, 6rem)`, 0.92): somente primeira dobra e grandes manifestos.
- **Headline** (600, 2.25rem a 3.75rem, 1.02): titulos de secao.
- **Title** (600, 1.25rem a 2.25rem, 1.15): paineis e ferramentas.
- **Body** (400, 1rem a 1.25rem, 1.6 a 1.75): explicacoes com medida maxima aproximada de 70 caracteres.
- **Label** (600, 0.75rem a 0.875rem): metadados e estados, sem uso ornamental.

**The Quiet Product Rule.** O aplicativo nao herda a escala dramatica da landing; dentro da ferramenta, a informacao lidera.

## Layout

A landing usa containers de 1280 a 1440px, duas colunas na primeira dobra e secoes verticais entre 96 e 128px. O app usa sidebar fixa de 256px no desktop e navegacao inferior no mobile. Paineis operacionais ocupam a largura disponivel e evitam pilhas estreitas de cards.

Abaixo de 1024px, composicoes assimetricas viram uma coluna. Abaixo de 640px, botoes principais ocupam a largura e o diagnostico empilha texto e competencias sem overflow horizontal.

## Elevation & Depth

Profundidade vem primeiro de diferenca tonal e depois de sombra ambiente com deslocamento vertical. Halos coloridos e glow sem deslocamento nao fazem parte do sistema. Superficies de papel podem usar sombra ampla e neutra para parecerem colocadas sobre a mesa.

### Shadow Vocabulary
- **Painel operacional** (`0 22px 64px rgba(2,7,15,0.42)`): paineis grandes e modais.
- **Papel elevado** (`0 28px 80px rgba(20,43,63,0.14)`): resultados sobre fundo claro.
- **Objeto focal** (`0 38px 100px rgba(2,7,15,0.58)`): demonstracao principal da landing.

## Shapes

Controles usam cantos de 8px; paineis usam 12px; demonstracoes e ofertas focais chegam a 16px. Pills ficam reservadas a badges compactos. Bordas sao finas e frias; uma superficie nao combina borda forte com sombra forte.

## Components

### Buttons
- **Primary:** amarelo marca-texto, texto azul-tinta, 56px na landing e 44 a 52px no produto.
- **Secondary:** superficie azul escura, borda fria discreta e texto marfim.
- **Hover / Focus:** mudanca tonal curta; foco ciano de 2px com offset de 3px.

### Cards / Containers
- **Corner Style:** 12 a 16px.
- **Material:** camada tonal opaca ou semitransparente; blur apenas onde preserva contexto real.
- **Use:** cards representam objetos manipulaveis, resultados ou unidades de compra. Secoes de pagina ficam sem card.

### Inputs
- Fundo `#0f1e31`, borda fria, raio de 8px e foco ciano. Campos longos de redacao usam tipografia de corpo e line-height generoso.

### Navigation
- Sidebar escura e persistente no desktop; barra inferior no mobile.
- Item ativo usa amarelo com texto azul-tinta. Itens inativos permanecem neutros e ganham contraste no hover.

## Do's and Don'ts

### Do
- Mostrar trechos, competencias e proximas tarefas como prova do mecanismo.
- Dar espaco real para leitura e reescrita.
- Usar papel frio quando um resultado precisa ser estudado.
- Manter numeros em monospace e com algarismos tabulares.

### Don't
- Retomar roxo, neon, estrelas, grids espaciais ou linguagem de central de comando.
- Usar glow como contorno decorativo.
- Empilhar cards dentro de cards.
- Inventar depoimentos, notas, aprovacao ou estatisticas comerciais.
- Usar emojis ou ilustracoes infantis como sistema de icones.
