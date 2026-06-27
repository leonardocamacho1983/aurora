# Aurora Design System v2 — brief de criação UI/UX

Use este brief antes de criar, redesenhar ou revisar qualquer tela da Aurora. Ele transforma a referência do DS em um processo de decisão para produto, landing, onboarding e operação.

## Ordem obrigatória de leitura

1. `docs/design-system/reference.md`
2. `docs/design-system/component-inventory.md`
3. `docs/design-system/tokens.md`
4. `docs/design-system/qa-checklist.md`
5. `docs/agent-guardrails/design-system.md`

Não criar tela nova sem ler esses arquivos quando o trabalho for visual.

## Primeiro diagnóstico

Classifique a superfície antes de desenhar:

| Tipo | Densidade | Regra |
| --- | --- | --- |
| Marketing / landing | Editorial, mais espaço, visual forte | CTA único, promessa clara, sem linguagem clínica. |
| Produto / Diário | Calmo, funcional, uma ação principal | Orb pode ser controle principal; texto curto; estados claros. |
| Timeline / Fio | Leitura densa e íntima | Cards intercalados, Fraunces só no texto reflexivo, humor discreto. |
| Onboarding | Educativo sem parecer tutorial pesado | Explica diferença entre Aurora e chat genérico. |
| Admin / operação | Utilitário e denso | Inter, tabelas, métricas, diagnósticos; sem hero editorial. |

Se a tela mistura duas densidades, escolha a dominante. Não tente fazer marketing dentro do admin nem admin dentro do Diário.

## Product UI System

Antes de criar uma tela, escolha a camada de engenharia:

| Camada | Quando usar | Regra |
| --- | --- | --- |
| Tokens | Cor, tipo, espaçamento, radius e motion | Não inventar valores soltos quando existir token. |
| UI | Botão, card-base, painel, chip, input, tabs | Primitivo não carrega regra profunda de produto. |
| Product | OrbControl, ReflectionCard, TimelineEntryCard, ThreadCard, FlipCard | Carrega linguagem, estados e comportamento Aurora. |
| Patterns | Diário, resultado, timeline, fio aberto, vazio | Combina componentes para evitar tela artesanal. |
| Responsive Lab | Mobile, tablet, desktop e cenário | Testa telas inteiras antes da migração real. |
| Screens | `app/.../page.tsx` | Monta padrões existentes e coordena dados/rotas. |

Regra operacional:

- Não criar tela complexa direto em `page.tsx`.
- Se faltar componente recorrente, criar primeiro na camada `components/ui` ou `components/product`.
- Se faltar composição recorrente, criar em `components/patterns`.
- Toda peça nova precisa aparecer em `/design-system/biblioteca` ou ser registrada como lacuna explícita no handoff.
- A rota `/design-system` permanece hub curto; referência longa fica em `/design-system/referencia`.

Fase 2B disponível:

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

Fase 2B.1 disponível: `FlipCard` para frente/verso entre fala do usuário e devolutiva da Aurora, com expansão antes do flip.

Fase 2C disponível:

- `components/ui/SegmentedTabs.tsx`
- `components/product/StreamingText.tsx`
- `components/product/BottomNav.tsx`
- `components/product/EmptyState.tsx`
- `components/product/FeedbackMicro.tsx`
- `components/product/PrivacyChip.tsx`

Fase 3 disponível:

- `components/patterns/DiaryCapturePattern.tsx`
- `components/patterns/ReflectionResultPattern.tsx`
- `components/patterns/TimelineListPattern.tsx`
- `components/patterns/OpenThreadPattern.tsx`
- `components/patterns/EmptyThreadPattern.tsx`

Fase 3.1 disponível:

- `components/patterns/responsive/responsive-pattern-config.ts`
- `components/patterns/responsive/ResponsivePatternFrame.tsx`
- `components/patterns/responsive/PatternControls.tsx`
- `components/patterns/responsive/ResponsivePatternLab.tsx`

Use o Responsive Screen Lab em `/design-system/patterns` antes de migrar uma rota real.

Regras atuais do laboratório:

- `DiaryCapturePattern` começa como a produção atual: fundo estrelado, ProductNav, orb como controle principal e sem botões abaixo do orb.
- Os controles `Ações` e `Fundo` existem para testar exceções futuras do Diário; não são o default.
- Os controles do Responsive Screen Lab devem ser divididos por seção e nunca podem sobrepor outro grupo.
- A tipografia por área do laboratório usa presets fechados do DS (`Produto`, `Editorial`, `Compacta`) para `Título`, `Apoio` e `Reflexão`.
- `ReflectionResultPattern` deve seguir a estrutura de produção da devolutiva: orb, card de leitura, leitura inteira e ações dentro do card.
- `TimelineListPattern` usa `FlipCard` como padrão; `Sem flip` é cenário de exceção.

Próximo passo do sistema: Fase 4, migrando rotas reais a partir dos patterns e do laboratório responsivo.

## Regra do orb

Antes de usar o orb, escreva a função dele:

- `marca`: apenas no logo/lockup;
- `controle`: ação principal de falar, parar, continuar ou refletir;
- `hero canônico`: página que ensina a assinatura visual;
- `demonstração`: quando o assunto é o próprio componente Orb.

Proibições:

- Não usar o orb como bullet.
- Não usar o orb como ícone de card.
- Não usar o orb como marcador de etapa.
- Não usar o orb como textura de fundo.
- Não repetir orb dominante em logo, hero, formulário e card ao mesmo tempo.

Regra prática:

- Fora do logo, no máximo um orb acima de 64px por viewport.
- Se já existe orb dominante, use luz, linhas, amostras de cor, estrelas, glass ou tipografia para manter atmosfera.

## Escolha de componentes

Escolha componentes nesta ordem:

1. `Orb` quando a tela precisa de ação principal por voz ou demonstração do estado emocional.
2. `Button` para ação clara.
3. `SegmentedTabs` para alternar período/visão.
4. `ReflectionCard` para devolutiva reflexiva.
5. `TimelineEntryCard` para fala do usuário ou registro.
6. `FlipCard` para frente/verso entre fala e devolutiva.
7. `StreamingText` para geração de IA.
8. `FeedbackMicro` para coleta silenciosa após insight.
9. `BottomNav` para navegação mobile.
10. `EmptyState` para ausência de conteúdo.
11. `WaitlistBlock + PrivacyChip` para conversão com confiança.
12. `DataTable` para admin.

Se o componente não está no inventário, só crie novo quando:

- o padrão aparece em mais de uma superfície;
- há estado, regra e variação claros;
- o componente não duplica algo existente com outro nome.

## Layout por breakpoint

Mobile, tablet e desktop não são versões reduzidas ou expandidas da mesma tela. Desenhe a intenção de cada ambiente antes de ajustar CSS.

Mobile 390px:

- Sem overflow horizontal.
- Orb centralizado quando for controle principal.
- BottomNav visível quando for produto mobile.
- Botões com 44px de área de toque.
- Texto com linha curta, sem headline gigante em painel compacto.

Tablet 768px:

- Split 50/50 quando houver visual e conteúdo.
- Orb à esquerda, conteúdo à direita, se a tela for produto/editorial.
- Navegação no topo.

Desktop 1440px:

- Orb pode ser âncora lateral esquerda.
- Conteúdo à direita.
- Barra de navegação no topo.
- Sem sidebar por padrão no DS v2.

Regra de laboratório:

- O pattern deve aceitar `viewport` e `scenario` quando fizer parte da Fase 3.1.
- Cenário controla estado de produto, como gravação, streaming, flip, erro ou fio vazio.
- A mudança de ambiente pode alterar navegação, grid, quantidade de contexto e ação principal.

Admin:

- Métricas primeiro.
- Diagnósticos depois.
- Tabelas por último.
- Sem hero editorial.

## Tipografia

Inter:

- UI.
- Controles.
- Formulários.
- Navegação.
- Admin.
- Métricas.
- Tabelas.
- Labels.

Fraunces:

- Marca.
- Prompt do Diário.
- Texto reflexivo.
- Momentos editoriais controlados.

Não usar Fraunces em:

- botão;
- métrica;
- tabela;
- label operacional;
- status;
- nav;
- admin.

Escala obrigatória:

| Uso | Token | Escala |
| --- | --- | --- |
| Hero | `--type-hero` | 56-64px |
| Título de produto | `--type-screen-title` | 28-32px |
| Título mobile | `--type-mobile-title` | 24-28px |
| Título de seção | `--type-section-title` | 20-24px |
| Título de card | `--type-card-title` | 16-18px |
| Corpo | `--type-body` | 15-16px |
| Meta | `--type-meta` | 11-13px |
| Reflexão | `--type-reflection` | 18-22px |
| Reflexão em destaque | `--type-reflection-feature` | 24-28px |

Proibições de escala:

- Não usar escala de hero em produto, timeline, fio, conta ou admin.
- Não usar `40px+` em Diário, Timeline, Fio, Conta ou Admin.
- Não usar `clamp()` com `vw` para texto funcional fora dos tokens globais.
- Não usar `text-4xl`, `text-5xl`, `text-6xl` ou equivalentes em produto sem justificativa explícita.
- Título dentro de card não passa de `--type-card-title`.

## Voz e microcopy

Aurora fala:

- com calma;
- sem urgência;
- sem julgamento;
- de forma específica;
- com convite, não obrigação.

Trocas obrigatórias:

| Evite | Use |
| --- | --- |
| `Fale agora para não perder o momento.` | `Quando quiser falar, é aqui.` |
| `Você parece muito estressado.` | `Você mencionou cansaço três vezes.` |
| `Continue para completar seu passado.` | `Você pode continuar ou pausar aqui.` |
| `Sem dados.` | `Quando quiser falar, o orb está aqui.` |
| `Erro inesperado.` | `Algo saiu do fluxo. Nada foi perdido.` |

Estados padrão:

- Idle: `Quando quiser falar, é aqui.`
- Recording: `Pode falar no seu tempo.`
- Reflecting: `Aurora está pensando no que você disse.`
- Result: `Aqui está o que Aurora notou.`
- Error: `Algo saiu do fluxo. Nada foi perdido.`

## Motion

Movimento deve parecer respiração, não performance.

Use:

- `Breathe` para calma.
- `Halo pulse` como presença de fundo.
- `Ring` para atenção durante gravação/reflexão.
- `Wave` para presença durante gravação.
- `Screen enter` para transição entre telas.
- `Spin slow` para processamento contemplativo.

Não use:

- bounce exagerado;
- spring chamativo;
- loader agressivo;
- movimento contínuo sem suporte a `prefers-reduced-motion`;
- rings/waveform fora do estado `recording`;
- spiral fora do estado `reflecting`.

## Ilustração

Ilustração Aurora:

- abstrata;
- luminosa;
- baseada no gradiente do orb;
- sem pessoas;
- sem rostos;
- sem símbolos médicos;
- sem corações;
- sem paleta externa.

Use os estados:

- Repouso.
- Transição.
- Expansão.
- Gravidade.

## Privacidade e segurança de promessa

Não prometer:

- terapia;
- diagnóstico;
- cura;
- tratamento;
- suporte emergencial;
- interpretação definitiva da pessoa.

Não enviar para analytics:

- email;
- nome;
- áudio;
- transcrição;
- reflexão;
- resposta aberta;
- conteúdo sensível.

Sempre que pedir dado:

- explicar o mínimo necessário;
- usar microcopy de privacidade;
- evitar urgência;
- evitar promessa clínica.

## Processo de criação

1. Identifique a superfície.
2. Escolha densidade.
3. Escolha a ação principal.
4. Defina o papel do orb.
5. Escolha componentes do inventário.
6. Escreva microcopy por estado.
7. Aplique tokens do DS.
8. Verifique mobile 390px.
9. Verifique desktop largo.
10. Rode `npx tsc --noEmit`.
11. Rode `npm run design-system:check`.

## Critério de rejeição

Rejeite a tela se qualquer item abaixo for verdadeiro:

- A tela usa orb como enfeite.
- Há mais de um orb dominante acima de 64px fora do logo.
- A tela parece uma coleção de cards soltos.
- Há card dentro de card.
- Admin parece landing.
- Produto parece dashboard operacional.
- Copy tem urgência artificial.
- Falta acento em texto visível.
- Há overflow horizontal em 390px.
- O estado de erro, carregamento ou indisponível não está claro.
- O DS foi citado, mas componentes e regras não foram seguidos.

## Handoff esperado

Ao entregar uma tela visual, informe:

- superfície e densidade escolhidas;
- papel do orb;
- componentes usados;
- estados cobertos;
- decisões de motion;
- resultado em mobile e desktop;
- comandos de validação rodados.
