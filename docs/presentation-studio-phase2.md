# Presentation Studio - Fase 2

## Entrega

- `visual_director` separado do gerador de conteúdo.
- Oito temas visuais aplicados sem alterar o conteúdo dos slides.
- Painel de notas do apresentador e fontes por slide.
- Edição manual de conteúdo, direção visual e notas.
- Edição por IA limitada ao slide selecionado.
- Ações rápidas: resumir, tornar visual, simplificar, adicionar exemplo, tornar acadêmico e melhorar conclusão.

## Temas

- Acadêmico
- Moderno
- Minimalista
- Dark
- Corporativo
- Criativo
- Educacional
- Premium

Os temas compartilham uma estrutura tipográfica e de cores consistente. A troca de tema não regenera nem perde o conteúdo.

## Créditos e segurança

- Alterações manuais e troca de tema não consomem créditos.
- Cada edição por IA custa exatamente 1 crédito.
- A rota exige sessão válida, limita requisições e valida o tamanho da instrução.
- A função `complete_presentation_slide_edit` verifica propriedade, saldo e custo fixo antes de atualizar apenas o slide selecionado.
- Débito, registro da transação e atualização do slide ocorrem na mesma transação do banco.

## Pipeline de geração

1. `presentation_planner` define narrativa e estrutura.
2. `slide_writer` produz conteúdo e notas estruturadas.
3. `visual_director` define tema, tipo e direção visual sem reescrever o conteúdo.
4. A revisão determinística verifica repetição, excesso de texto e consistência.

## Limites desta fase

Exportação PDF/PPTX, histórico completo, duplicação e compartilhamento pertencem à Fase 3.
