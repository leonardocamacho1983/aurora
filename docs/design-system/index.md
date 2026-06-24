# Aurora Design System v2

Crepúsculo / Amanhecer. Íntimo, luminoso, nunca clínico.

Este documento é a fonte canônica inicial do Design System Aurora dentro do repo. Ele consolida o pacote visual vindo do Figma e transforma esse material em regras que podem ser aplicadas no código.

## Objetivo

O Aurora Product System existe para:

- manter estratégia de produto e execução visual conectadas, sem misturar os dois assuntos;
- orientar novas telas e features;
- evitar divergência visual entre produto, landing, onboarding e admin;
- dar a agentes de IA um guardrail verificável;
- oferecer um portal consultável em `/design-system`, com páginas focadas por função;
- transformar o material do Figma em tokens, componentes e critérios de QA.

Antes de criar uma tela, escrever uma copy ou propor uma feature, consulte:

1. `/design-system/posicionamento` ou `docs/personas-publico-alvo-usp-comunicacao.md` para confirmar público, promessa, limites e linguagem.
2. `/design-system/fundamentos`, `/design-system/biblioteca` e `/design-system/patterns` para executar interface com tokens, componentes e padrões corretos.

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

Escala fechada:

| Uso | Token | Escala | Regra |
| --- | --- | --- | --- |
| Hero Display | `--type-hero` | 56-64px | Apenas landing, manifesto e Design System. |
| Product ScreenTitle | `--type-screen-title` | 28-32px | Produto, no máximo um por tela. |
| Mobile ScreenTitle | `--type-mobile-title` | 24-28px | Título curto em 390px. |
| SectionTitle | `--type-section-title` | 20-24px | Seções e padrões. |
| CardTitle | `--type-card-title` | 16-18px | Cards, sheets e painéis. |
| Body | `--type-body` | 15-16px | Leitura padrão. |
| Meta | `--type-meta` | 11-13px | Status e labels. |
| Reflection | `--type-reflection` | 18-22px | Texto reflexivo comum. |
| Reflection Feature | `--type-reflection-feature` | 24-28px | Destaque reflexivo controlado. |

Produto, timeline, fio, conta e admin não usam escala de hero. `40px+` é exceção editorial, não padrão de produto.

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
- demonstração consultável em `/design-system/referencia#orb`

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

## Product UI System

Aurora usa uma variação pragmática de design atômico:

| Camada | Função | Regra |
| --- | --- | --- |
| Tokens | Base visual | Cor, tipografia, spacing, radius e motion. |
| UI | Primitivos | Componentes pequenos, sem regra profunda de produto. |
| Product | Componentes Aurora | Peças com comportamento, linguagem e estados do produto. |
| Patterns | Receitas reutilizáveis | Combinações que destravam telas complexas. |
| Responsive Lab | Validação por ambiente | Mobile, tablet e desktop como composições específicas. |
| Screens | Composição final | Pages montam padrões existentes. |

Nenhuma tela complexa nova deve nascer artesanalmente direto em `page.tsx`. Se faltar uma peça, crie a peça reutilizável, documente em `/design-system/biblioteca` e só então use na tela.

## Cobertura consultável

A rota protegida `/design-system` funciona como portal do Aurora Product System. A cobertura completa fica dividida em páginas focadas:

- `/design-system`: entrada por tarefa, orb hero canônico, regras críticas e próximo encaixe.
- `/design-system/posicionamento`: público-alvo, definição, USP, promessas permitidas e promessas proibidas.
- `/design-system/fundamentos`: cores, tipografia, espaçamento, radius e glass.
- `/design-system/biblioteca`: camada, nome, variantes e regra de uso de cada componente.
- `/design-system/patterns`: Responsive Screen Lab com patterns de tela renderizados por ambiente e cenário antes da migração das rotas reais.
- `/design-system/referencia`: referência completa para auditoria visual e paridade.
- `/design-system/roadmap`: fases de componentização, patterns e migração.

Como conjunto, essas rotas precisam cobrir, no mínimo:

- posicionamento: definição, USP, público-alvo, o que Aurora é/não é e regras de comunicação;
- fundamentos: cores, tipografia, espaçamento, radius e glass;
- Product UI System: tokens, UI, product, patterns e screens;
- Biblioteca de Componentes: camada, nome, variantes e regra de uso de cada componente;
- inventário de componentes: botões, orb, cards reflexivos, timeline, abas, tabela, streaming text, bottom nav, estados vazios, bloco de waitlist, feedback micro e privacy chip;
- sistema do orb: estados, anatomia, motion, usos permitidos e usos proibidos;
- padrões por densidade: marketing, produto e operação/admin;
- exemplos reais: Diário, gravação, reflexão, timeline, fio e admin;
- voz e tom: princípios, microcopy por estado e exemplos de texto permitido/proibido;
- uso do logo: variações, tamanho mínimo, clear space e proibições;
- composições responsivas: mobile, tablet e desktop, sem tratar um ambiente como versão reduzida do outro;
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
- Posicionamento canônico vive em `docs/personas-publico-alvo-usp-comunicacao.md`.
- A experiência consultável vive em `/design-system`, `/design-system/posicionamento`, `/design-system/fundamentos`, `/design-system/biblioteca`, `/design-system/patterns`, `/design-system/referencia` e `/design-system/roadmap`; todas exigem `DESIGN_SYSTEM_ADMIN_TOKEN`.

## Regra de atualização

Toda mudança em qualquer rota do Design System deve atualizar, na mesma entrega:

- `docs/personas-publico-alvo-usp-comunicacao.md`, se a mudança alterar promessa, público, explicação ou posicionamento;
- `docs/design-system/reference.md`;
- `docs/design-system/component-inventory.md`, se houver componente, estado ou regra nova;
- `docs/design-system/ui-ux-creation-brief.md`, se a mudança alterar processo de criação;
- `docs/design-system/qa-checklist.md`, se a mudança alterar critério de validação;
- `scripts/check-design-system.mjs`, quando houver nova seção obrigatória.

## Estado atual

Fase 2B implementada: a biblioteca mínima já existe em `components/ui` e `components/product`, com demonstração em `/design-system/biblioteca`.

Fase 2B.1 implementada: `components/product/FlipCard.tsx` cobre frente, verso, expansão antes do flip, foco, teclado e `prefers-reduced-motion`.

Fase 2C implementada: `SegmentedTabs`, `StreamingText`, `BottomNav`, `EmptyState`, `FeedbackMicro` e `PrivacyChip` já existem e são demonstrados em `/design-system/biblioteca`.

Fase 3 implementada: `DiaryCapturePattern`, `ReflectionResultPattern`, `TimelineListPattern`, `OpenThreadPattern` e `EmptyThreadPattern` já existem em `components/patterns` e são demonstrados em `/design-system/patterns`.

Fase 3.1 implementada: `ResponsivePatternLab`, `PatternControls`, `ResponsivePatternFrame` e `responsive-pattern-config` já existem em `components/patterns/responsive` e permitem alternar mobile, tablet, desktop e cenário na aba `/design-system/patterns`.

Próximo passo: Fase 4, migrando `/diario`, `/timeline` e `/fios` em ondas, com comparação visual contra o DS, contra o Responsive Screen Lab e sem reverter mudanças de produto existentes.
