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
