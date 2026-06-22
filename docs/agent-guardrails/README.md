# Agent guardrails

Este diretório guarda instruções permanentes para agentes de IA que criam, editam ou revisam a Aurora.

Um agent guardrail não é uma documentação genérica. Ele é um contrato de execução: o que um agente deve ler antes de trabalhar, quais fontes vencem em caso de conflito, quais decisões já estão fechadas e quais verificações precisam acontecer antes de entregar uma mudança.

## Estrutura

Cada arquivo cobre um domínio:

- `design-system.md`: identidade visual, componentes, tokens, densidade, motion e QA visual.
- `copy-positioning.md`: voz, posicionamento, promessas permitidas e proibidas.
- `product-analytics.md`: eventos, privacidade, propriedades permitidas e limites de coleta.
- `onboarding.md`: boas-vindas, educação de uso e diferença entre Aurora e chat genérico.
- `admin.md`: cockpit operacional, densidade, CSV, abas e limites de dados.

Nem todos esses arquivos precisam existir desde o primeiro dia. Esta pasta deve crescer conforme cada domínio ganhar regras duráveis.

## Regra de uso

Antes de alterar uma superfície relevante, o agente deve:

1. Ler o guardrail do domínio.
2. Ler as fontes de verdade apontadas no guardrail.
3. Preservar as decisões já fechadas.
4. Explicitar qualquer desvio necessário.
5. Verificar a entrega com os critérios do próprio guardrail.

## Ordem de precedência

Quando houver conflito entre materiais:

1. Código de produção atual, quando a pergunta for sobre comportamento real.
2. Guardrail específico do domínio.
3. Documento canônico do domínio em `docs/`.
4. Briefs, specs, screenshots e pacotes de referência.
5. Preferências gerais ou memória histórica.

Se o pacote de referência e o código discordarem, a mudança deve ser tratada como migração deliberada, não como correção invisível.
