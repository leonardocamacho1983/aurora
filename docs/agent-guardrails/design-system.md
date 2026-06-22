# Agent guardrail: Design System Aurora

Use este arquivo antes de criar, redesenhar ou revisar qualquer superfície visual da Aurora.

## Objetivo

Manter a Aurora visualmente consistente, íntima, luminosa, legível e não clínica. O design system deve orientar produto, landing, onboarding, timeline, admin, emails e materiais de criação.

## Fontes de verdade

Leia nesta ordem:

1. `docs/design-system/index.md`
2. `docs/design-system/reference.md`
3. `docs/design-system/component-inventory.md`
4. `docs/design-system/ui-ux-creation-brief.md`
5. `docs/design-system/tokens.md`
6. `docs/design-system/qa-checklist.md`
7. `docs/brand-system.md`
8. `app/globals.css`
9. `public/brand/aurora-brand.css`
10. A rota protegida `/design-system`

O pacote do Figma `Reproduzir telas.zip` foi usado como referência inicial para DS v2. O código final no repo vence sobre o pacote quando houver implementação deliberada.

## Princípios inegociáveis

- Aurora é um diário por voz com IA, não terapia, diagnóstico, emergência, coach, mascote ou chat genérico.
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

## Tokens e componentes

Use tokens semânticos de `app/globals.css` em vez de hex solto quando existir token equivalente.

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
- A rota `/design-system#orb` deve mostrar os estados vivos. Se ela virar apenas texto, o guardrail está incompleto.

Componentes novos devem preferir um componente-base Aurora reutilizável antes de criar estilos locais:

- Brand lockup
- Orb
- Button
- IconButton
- Panel/Card
- ReflectionCard
- TimelineEntryCard
- MoodDot
- SegmentedTabs
- DataTable
- Notice/Error
- Waitlist block
- Privacy chip

Se um componente-base ainda não existir, crie uma versão reutilizável quando o padrão aparecer em mais de uma superfície.

## Cobertura obrigatória do DS consultável

A rota `/design-system` não pode ser apenas uma vitrine bonita. Ela precisa funcionar como guarda-corpo de criação para humanos e agentes. Antes de usar a rota como referência, confirme que ela mostra:

- fundamentos: cor, tipografia, espaçamento, radius e glass;
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

`docs/design-system/reference.md` deve refletir a rota `/design-system`. Não trate a documentação como resumo. Ela precisa capturar os elementos que aparecem na página: tela protegida, nav, hero, fundamentos, componentes, orb, padrões, exemplos reais, voz, logo, novos componentes, composições, FlipCard, botões, ilustrações, movimento, microinterações, guardrails e QA.

Toda alteração visual relevante deve passar por `npm run design-system:check`, que verifica a presença dos arquivos de referência e dos principais blocos de paridade.

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
3. Conferir contraste e foco visível.
4. Conferir mobile em 390px.
5. Conferir desktop em largura larga.
6. Conferir se motion respeita reduced motion.
7. Conferir se não há overflow de texto.
8. Conferir se a tela continua fiel à Aurora: diário por voz, calma, privacidade e clareza.

Qualquer desvio deve ser descrito no handoff.
