# Aurora Design System v2 — Biblioteca de Componentes

Esta biblioteca transforma a rota `/design-system/biblioteca` em referência prática para criação de UI/UX. Ela não substitui `reference.md`; ela organiza os componentes por camada, função, estado e regra de uso.

A raiz `/design-system` deve continuar curta. Componentes, variantes, estados e fases entram nesta biblioteca operacional; a página longa completa fica em `/design-system/referencia`.

A aba `/design-system/patterns` concentra as receitas de tela. Ela existe para mostrar composições completas antes de migrar rotas reais.

Desde a Fase 3.1, essa aba funciona como Responsive Screen Lab: o mesmo pattern pode ser visto em mobile, tablet e desktop, com cenário controlável. Esses ambientes não são versões reduzidas da mesma tela; são composições específicas para cada contexto.

## Fase 2B implementada

A biblioteca mínima já existe em código e é demonstrada em `/design-system/biblioteca`.

Arquivos criados:

- `components/ui/Button.tsx`
- `components/ui/IconButton.tsx`
- `components/ui/CardSurface.tsx`
- `components/ui/Panel.tsx`
- `components/ui/Chip.tsx`
- `components/product/ReflectionCard.tsx`
- `components/product/TimelineEntryCard.tsx`
- `components/product/ThreadCard.tsx`
- `components/product/ContinueThreadButton.tsx`

## Fase 2B.1 implementada

O comportamento de flip já existe em código e é demonstrado em `/design-system/biblioteca`.

Arquivo criado:

- `components/product/FlipCard.tsx`

Regras:

- frente mostra a fala do usuário;
- verso mostra a devolutiva da Aurora;
- texto longo expande com Ver tudo antes do flip;
- flip acontece por ação explícita, nunca automático;
- foco, teclado e `prefers-reduced-motion` precisam continuar legíveis.

## Fase 2C implementada

Estados, navegação e feedback de IA já existem em código e são demonstrados em `/design-system/biblioteca`.

Arquivos criados:

- `components/ui/SegmentedTabs.tsx`
- `components/product/StreamingText.tsx`
- `components/product/BottomNav.tsx`
- `components/product/EmptyState.tsx`
- `components/product/FeedbackMicro.tsx`
- `components/product/PrivacyChip.tsx`

## Fase 3 implementada

Patterns de tela já existem em código e são demonstrados em `/design-system/patterns`.

Arquivos criados:

- `components/patterns/DiaryCapturePattern.tsx`
- `components/patterns/ReflectionResultPattern.tsx`
- `components/patterns/TimelineListPattern.tsx`
- `components/patterns/OpenThreadPattern.tsx`
- `components/patterns/EmptyThreadPattern.tsx`

## Fase 3.1 implementada

O Responsive Screen Lab já existe em código e é demonstrado em `/design-system/patterns`.

Arquivos criados:

- `components/patterns/responsive/responsive-pattern-config.ts`
- `components/patterns/responsive/ResponsivePatternFrame.tsx`
- `components/patterns/responsive/PatternControls.tsx`
- `components/patterns/responsive/ResponsivePatternLab.tsx`
- `components/patterns/responsive/ResponsivePatterns.module.css`
- `components/patterns/responsive/index.ts`

Regras:

- mobile, tablet e desktop têm composição própria;
- cenário é uma entrada de design, não só estado técnico;
- pattern pode mudar conteúdo, densidade, navegação e ação principal por ambiente;
- Diário usa a experiência de produção como default: orb como ação principal, sem botões abaixo, com textura estrelada;
- Diário pode testar exceções via controles `Ações` e `Fundo`, sem mudar o default de produção;
- controles do laboratório devem ser navegáveis: seções separadas, tablists com quebra de linha e zero sobreposição entre grupos;
- tipografia por área usa presets fechados do DS (`Produto`, `Editorial`, `Compacta`) para `Título`, `Apoio` e `Reflexão`; não é campo livre de fonte;
- Resultado deve espelhar a tela de devolutiva de produção, com orb, card de leitura e ações dentro do card;
- Timeline usa `FlipCard` como padrão; o cenário `Sem flip` existe apenas como exceção;
- a Fase 4 deve migrar telas reais comparando contra este laboratório.

Próximo passo: Fase 4, migrando `/diario`, `/timeline` e `/fios` usando esses patterns e o Responsive Screen Lab.

## Regra central

Nenhum componente existe para decorar. Todo componente precisa cumprir uma destas funções:

- ação;
- navegação;
- leitura;
- estado;
- feedback;
- confiança;
- composição de marca.

Se a função não estiver clara, o componente não deve entrar na tela.

## Arquitetura Product UI System

| Camada | Função | Exemplos |
| --- | --- | --- |
| Tokens | Base visual | `--type-screen-title`, `--surface`, `--space-4`, `--r-md` |
| UI | Primitivos reutilizáveis | `Button`, `IconButton`, `CardSurface`, `Panel`, `Chip`, `SegmentedTabs` |
| Product | Componentes Aurora | `OrbControl`, `ReflectionCard`, `TimelineEntryCard`, `ThreadCard`, `FlipCard`, `ContinueThreadButton` |
| Patterns | Receitas de tela | `DiaryCapturePattern`, `ReflectionResultPattern`, `TimelineListPattern`, `OpenThreadPattern` |
| Responsive Lab | Validação por ambiente | `ResponsivePatternLab`, `PatternControls`, `ResponsivePatternFrame` |
| Screens | Composição final | Rotas em `app/.../page.tsx` que montam padrões existentes |

Tela complexa não deve nascer artesanalmente direto em `page.tsx`. Se a peça aparece em mais de uma superfície, ela pertence à biblioteca.

Camadas de código esperadas:

- `components/ui`
- `components/product`
- `components/patterns`

## Componentes base

| Componente | Função | Variantes renderizadas | Regra de uso |
| --- | --- | --- | --- |
| `Orb` | Controle principal e assinatura viva | repouso, gravação, reflexão, resultado, erro | Controle principal no Diário; visual-chave em marketing apenas quando o contexto ensina a marca. |
| `Button` | Ação explícita | primário, secundário, ghost, perigo | Mínimo de 44px, carregamento, indisponível e foco visível. |
| `IconButton` | Ação compacta | voltar, fechar, abrir, ordenar, reproduzir | Usar ícone ou rótulo curto; manter 44px de alvo de toque. |
| `CardSurface` | Base de cards | padrão, elevado, compacto, interativo | Define glass, borda, padding e radius antes do conteúdo. |
| `Panel` | Superfície funcional | padrão, elevado, compacto | Glass com contraste; não usar como moldura decorativa. |
| `ReflectionCard` | Leitura reflexiva | compacto, expandido, resultado | Fraunces apenas no texto reflexivo. |
| `TimelineEntryCard` | Registro e devolutiva na timeline | padrão, ativo, fio | Humor discreto por ponto/chip. |
| `ThreadCard` | Síntese de fio | último momento, padrão, pergunta viva | Usar para organizar continuidade, não como card decorativo. |
| `ContinueThreadButton` | Retomar fio | idle, loading, disabled, erro | Ação de produto com estado claro e copy curta. |
| `FlipCard` | Frente e verso entre fala e devolutiva | front, back, expanded, flipped | Texto longo expande antes do flip para a devolutiva. |
| `SegmentedTabs` | Alternância de período ou visão | semana, mês, tudo | Seleção por contraste, sem disputar com o conteúdo. |
| `DataTable` | Operação/admin | admin denso | Inter, escaneável, sem hero editorial. |
| `PrivacyChip` | Sinal de confiança | local, privado, anônimo | Discreto, nunca invasivo. |

## Componentes v2 adicionados

| Componente | Função | Estados/variações | Uso obrigatório |
| --- | --- | --- | --- |
| `StreamingText` | Mostrar geração de IA em andamento | streaming, concluído | Usar cursor discreto; não criar urgência. |
| `BottomNav` | Navegação principal mobile | diário, timeline, fio, perfil | Áreas de toque de 44px; estado ativo por cor e label. |
| `EmptyState` | Orientar quando não há conteúdo | diário, timeline, fio | Copy específica; nunca usar texto genérico como "sem dados". |
| `WaitlistBlock` | Conversão com privacidade | idle, enviado, confirmado | Sempre trazer microcopy de privacidade. |
| `FeedbackMicro` | Feedback pós-insight | fez sentido, não tanto | Sem pontuação visível, sem rating invasivo. |

## Orb

Arquivo de implementação:

- `components/orb/Orb.tsx`
- `components/orb/Orb.module.css`

Estados:

| Estado técnico | Rótulo visual | Quando usar | Movimento |
| --- | --- | --- | --- |
| `idle` | Repousa | Aguardando voz ou ação principal | `breathe 4.8s + halo 5.4s` |
| `recording` | Floresce | Captura de voz ativa | `pulse 1.7s + wave 0.7-1.12s` |
| `reflecting` | Pensa | Aurora processando o registro | `spiral 14-22s + inner drift` |
| `saved` | Exala | Confirmação curta | `exhale 1.8s uma vez` |
| `disabled` | Indisponível | Ação bloqueada | movimento reduzido + glow baixo |

Anatomia:

- `Core`: gradiente canônico, sempre pelo componente real.
- `Halo`: atmosfera subordinada ao core.
- `Rings`: somente em `recording`.
- `Waveform`: somente em `recording`, com 13 barras.
- `Spiral`: somente em `reflecting`.
- `Grain`: textura sutil.

Orçamento visual:

- Um papel por viewport: marca, controle, hero canônico ou demonstração.
- No máximo um orb dominante acima de 64px fora do logo.
- Nunca usar como bullet, marcador de etapa, ícone genérico ou textura de fundo.

## Botões

Botões renderizados na galeria:

- `Voltar`: navegação secundária.
- `Avançar`: navegação secundária.
- `Abrir`: ação primária.
- `Fechar`: ação secundária.
- `Reproduzir`: ação do player.
- `Entrar`: ação do WaitlistBlock.
- `Fez sentido`: feedback positivo silencioso.
- `Não tanto`: feedback negativo silencioso.
- `Entrar no Design System`: ação da tela protegida.

Regras:

- Altura/touch target mínimo: 44px.
- Foco visível.
- Hover em 120ms.
- Estado de carregamento com texto claro e spinner discreto.
- Não usar botão como chip decorativo.

## Cards e painéis

Tipos renderizados:

- `Panel`: superfície funcional.
- `ReflectionCard`: reflexão/devolutiva.
- `TimelineEntryCard`: entrada de usuário ou Aurora.
- `ThreadCard`: último momento no fio.
- `AdminPreview`: painel operacional.
- `FlipPanel`: demonstração de frente/verso.
- `GuardrailCard`: regra numerada.
- `QaCard`: fonte e checklist.

Regras:

- Não criar cards dentro de cards.
- Glass só é aceito quando mantém contraste.
- Card de produto deve servir leitura ou ação.
- Admin usa densidade maior e Inter; não usar Fraunces em dados.

## Timeline e fio

Timeline:

- Usa logo Aurora no topo.
- Usa `SegmentedTabs`: `Semana`, `Mês`, `Tudo`.
- Intercala fala do usuário e devolutiva da Aurora.
- CTAs possíveis: `Ver tudo`, `Seu registro`, `Ver Aurora`.

Fio:

- Topo com logo e botão `Ordenar: recente`.
- Blocos obrigatórios no exemplo: `Último momento`, `Padrão do fio`, `Pergunta viva`.
- Conteúdo longo deve permanecer legível e não quebrar grid.

## FlipCard

Função:

- Mostrar frente e verso entre fala do usuário e devolutiva da Aurora.

Frente:

- Fala do usuário.
- Glass neutro.
- Borda hairline branca.
- Texto em Fraunces italic.
- Ponto de humor e data no topo.

Verso:

- Devolutiva Aurora.
- Glass aurora.
- Borda aurora.
- Mini orb/avatar.
- Texto mais claro.

Overflow:

- Texto acima de 5 linhas recebe `Ver tudo` antes do flip.
- O usuário lê tudo antes de virar.
- Expansão animada não pode quebrar grid.

## Voz, microcopy e feedback

Estados de microcopy:

| Estado | Tom | Copy |
| --- | --- | --- |
| `Idle` | Convidativo | `Quando quiser falar, é aqui.` |
| `Recording` | Presente | `Pode falar no seu tempo.` |
| `Reflecting` | Calmante | `Aurora está pensando no que você disse.` |
| `Result` | Reflexivo | `Aqui está o que Aurora notou.` |
| `Error` | Não alarmista | `Algo saiu do fluxo. Nada foi perdido.` |
| `Timeline vazia` | Acolhedor | `Seus momentos vão aparecer aqui.` |
| `Diário vazio` | Suave | `Quando quiser, é aqui.` |

FeedbackMicro:

- Usar após insight, não antes.
- Dois botões: `Fez sentido`, `Não tanto`.
- Não mostrar pontuação.
- Não transformar feedback em avaliação de performance do usuário.

## Navegação mobile

BottomNav renderizado:

- `Diário`
- `Timeline`
- `Fio`
- `Perfil`

Regras:

- Sempre 44px de área de toque.
- Estado ativo por cor e label.
- Sem ícones excessivos.
- Deve ficar legível em 390px.

## Estados vazios

EmptyState renderizado:

- Título: `Quando quiser falar, o orb está aqui.`
- Apoio: `Não precisa se preparar.`

Regras:

- Nunca usar "sem dados" no produto.
- O texto deve convidar, não cobrar.
- O estado vazio pode orientar uma ação, mas não deve pressionar.

## WaitlistBlock + PrivacyChip

Renderizado:

- Placeholder: `seu@email.com`
- Botão: `Entrar`
- Microcopy: `Dados mínimos. Sem spam, sem textos sensíveis.`

Regras:

- Sempre mostrar privacidade próxima ao campo.
- Não pedir dados além do necessário.
- Não usar linguagem de urgência.

## Logo

Variações:

- `Horizontal dark`
- `Horizontal light`
- `Mist`
- `Icon only`

Regras:

- Ícone mínimo: 24px.
- Horizontal mínimo: 80px de largura.
- Nunca encostar o logo em borda.
- Nunca distorcer.
- Nunca colocar em moldura quadrada.
- Nunca recolorir gradiente.
- Nunca usar o orb sozinho como ícone de navegação.

## Ilustrações

Cards:

- `Repouso`: timeline vazia, estado idle.
- `Transição`: entre estados, carregamento.
- `Expansão`: novo insight, resultado.
- `Gravidade`: estado ansioso, pesado.

Regras:

- Sempre abstrato.
- Nunca pessoas, rostos, símbolos médicos ou corações.
- Paleta limitada a warm, pink, blue, mint e accent.
- Orb pode aparecer como ponto focal, não como repetição decorativa.

## Motion e microinterações

Motion:

- `Breathe`: 5.8s.
- `Halo pulse`: 6s.
- `Ring`: 2.5s.
- `Wave`: 0.82s.
- `Screen enter`: 0.42s.
- `Spin slow`: 20s.

Microinterações:

- Botão: hover 120ms, foco com outline 2px e offset 3px.
- Card de diário: background +0.02, borda +0.05, texto +0.15 em 200ms.
- Carregamento: texto claro com spinner discreto.
- MoodDot: seleção persiste por cor e label.
- FeedbackMicro: estado ativo silencioso.

Reduced motion:

- Animação contínua deve parar ou virar estado estático por cor, texto e ícone.

## Admin

Regra:

- Operacional, não editorial.

Tabela de exemplo:

| Métrica | Status | Próxima ação |
| --- | --- | --- |
| Waitlist | normal | Revisar origem |
| Convites | atenção | Liberar lote 02 |
| Erros áudio | baixo | Monitorar |

Proibições:

- Headline gigante.
- Cards decorativos dominantes.
- Fraunces em dados.
- Orb como decoração de painel.

## Checklist de escolha de componente

Antes de criar uma tela, responda:

1. Qual densidade é esta superfície: marketing, produto ou operação?
2. Qual é a ação principal?
3. O orb tem papel de marca, controle, hero canônico ou demonstração?
4. Há mais de um orb dominante acima de 64px na viewport?
5. O componente escolhido já existe neste inventário?
6. A copy usa o tom presente, específico e convidativo?
7. O estado de carregamento/erro/indisponível está explícito?
8. A tela funciona em 390px sem overflow?
