# Presentation Studio - Fase 4

## Entrega

- `presentation_coach` separado dos agentes de escrita e edição.
- Roteiro de fala para aproximadamente 30, 60 e 120 segundos por slide.
- Pontos essenciais por slide.
- Perguntas prováveis e respostas preparadas.
- Abertura e fechamento da apresentação.
- Perguntas gerais sobre o trabalho completo.
- Modo ensaio com cronômetro, progresso e navegação por teclado.
- Opção de ocultar o roteiro para treinar sem leitura.

## Persistência

O treino é salvo em `presentations.rehearsal`. A API reutiliza o conteúdo enquanto os slides não forem alterados. Uma edição posterior invalida o cache pela data de atualização do slide.

## Segurança e custo

- A geração exige sessão válida e propriedade da apresentação.
- A rota possui rate limit por usuário.
- O treinador utiliza apenas conteúdo e notas existentes.
- O treino faz parte da apresentação gerada e não consome créditos adicionais.

## Atalhos

- Setas esquerda/direita: navegar pelos slides.
- Espaço: iniciar ou pausar o cronômetro.
- Escape: retornar ao editor.
