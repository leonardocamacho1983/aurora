# Agent guardrail: Design System Aurora

Use este arquivo antes de criar, redesenhar ou revisar qualquer superfície visual da Aurora.

## Objetivo

Manter a Aurora visualmente consistente, íntima, luminosa, legível e não clínica. O design system deve orientar produto, landing, onboarding, timeline, admin, emails e materiais de criação.

## Fontes de verdade

Leia nesta ordem:

1. `docs/personas-publico-alvo-usp-comunicacao.md`
2. `docs/design-system/index.md`
3. `docs/design-system/reference.md`
4. `docs/design-system/component-inventory.md`
5. `docs/design-system/ui-ux-creation-brief.md`
6. `docs/design-system/tokens.md`
7. `docs/design-system/qa-checklist.md`
8. `docs/brand-system.md`
9. `app/globals.css`
10. `public/brand/aurora-brand.css`
11. A rota protegida `/design-system`
12. A rota protegida `/design-system/posicionamento`
13. A rota protegida `/design-system/biblioteca`
14. A rota protegida `/design-system/patterns`
15. A rota protegida `/design-system/referencia`

O pacote do Figma `Reproduzir telas.zip` foi usado como referência inicial para DS v2. O código final no repo vence sobre o pacote quando houver implementação deliberada.

## Princípios inegociáveis

- Aurora é um diário por voz com IA, não terapia, diagnóstico, emergência, coach, mascote ou chat genérico.
- A USP aprovada é: Aurora transforma o que você sente, pensa e quer colocar em prática em clareza, padrões e próximos passos, a partir da sua própria voz.
- Crepúsculo é o modo padrão. Amanhecer é usado em boas-vindas, docs e momentos mais abertos.
- O orb é assinatura central e controle principal no Diário. Ele precisa de função clara e não pode virar enfeite repetitivo.
- Inter é a fonte padrão para UI, controles, admin, formulários, métricas, tabelas e navegação.
- Fraunces é especial: marca, reflexão, prompt do diário e momentos editoriais. Não usar Fraunces em tabela, métrica ou controle operacional.
- Uma tela de produto deve ter uma ação principal clara. Evitar competição visual.
- Admin é operacional: denso, escaneável, utilitário, sem hero editorial gigante.
- Landing pode ser mais cinematográfica, mas ainda precisa de clareza, contraste e CTA único.
- Não usar cards dentro de cards.
- Não usar texto que estoura container.
- Respeitar `prefers-reduced-motion`.
- Produto, timeline, fio, conta e admin não usam escala de hero. `40px+` só entra em landing, manifesto, Design System ou exceção editorial justificada.
- Não usar `clamp()` com `vw` para texto funcional fora dos tokens tipográficos globais.

## Tokens e componentes

Use tokens semânticos de `app/globals.css` em vez de hex solto quando existir token equivalente.

### Escala tipográfica fechada

Use os tokens globais antes de qualquer `font-size` local:

| Token | Uso | Teto |
| --- | --- | --- |
| `--type-hero` | Landing, manifesto, Design System | 64px |
| `--type-screen-title` | Título principal de produto | 32px |
| `--type-mobile-title` | Título principal em mobile | 28px |
| `--type-section-title` | Seções e padrões | 24px |
| `--type-card-title` | Cards, sheets e painéis | 18px |
| `--type-body` | Texto funcional | 16px |
| `--type-meta` | Status e labels | 13px |
| `--type-reflection` | Texto reflexivo comum | 22px |
| `--type-reflection-feature` | Destaque reflexivo controlado | 28px |

Rejeite a entrega se uma tela de produto usar título gigante por padrão, se um card tiver título acima de 18px sem motivo, ou se admin parecer landing page.

### Product UI System

Aurora usa design atômico de forma pragmática:

1. `tokens`: cor, tipo, spacing, radius e motion.
2. `components/ui`: primitivos como Button, IconButton, CardSurface, Panel, Chip, Tabs, EmptyState e LoadingState.
3. `components/product`: componentes Aurora com linguagem e estado, como OrbControl, ReflectionCard, TimelineEntryCard, ThreadCard, FlipCard e ContinueThreadButton.
4. `components/patterns`: receitas reutilizáveis, como DiaryCapture, ReflectionResult, TimelineList, OpenThread e EmptyThread.
5. `components/patterns/responsive`: Responsive Screen Lab para validar ambiente e cenário.
6. `app/.../page.tsx`: composição final, dados e rota.

Não criar tela complexa artesanalmente direto em `page.tsx`. Se uma peça aparece em mais de uma superfície, ela pertence à biblioteca e deve estar documentada em `/design-system/biblioteca`.

Fase 2B já está implementada. Antes de criar versões locais, reutilize:

- `components/ui/Button.tsx`
- `components/ui/IconButton.tsx`
- `components/ui/CardSurface.tsx`
- `components/ui/Panel.tsx`
- `components/ui/Chip.tsx`
- `components/product/ReflectionCard.tsx`
- `components/product/TimelineEntryCard.tsx`
- `components/product/ThreadCard.tsx`
- `components/product/ContinueThreadButton.tsx`
- `components/product/FlipCard.tsx`

Fase 2B.1 já está implementada. Use `FlipCard` para frente/verso entre fala do usuário e devolutiva da Aurora; não recrie flip local em uma tela.

Fase 2C já está implementada. Antes de criar versões locais, reutilize:

- `components/ui/SegmentedTabs.tsx`
- `components/product/StreamingText.tsx`
- `components/product/BottomNav.tsx`
- `components/product/EmptyState.tsx`
- `components/product/FeedbackMicro.tsx`
- `components/product/PrivacyChip.tsx`

Fase 3 já está implementada. Antes de montar telas complexas direto em rota, reutilize:

- `components/patterns/DiaryCapturePattern.tsx`
- `components/patterns/ReflectionResultPattern.tsx`
- `components/patterns/TimelineListPattern.tsx`
- `components/patterns/OpenThreadPattern.tsx`
- `components/patterns/EmptyThreadPattern.tsx`

A aba `/design-system/patterns` mostra esses patterns renderizados como telas.

Fase 3.1 já está implementada. Antes de migrar tela real, confira o Responsive Screen Lab em `/design-system/patterns`:

- `components/patterns/responsive/responsive-pattern-config.ts`
- `components/patterns/responsive/ResponsivePatternFrame.tsx`
- `components/patterns/responsive/PatternControls.tsx`
- `components/patterns/responsive/ResponsivePatternLab.tsx`

Regra: mobile, tablet e desktop não são versões reduzidas ou expandidas da mesma tela. Cada ambiente pode mudar densidade, navegação, foco de ação, presença de contexto lateral e quantidade de informação visível.

Regras de paridade da Fase 3.1:

- Diário no lab começa sem botões abaixo do orb, com fundo estrelado e ProductNav, como a produção atual.
- Os controles `Ações` e `Fundo` do Diário existem para testar exceções futuras, não para mudar o default.
- Controles do lab precisam ser navegáveis em desktop, tablet e mobile: separar seções, permitir quebra de linha e rejeitar tablist sobreposto.
- Tipografia por área no lab usa presets fechados do DS (`Produto`, `Editorial`, `Compacta`) para `Título`, `Apoio` e `Reflexão`; não criar seletor de fonte livre.
- Resultado no lab deve espelhar a tela real de devolutiva do Diário.
- Timeline no lab usa `FlipCard` como padrão; `Sem flip` é cenário de exceção.

## Hierarquia do orb

Antes de usar o orb, defina seu papel na viewport:

- Marca: aparece apenas dentro do logo/lockup.
- Controle: ação principal do Diário, como gravar, parar, continuar ou refletir.
- Hero canônico: demonstração visual central em landing ou página do próprio DS.
- Demonstração: exemplo pequeno quando o componente em discussão é o próprio orb.

Regra operacional:

- Fora do logo, use no máximo um orb dominante acima de 64px por viewport.
- Se já existe um orb dominante, formulário, card, lista, step, badge e fundo não podem usar orb.
- Nunca usar orb como bullet, ícone genérico, textura de fundo ou decoração para preencher espaço.
- Quando a tela precisar de atmosfera Aurora sem outro orb, use campos de luz, fitas aurora, estrelas, glass, swatches, linhas, numeração ou tipografia.
- Pergunta obrigatória para agentes: "qual função este orb cumpre aqui?". Se a resposta for "decorar", remova.

## Estados e motion do orb

O orb é um componente-base vivo. Quando a tela precisar mostrar o componente, use `components/orb/Orb.tsx` em vez de recriar um gradiente local.

Estados canônicos:

- `idle`: repousa, aguardando voz ou ação principal.
- `recording`: floresce, com rings e waveform.
- `reflecting`: pensa, com spiral interno lento.
- `saved`: exala, confirmação curta.
- `disabled`: indisponível, sem convite visual.

Regras:

- Rings e waveform pertencem apenas ao estado `recording`.
- Spiral pertence apenas ao estado `reflecting`.
- O estado `saved` deve ser curto e não virar animação permanente.
- Qualquer motion precisa respeitar `prefers-reduced-motion`.
- A rota `/design-system/referencia#orb` deve mostrar os estados vivos. Se ela virar apenas texto, o guardrail está incompleto.

Componentes novos devem preferir um componente-base Aurora reutilizável antes de criar estilos locais:

- Brand lockup
- Orb
- Button
- IconButton
- CardSurface
- Panel/Card
- ReflectionCard
- TimelineEntryCard
- ThreadCard
- FlipCard
- ContinueThreadButton
- MoodDot
- SegmentedTabs
- DataTable
- Notice/Error
- Waitlist block
- Privacy chip

Se um componente-base ainda não existir, crie uma versão reutilizável quando o padrão aparecer em mais de uma superfície.

## Cobertura obrigatória do DS consultável

O DS consultável não pode ser apenas uma vitrine bonita. Ele precisa funcionar como guarda-corpo de criação para humanos e agentes. A raiz `/design-system` deve ser um hub curto; a cobertura completa fica distribuída entre:

- `/design-system`: portal do Aurora Product System, com entrada para execução visual e entrada para estratégia.
- `/design-system/posicionamento`: público-alvo, definição, USP, promessas permitidas e promessas proibidas.
- `/design-system/fundamentos`: tokens, cores e tipografia.
- `/design-system/biblioteca`: componentes e fases.
- `/design-system/patterns`: patterns de tela.
- `/design-system/referencia`: página completa de auditoria.
- `/design-system/roadmap`: sequência de componentização, patterns e migração.

Antes de usar o DS como referência, confirme que o conjunto dessas rotas mostra:

- posicionamento: definição, USP, público-alvo, o que Aurora é/não é e regras de comunicação;
- fundamentos: cor, tipografia, espaçamento, radius e glass;
- Product UI System: tokens, UI, product, patterns e screens;
- Biblioteca de Componentes com camada, nome, variantes e regra de uso;
- inventário completo de componentes e estados;
- orb vivo com estados, motion, anatomia e regra de orçamento visual;
- exemplos reais de Diário, gravação, reflexão, timeline, fio e admin;
- voz, tom e microcopy por estado;
- uso correto do logo, área de respiro e proibições;
- composições responsivas para mobile, tablet e desktop;
- FlipCard com frente, verso, overflow e leitura antes do flip;
- botões, player, ilustrações, motion e microinterações.

Se algum desses blocos faltar, o agente deve tratar como lacuna do guardrail, não como detalhe opcional.

## Paridade obrigatória

`docs/design-system/reference.md` deve refletir a rota `/design-system/referencia`. Não trate a documentação como resumo. Ela precisa capturar os elementos que aparecem na página completa: tela protegida, nav, hero, fundamentos, Product UI System, Biblioteca de Componentes, componentes, orb, padrões, exemplos reais, voz, logo, novos componentes, composições, FlipCard, botões, ilustrações, movimento, microinterações, guardrails e QA.

Toda alteração visual relevante deve passar por `npm run design-system:check`, que verifica a presença das rotas focadas, dos arquivos de referência e dos principais blocos de paridade.

## Densidades

- Marketing: maior escala, mais espaço, visual cinemático, CTA único.
- Product: hierarquia calma, uma ação principal, orb como foco quando fizer sentido.
- Operations/Admin: Inter, tabelas, listas, métricas, pouco ornamento, informação primeiro.

## Proibições

- Não adicionar símbolos médicos, linguagem clínica ou promessa de cura.
- Não criar mascote.
- Não trocar a assinatura por outro logo.
- Não distorcer o orb.
- Não multiplicar o orb em logo, hero, card, ícone e fundo na mesma viewport.
- Não usar o orb como bullet ou ícone genérico em listas de cards.
- Não usar gradients roxo-azul genéricos fora da paleta Aurora.
- Não criar CTA, dado, métrica ou promessa sem fonte no produto.
- Não enviar email, nome, transcrição, reflexão, áudio ou respostas abertas para analytics.

## Checklist para agentes

Antes de entregar:

1. Conferir se a superfície usa tokens do DS.
2. Conferir Inter/Fraunces conforme regra de uso.
3. Conferir se a escala tipográfica usa tokens e não escala de hero em produto.
4. Conferir se a tela foi montada pela camada correta do Product UI System.
5. Conferir contraste e foco visível.
6. Conferir mobile em 390px.
7. Conferir tablet em 768px.
8. Conferir desktop em largura larga.
9. Conferir se motion respeita reduced motion.
10. Conferir se não há overflow de texto.
11. Conferir se a tela continua fiel à Aurora: diário por voz, calma, privacidade e clareza.
12. Conferir se a promessa da tela está alinhada com `docs/personas-publico-alvo-usp-comunicacao.md`.

Qualquer desvio deve ser descrito no handoff.
