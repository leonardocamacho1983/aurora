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
- [ ] Texto não estoura containers em mobile.

## Layout

- [ ] Mobile 390px sem overflow horizontal.
- [ ] Desktop largo sem conteúdo solto ou desproporcional.
- [ ] Não há card dentro de card.
- [ ] Alvos de toque principais têm pelo menos 44px.
- [ ] A tela tem uma ação principal clara quando for produto.

## Cobertura do Design System

- [ ] A rota `/design-system` mostra cores, tipografia, espaçamento, radius e glass.
- [ ] A rota mostra o inventário completo de componentes, incluindo StreamingText, BottomNav, EmptyState, WaitlistBlock, FeedbackMicro e PrivacyChip.
- [ ] A rota mostra exemplos reais de Diário, gravação, reflexão, timeline, fio e admin.
- [ ] A rota mostra voz, tom e microcopy por estado.
- [ ] A rota mostra uso do logo, regras de área de respiro e proibições.
- [ ] A rota mostra composições responsivas para mobile, tablet e desktop.
- [ ] A rota mostra FlipCard, botões, player, ilustrações, motion e microinterações.
- [ ] `docs/design-system/reference.md` reflete todos os blocos visíveis da rota.
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
