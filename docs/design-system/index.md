# Aurora Design System v2

Crepúsculo / Amanhecer. Íntimo, luminoso, nunca clínico.

Este documento é a fonte canônica inicial do Design System Aurora dentro do repo. Ele consolida o pacote visual vindo do Figma e transforma esse material em regras que podem ser aplicadas no código.

## Objetivo

O DS v2 existe para:

- orientar novas telas e features;
- evitar divergência visual entre produto, landing, onboarding e admin;
- dar a agentes de IA um guardrail verificável;
- oferecer uma página consultável em `/design-system`;
- transformar o material do Figma em tokens, componentes e critérios de QA.

## Temas

### Crepúsculo

Tema padrão. Usado no produto, diário, timeline, cockpit e landing escura.

Características:

- fundo profundo;
- glass funcional;
- luz suave;
- orb como assinatura, sem repetição decorativa;
- contraste suficiente para leitura.

### Amanhecer

Tema claro. Usado em boas-vindas, documentação, estados mais abertos e materiais institucionais.

Características:

- superfície clara;
- acento menos saturado;
- texto escuro;
- sensação de abertura, sem perder intimidade.

## Tipografia

- Inter: UI, controles, formulários, nav, admin, métricas e tabelas.
- Fraunces: marca, prompt do diário, reflexões e momentos editoriais.

Fraunces não deve aparecer em dashboards, tabelas, labels operacionais ou botões.

## Hierarquia do orb

O orb fica mais forte quando tem papel único. Em qualquer viewport, escolha uma função:

- marca no lockup;
- controle principal do Diário;
- hero canônico;
- demonstração do componente Orb.

Fora do logo, usar no máximo um orb dominante acima de 64px por viewport. Se já houver orb dominante, não repetir em card, formulário, badge, ícone, bullet, textura ou fundo. Para manter atmosfera Aurora sem repetição, usar campos de luz, fitas aurora, estrelas, glass, swatches, linhas, numeração e ritmo tipográfico.

## Sistema do orb

O orb não é uma bolinha decorativa. Ele é um componente-base com anatomia, estados e movimento próprios.

Fonte de implementação:

- `components/orb/Orb.tsx`
- `components/orb/Orb.module.css`
- demonstração consultável em `/design-system#orb`

Estados canônicos:

| Estado | Nome visual | Uso | Motion |
| --- | --- | --- | --- |
| `idle` | repousa | aguardando voz ou ação principal | breathe + halo lento |
| `recording` | floresce | captura de voz ativa | rings + waveform |
| `reflecting` | pensa | organizando o registro | spiral interno + drift |
| `saved` | exala | confirmação curta | exhale uma vez |
| `disabled` | indisponível | ação bloqueada | sem convite visual |

Anatomia:

- Core: gradiente canônico e textura sutil.
- Halo: luz externa, sempre subordinada ao core.
- Rings: apenas em `recording`.
- Waveform: apenas em `recording`, 13 barras.
- Spiral: apenas em `reflecting`.
- Grain: evita aparência plástica e deve permanecer sutil.

Quando a tela mostrar o orb como componente, use o componente-base real. Não recrie uma versão paralela com outro gradiente, outro tempo ou outra estrutura.

## Superfícies

- Landing: editorial, clara no CTA, visual forte, sem promessas clínicas.
- Diário: uma ação principal, orb como controle, copy curta.
- Timeline: leitura densa, humor discreto, cards escaneáveis.
- Onboarding: educa sem parecer tutorial pesado.
- Admin: operacional, utilitário, informação primeiro.

## Cobertura da página consultável

A rota protegida `/design-system` deve funcionar como referência viva do DS, não apenas como uma lista de tokens. Ela precisa cobrir, no mínimo:

- fundamentos: cores, tipografia, espaçamento, radius e glass;
- inventário de componentes: botões, orb, cards reflexivos, timeline, abas, tabela, streaming text, bottom nav, estados vazios, bloco de waitlist, feedback micro e privacy chip;
- sistema do orb: estados, anatomia, motion, usos permitidos e usos proibidos;
- padrões por densidade: marketing, produto e operação/admin;
- exemplos reais: Diário, gravação, reflexão, timeline, fio e admin;
- voz e tom: princípios, microcopy por estado e exemplos de texto permitido/proibido;
- uso do logo: variações, tamanho mínimo, clear space e proibições;
- composições responsivas: mobile, tablet e desktop;
- FlipCard: frente, verso, overflow e regra de leitura antes do flip;
- botões, player, ilustrações, motion e microinterações.

Se alguma dessas áreas sair da página, o guardrail visual fica incompleto.

## Relação com o código

- Tokens globais vivem em `app/globals.css`.
- A referência exata da rota vive em `docs/design-system/reference.md`.
- O inventário operacional de componentes vive em `docs/design-system/component-inventory.md`.
- O brief obrigatório para criação UI/UX vive em `docs/design-system/ui-ux-creation-brief.md`.
- Motion e assets de marca vivem em `public/brand/aurora-brand.css` e `public/brand/`.
- Guardrails para agentes vivem em `docs/agent-guardrails/design-system.md`.
- A experiência consultável vive em `/design-system` e exige `DESIGN_SYSTEM_ADMIN_TOKEN`.

## Regra de atualização

Toda mudança em `/design-system` deve atualizar, na mesma entrega:

- `docs/design-system/reference.md`;
- `docs/design-system/component-inventory.md`, se houver componente, estado ou regra nova;
- `docs/design-system/ui-ux-creation-brief.md`, se a mudança alterar processo de criação;
- `docs/design-system/qa-checklist.md`, se a mudança alterar critério de validação;
- `scripts/check-design-system.mjs`, quando houver nova seção obrigatória.

## Estado atual

Esta é a fonte de referência inicial para criação UI/UX da Aurora. A migração visual das telas reais deve acontecer em ondas, com comparação visual contra o DS e sem reverter mudanças de produto existentes.
