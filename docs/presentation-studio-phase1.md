# Presentation Studio - auditoria e Fase 1

## Auditoria do estado anterior

O gerador existente estava acoplado ao Tutor IA. Um formulário enviava um pedido para um único endpoint, recebia um deck fixo voltado a planos de estudo e baixava imediatamente um PDF em base64. O histórico guardava apenas metadados dentro de `ai_messages`.

Funcionava:

- autenticação e verificação de créditos no backend;
- geração JSON pela Groq;
- PDF imediato no fluxo legado;
- histórico leve sem armazenar o base64 do arquivo.

Superficial ou ausente:

- não havia plano para aprovação;
- o documento não existia como entidade editável;
- slides não tinham persistência individual;
- não havia preview nem edição manual;
- os layouts eram variações de texto, sem tipos semânticos reutilizáveis;
- o chat era o produto, em vez de servir ao documento.

## Arquitetura adotada

O fluxo novo é independente do chat legado:

1. `presentation_planner` entende o pedido e faz no máximo três perguntas essenciais.
2. O plano é normalizado em contrato TypeScript e salvo como `planned`.
3. O usuário edita ordem, tipo, título e intenção de cada slide.
4. `slide_writer` recebe somente o plano aprovado e devolve objetos estruturados.
5. Uma revisão determinística verifica repetição, excesso de texto e pouca variedade.
6. Uma função transacional salva slides e desconta 10 créditos no mesmo commit.
7. O editor altera apenas o slide selecionado e salva automaticamente com RLS.

Responsabilidades futuras já têm fronteira definida: `visual_director`, `presentation_reviewer` com revisão semântica e `presentation_editor` por IA entram nas fases seguintes. Não foram simulados nesta fase.

## Schema

`presentations` guarda pedido, contexto, plano aprovado, status e metadados.

`presentation_slides` guarda cada slide com ordem, tipo, título, subtítulo, conteúdo, direção visual, notas e fontes.

As duas tabelas usam RLS por `auth.uid()`. A RPC `complete_presentation_generation` valida propriedade, quantidade de slides, custo exato e saldo; crédito, transação, slides e status são gravados atomicamente.

## UI da Fase 1

- Home dedicada em `/apresentacoes`, sem saudação de chatbot.
- Pedido com exemplos, público, duração e tom.
- Perguntas mínimas quando necessárias.
- Plano editável com adicionar, remover e reordenar slides.
- Geração somente após aprovação explícita.
- Editor desktop com miniaturas, canvas e propriedades.
- Layout responsivo: miniaturas horizontais e edição abaixo do preview no mobile.
- Autosave de título, subtítulo, corpo e tipo do slide.

## Limites intencionais

Exportação PDF/PPTX, histórico, compartilhamento, temas completos, notas visíveis, edição por IA e modo de ensaio pertencem às Fases 2 a 4. O gerador PDF legado foi preservado, mas não é usado pelo novo estúdio para evitar transformar o resultado novamente em um arquivo sem edição.
