# Design System QA checklist

Use este checklist antes de publicar uma tela nova ou uma mudança visual relevante.

## Tokens

- [ ] A tela usa tokens do DS quando há equivalentes.
- [ ] Hex direto aparece apenas em assets, exceções documentadas ou CSS de compatibilidade.
- [ ] Orb usa `--aurora` ou `.orb-gradient`.
- [ ] Orb respeita o orçamento visual: no máximo um orb dominante fora do logo por viewport.
- [ ] Orb não aparece como bullet, ícone genérico, textura de fundo ou enfeite de card/formulário.
- [ ] Quando o orb aparece como componente, ele usa `components/orb/Orb.tsx` e não uma recriação local.
- [ ] Estados `idle`, `recording`, `reflecting`, `saved` e `disabled` foram considerados quando a tela tem fluxo de voz.
- [ ] Rings/waveform aparecem apenas em `recording`; spiral aparece apenas em `reflecting`.
- [ ] Tema Crepúsculo/Amanhecer está correto para o contexto.

## Tipografia

- [ ] Inter é usado para UI, controles, métricas, tabelas e admin.
- [ ] Fraunces aparece apenas em marca, prompts, reflexões ou momentos editoriais.
- [ ] Títulos de produto não usam escala de hero.
- [ ] Títulos de produto usam `--type-screen-title` ou menor.
- [ ] Títulos dentro de cards usam `--type-card-title`.
- [ ] Reflexões usam `--type-reflection`; `--type-reflection-feature` aparece só como destaque controlado.
- [ ] Não há `40px+`, `text-4xl+` ou equivalente em Diário, Timeline, Fio, Conta ou Admin.
- [ ] Texto funcional não usa `clamp()` com `vw` fora dos tokens globais.
- [ ] Texto não estoura containers em mobile.

## Product UI System

- [ ] A tela nova escolhe camada: tokens, UI, product, patterns ou screens.
- [ ] Componentes recorrentes foram criados em `components/ui` ou `components/product`, não direto na page.
- [ ] A tela reutiliza componentes da Fase 2B quando aplicável: Button, IconButton, CardSurface, Panel, Chip, ReflectionCard, TimelineEntryCard, ThreadCard e ContinueThreadButton.
- [ ] A tela reutiliza `FlipCard` quando precisar de frente/verso entre fala do usuário e devolutiva da Aurora.
- [ ] A tela reutiliza componentes da Fase 2C quando aplicável: SegmentedTabs, StreamingText, BottomNav, EmptyState, FeedbackMicro e PrivacyChip.
- [ ] Composições recorrentes foram criadas como patterns antes de virar tela.
- [ ] A tela reutiliza patterns da Fase 3 quando aplicável: DiaryCapturePattern, ReflectionResultPattern, TimelineListPattern, OpenThreadPattern e EmptyThreadPattern.
- [ ] A tela foi conferida no Responsive Screen Lab quando usar pattern de produto.
- [ ] Diário no laboratório começa sem botões abaixo do orb e com textura estrelada, como a produção atual.
- [ ] Resultado no laboratório espelha a tela real de devolutiva do Diário.
- [ ] Timeline no laboratório usa FlipCard como padrão; o cenário sem flip é exceção.
- [ ] Controles do Responsive Screen Lab não se sobrepõem em desktop, tablet ou mobile.
- [ ] Tipografia por área no laboratório usa apenas presets fechados do DS: Produto, Editorial e Compacta.
- [ ] A rota `/design-system/biblioteca` mostra a peça nova ou registra a lacuna no handoff.

## Layout

- [ ] Mobile 390px sem overflow horizontal.
- [ ] Tablet 768px foi desenhado como ambiente próprio.
- [ ] Desktop largo sem conteúdo solto ou desproporcional.
- [ ] mobile, tablet e desktop têm composições específicas; responsivo não é só escala.
- [ ] Não há card dentro de card.
- [ ] Alvos de toque principais têm pelo menos 44px.
- [ ] A tela tem uma ação principal clara quando for produto.

## Cobertura do Design System

- [ ] `/design-system` funciona como portal do Aurora Product System, com entrada para Design System e entrada para Público-alvo e Posicionamento.
- [ ] `/design-system/posicionamento` mostra definição, USP, público-alvo, o que Aurora é/não é e regras de comunicação.
- [ ] `/design-system/fundamentos` mostra cores, tipografia, espaçamento, radius e glass.
- [ ] `/design-system/biblioteca` mostra camada, nome, variantes e regra de uso de cada componente.
- [ ] `/design-system/biblioteca` cobre StreamingText, BottomNav, EmptyState, WaitlistBlock, FeedbackMicro e PrivacyChip.
- [ ] `/design-system/patterns` mostra o Responsive Screen Lab com DiaryCapturePattern, ReflectionResultPattern, TimelineListPattern, OpenThreadPattern e EmptyThreadPattern.
- [ ] `/design-system/referencia` mostra exemplos reais de Diário, gravação, reflexão, timeline, fio e admin.
- [ ] `/design-system/referencia` mostra voz, tom e microcopy por estado.
- [ ] `/design-system/referencia` mostra uso do logo, regras de área de respiro e proibições.
- [ ] `/design-system/referencia` mostra composições responsivas para mobile, tablet e desktop.
- [ ] `/design-system/referencia` mostra FlipCard, botões, player, ilustrações, motion e microinterações.
- [ ] `/design-system/roadmap` mostra fases de componentes, patterns e migração.
- [ ] `docs/design-system/reference.md` reflete todos os blocos visíveis de `/design-system/referencia`.
- [ ] `docs/design-system/component-inventory.md` cobre todos os componentes e estados renderizados.
- [ ] `docs/design-system/ui-ux-creation-brief.md` explica como criar telas novas usando o DS.

## Acessibilidade

- [ ] Foco visível em todo interativo.
- [ ] Contraste suficiente em texto funcional.
- [ ] `prefers-reduced-motion` respeitado.
- [ ] Estados de erro, carregamento e indisponível são explícitos.

## Produto e privacidade

- [ ] Não promete terapia, diagnóstico, cura, tratamento ou suporte emergencial.
- [ ] Não coleta dado sensível sem decisão separada.
- [ ] Não envia email, nome, áudio, transcrição, reflexão ou resposta aberta para analytics.

## Verificação técnica

- [ ] `npx tsc --noEmit` passa.
- [ ] `npm run design-system:check` passa.
- [ ] A rota principal foi aberta no browser.
- [ ] Screenshot desktop e mobile foram revisados quando a mudança é visual.
