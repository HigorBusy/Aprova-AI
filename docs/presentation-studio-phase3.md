# Presentation Studio - Fase 3

## Entrega

- Biblioteca com apresentações ordenadas pela última edição.
- Reabertura de planos e apresentações geradas.
- Renomear no cabeçalho do editor.
- Duplicação atômica sem consumo de créditos.
- Exclusão com confirmação explícita.
- Exportação autenticada para PDF e PPTX.
- Notas do apresentador e fontes incorporadas ao PPTX.
- Link público revogável em modo somente leitura.
- Navegação por teclado e modo de apresentação no link compartilhado.

## Segurança

- Exportações exigem sessão, propriedade e status `generated`.
- A leitura pública usa token UUID e consulta no servidor com `is_public = true`.
- As tabelas continuam sem acesso anônimo.
- O link pode ser desativado sem apagar a apresentação.
- A duplicação usa `SECURITY INVOKER`, preservando RLS e propriedade.

## Custos

Histórico, renomear, duplicar, exportar e compartilhar não consomem créditos.

## Próxima fase

Treino de apresentação, falas por duração, perguntas prováveis e modo ensaio pertencem à Fase 4.
