# Aurora Design System v2 — referência interna exata

Esta referência captura o conteúdo completo da rota protegida `/design-system/referencia` para servir como base de criação de UI/UX da Aurora.

## Arquitetura de rotas

O Design System não deve voltar a ser uma página infinita. A navegação viva fica dividida assim:

- `/design-system`: hub curto com entrada por tarefa, regras críticas e próximo encaixe.
- `/design-system/fundamentos`: tokens, cores, tipografia e guardrails de escala.
- `/design-system/biblioteca`: aba específica da biblioteca de componentes.
- `/design-system/patterns`: aba específica com Responsive Screen Lab para patterns de tela por ambiente e cenário.
- `/design-system/referencia`: referência completa preservada para auditoria e paridade.
- `/design-system/roadmap`: encaixe das próximas fases: componentes, patterns e migração das telas.

Rota local de validação:

- `http://localhost:3000/design-system/referencia?token=local-ds-token`

Rota de produção:

- `/design-system/referencia?token=<DESIGN_SYSTEM_ADMIN_TOKEN>`

## Contrato de paridade

Este arquivo deve refletir a página consultável completa. Se a rota `/design-system/referencia` mudar, este arquivo deve mudar no mesmo pull/patch. Se este arquivo mudar, a rota deve ser conferida para manter o mesmo conteúdo conceitual.

Antes de criar qualquer tela nova da Aurora, o agente deve ler:

1. `docs/design-system/reference.md`
2. `docs/design-system/component-inventory.md`
3. `docs/design-system/ui-ux-creation-brief.md`
4. `docs/design-system/tokens.md`
5. `docs/design-system/qa-checklist.md`
6. `docs/agent-guardrails/design-system.md`

## Tela protegida

Quando o token não está presente ou está incorreto, a rota mostra uma tela de acesso com fundo "universo aurora".

Elementos da tela:

- Logo Aurora horizontal.
- Kicker: `Design System Aurora`.
- Título: `Entre no universo visual da Aurora.`
- Texto: `Consulte tokens, componentes, padrões e guardrails para criar novas telas sem sair da identidade da marca.`
- Card de acesso com sinal visual discreto.
- Label: `Acesso reservado`.
- Título do card: `Guardrail visual`.
- Texto quando o token está configurado: `Use o token do Design System para abrir a biblioteca viva da Aurora.`
- Texto quando o token não está configurado: `Configure DESIGN_SYSTEM_ADMIN_TOKEN para liberar esta rota.`
- Campo: `Token`.
- Placeholder: `design-system-token`.
- Botão: `Entrar no Design System`.

## Header e navegação

O header autenticado usa logo Aurora horizontal e navegação por âncoras.

Links, na ordem:

1. `Fundamentos` -> `#tokens`
2. `Sistema` -> `#product-ui-system`
3. `Biblioteca de Componentes` -> `#biblioteca-componentes`
4. `Orb` -> `#orb`
5. `Padrões` -> `#padroes`
6. `Exemplos` -> `#exemplos`
7. `Voz` -> `#voz`
8. `Movimento` -> `#motion`
9. `QA` -> `#qa`

## Hero

Conteúdo:

- Kicker: `Design System v2 / Aurora`
- Título: `Um sistema íntimo, escuro e luminoso para escutar com calma.`
- Texto: `Aurora é um diário emocional por voz com IA. Este DS organiza tokens, componentes e padrões para produto, landing e operação sem virar uma coleção de cards soltos.`
- CTA primário: `Começar pelos tokens` -> `#tokens`
- CTA secundário: `Princípios de privacidade` -> `#guardrails`
- Visual: `Orb` real em estado `reflecting`, usado como hero canônico.

Regra: o hero pode ter um orb dominante porque a página está ensinando a assinatura do DS. Não repetir outro orb dominante acima da dobra.

## Fundamentos

Seção:

- ID: `tokens`
- Kicker: `Fundamentos`
- Título: `Crepúsculo como padrão. Amanhecer como abertura.`
- Texto: `A página mostra os tokens que devem orientar código, Figma, assets e novas telas.`

### Cores

| Nome | Token | Valor |
| --- | --- | --- |
| `bg/base` | `--bg-base` | `#08060F` |
| `bg` | `--bg` | `#0D0C17` |
| `surface` | `--surface` | `#181527` |
| `raised` | `--raised` | `#221E33` |
| `ink` | `--ink` | `#F8F6FC` |
| `ink/soft` | `--ink-soft` | `#B3ADC4` |
| `accent` | `--accent` | `#A99BD9` |
| `warm` | `--aurora-warm` | `#F4B6A0` |
| `pink` | `--aurora-pink` | `#C9A2D4` |
| `blue` | `--aurora-blue` | `#8FA4D6` |
| `mint` | `--aurora-mint` | `#7FD0C4` |
| `amanhecer/bg` | `--bg em dawn` | `#F6F3FB` |

### Tipografia

Seção:

- Kicker: `Tipografia`
- Título: `O tamanho serve o conteúdo.`
- Texto: `Produto e admin não usam escala de hero. Fraunces fica reservado para marca, prompt e reflexão.`

| Uso | Token | Escala | Fonte | Contexto |
| --- | --- | --- | --- | --- |
| `Hero Display` | `--type-hero` | `56-64` | `Fraunces ou Inter` | `Landing, manifesto e DS` |
| `Product ScreenTitle` | `--type-screen-title` | `28-32` | `Inter 650` | `Produto, máximo 1 por tela` |
| `Mobile ScreenTitle` | `--type-mobile-title` | `24-28` | `Inter 650` | `Linha curta em 390px` |
| `SectionTitle` | `--type-section-title` | `20-24` | `Inter 640` | `Seções e padrões` |
| `CardTitle` | `--type-card-title` | `16-18` | `Inter 650` | `Cards, sheets e painéis` |
| `Body` | `--type-body` | `15-16 / 24` | `Inter 450` | `Leitura padrão` |
| `Small` | `--type-small` | `13-14 / 20` | `Inter 450` | `Metadados legíveis` |
| `Meta` | `--type-meta` | `11-13 / 16` | `Inter 700 + caps` | `Status e labels` |
| `Reflection` | `--type-reflection` | `18-22` | `Fraunces italic` | `Diário e insight` |
| `Reflection Feature` | `--type-reflection-feature` | `24-28` | `Fraunces italic` | `Destaque reflexivo controlado` |

Regra: produto, timeline, fio, conta e admin não usam escala de hero. `40px+` é reservado para landing, manifesto, Design System ou momento editorial explicitamente justificado.

### Product UI System

Seção:

- ID: `product-ui-system`
- Kicker: `Product UI System`
- Título: `A tela nasce da camada certa.`
- Texto: `Aurora usa design atômico de forma pragmática: tokens, primitivos, componentes de produto, padrões e receitas de tela.`

| Camada | Papel | Regra |
| --- | --- | --- |
| `Tokens` | `Base` | `Cores, tipografia, spacing, radius e motion. Nada de valor de estilo solto por tela.` |
| `UI` | `Primitivos` | `Button, IconButton, CardSurface, Panel, Chip, Tabs e estados básicos.` |
| `Product` | `Componentes Aurora` | `OrbControl, ReflectionCard, TimelineEntryCard, ThreadCard, FlipCard e ContinueThreadButton.` |
| `Patterns` | `Receitas reutilizáveis` | `DiaryCapture, ReflectionResult, TimelineList, OpenThread e EmptyThread.` |
| `Screens` | `Composição final` | `Pages montam padrões existentes. Tela complexa não nasce artesanal em page.tsx.` |

### Espaçamento

Escala renderizada:

- `4px`
- `8px`
- `12px`
- `16px`
- `24px`
- `32px`
- `48px`
- `64px`

### Radius

| Nome | Valor | Uso |
| --- | --- | --- |
| `r-sm` | `12px` | `Campos, chips e controles compactos` |
| `r-md` | `20px` | `Cards funcionais e painéis` |
| `r-lg` | `28px` | `Seções, sheets e blocos de destaque` |
| `r-pill` | `9999px` | `Botões, inputs e pílulas` |

### Efeitos / glass

Texto-base:

- `Glass é superfície funcional, não decoração. Use borda hairline, blur moderado e contraste suficiente para leitura.`

| Título | Especificação | Regra |
| --- | --- | --- |
| `Painel / raised` | `var(--raised) + var(--hairline)` | `Glass é superfície funcional, não decoração.` |
| `Leitura` | `blur moderado + contraste` | `Texto nunca depende só de brilho ou transparência.` |
| `Borda` | `hairline 8-18%` | `A borda desenha hierarquia sem virar moldura pesada.` |

## Componentes

Primeira seção:

- ID: `componentes`
- Kicker: `Componentes`
- Título: `Componentes com intenção.`
- Texto: `Cada componente existe para uma ação, estado ou leitura. Variantes devem ser explícitas, não estilos soltos.`

Cards base:

| Componente | Variantes | Regra |
| --- | --- | --- |
| `Orb` | `repouso / gravação / reflexão / resultado / erro` | `Controle principal no Diário, visual-chave em marketing.` |
| `Button` | `primário / secundário / ghost / perigo` | `44px mínimo, carregamento, indisponível e foco visível.` |
| `Panel` | `padrão / elevado / compacto` | `Superfície funcional com glass e borda hairline.` |
| `ReflectionCard` | `compacto / expandido / resultado` | `Fraunces apenas no texto reflexivo.` |
| `TimelineEntryCard` | `padrão / ativo / fio` | `Humor discreto como ponto ou chip.` |
| `SegmentedTabs` | `semana / mês / tudo` | `Estado selecionado claro, sem competir com o conteúdo.` |
| `DataTable` | `admin denso` | `Inter, escaneável, sem escala editorial.` |
| `PrivacyChip` | `local / privado / anônimo` | `Sinal de confiança discreto, nunca invasivo.` |

### Biblioteca de Componentes

Segunda seção:

- ID: `biblioteca-componentes`
- Kicker: `Biblioteca de Componentes`
- Título: `Peças prontas para montar telas.`
- Texto: `Esta aba concentra só componentes: camada, nome, variantes e regra de uso. Fundamentos, padrões e exemplos ficam fora daqui.`

Todos os itens aparecem com status visual `Biblioteca`.

Estado de implementação:

- Fase 2B está implementada em código e demonstrada em `/design-system/biblioteca`.
- Componentes UI: `components/ui/Button.tsx`, `components/ui/IconButton.tsx`, `components/ui/CardSurface.tsx`, `components/ui/Panel.tsx`, `components/ui/Chip.tsx`.
- Componentes Product: `components/product/ReflectionCard.tsx`, `components/product/TimelineEntryCard.tsx`, `components/product/ThreadCard.tsx`, `components/product/ContinueThreadButton.tsx`.
- Fase 2B.1 está implementada com `components/product/FlipCard.tsx`, incluindo frente, verso, expansão antes do flip, foco, teclado e reduced motion.
- Fase 2C está implementada com `components/ui/SegmentedTabs.tsx`, `components/product/StreamingText.tsx`, `components/product/BottomNav.tsx`, `components/product/EmptyState.tsx`, `components/product/FeedbackMicro.tsx` e `components/product/PrivacyChip.tsx`.
- Fase 3 está implementada com `components/patterns/DiaryCapturePattern.tsx`, `components/patterns/ReflectionResultPattern.tsx`, `components/patterns/TimelineListPattern.tsx`, `components/patterns/OpenThreadPattern.tsx` e `components/patterns/EmptyThreadPattern.tsx`.
- Fase 3.1 está implementada com `components/patterns/responsive/responsive-pattern-config.ts`, `components/patterns/responsive/ResponsivePatternFrame.tsx`, `components/patterns/responsive/PatternControls.tsx`, `components/patterns/responsive/ResponsivePatternLab.tsx`, `components/patterns/responsive/ResponsivePatterns.module.css` e `components/patterns/responsive/index.ts`.
- Ajuste de feedback da Fase 3.1: Diário começa sem botões abaixo do orb e com textura estrelada; Resultado espelha a devolutiva de produção; Timeline usa FlipCard como padrão e `Sem flip` como exceção; controles não se sobrepõem; tipografia por área usa presets fechados do DS.
- Próximo passo: Fase 4, migrando `/diario`, `/timeline` e `/fios` usando esses patterns e o Responsive Screen Lab.

| Camada | Componente | Variantes | Regra |
| --- | --- | --- | --- |
| `UI` | `Button` | `primário · secundário · ghost · perigo` | `44px mínimo, carregamento e foco visível.` |
| `UI` | `IconButton` | `voltar · fechar · ordenar · reproduzir` | `Ação compacta com alvo de toque de 44px.` |
| `UI` | `CardSurface` | `padrão · elevado · compacto · interativo` | `Base de cards antes de conteúdo de produto.` |
| `UI` | `Panel` | `padrão · elevado · compacto` | `Superfície funcional com glass e borda hairline.` |
| `UI` | `SegmentedTabs` | `semana · mês · tudo` | `Foco e seleção por contraste.` |
| `Product` | `OrbControl` | `idle · recording · reflecting · saved · disabled` | `Controle principal, não ornamento.` |
| `Product` | `ReflectionCard` | `compacto · expandido · resultado` | `Fraunces apenas no texto reflexivo.` |
| `Product` | `TimelineEntryCard` | `padrão · ativo · fio` | `Humor discreto como ponto/chip.` |
| `Product` | `ThreadCard` | `último momento · padrão · pergunta viva` | `Organiza continuidade do fio sem virar decoração.` |
| `Product` | `ContinueThreadButton` | `idle · loading · disabled · erro` | `Ação de retomada com estado claro.` |
| `Product` | `FlipCard` | `front · back · expanded · flipped` | `Texto longo expande antes do flip para a devolutiva.` |
| `Product` | `StreamingText` | `streaming · concluído` | `Cursor discreto durante geração de IA.` |
| `Product` | `BottomNav` | `diário · timeline · fio · perfil` | `Áreas de toque de 44px e estado ativo por cor.` |
| `Product` | `EmptyState` | `diário · timeline · fio` | `Copy específica por contexto.` |
| `Growth` | `WaitlistBlock` | `idle · enviado · confirmado` | `CTA conversão + microprivacidade.` |
| `Feedback` | `FeedbackMicro` | `fez sentido · não tanto` | `Coleta silenciosa pós-insight.` |
| `Trust` | `PrivacyChip` | `local · privado · anônimo` | `Sinal de confiança discreto, nunca invasivo.` |

## Sistema do orb

Seção:

- ID: `orb`
- Kicker: `Sistema do orb`
- Título: `Orbes animadas, estados e orçamento visual.`
- Texto: `A página usa o componente real de components/orb/Orb.tsx para expor movimento, estados, anatomia e regras de uso.`

### Estados

Todos os estados usam o componente real `components/orb/Orb.tsx`.

| Estado técnico | Rótulo | Papel | Movimento |
| --- | --- | --- | --- |
| `idle` | `Repousa / idle` | `Estado de espera. O orb respira devagar e convida a voz.` | `breathe 4.8s + halo 5.4s` |
| `recording` | `Floresce / recording` | `Estado ativo de gravação. Anéis e forma de onda deixam claro que há captura.` | `pulse 1.7s + wave 0.7-1.12s` |
| `reflecting` | `Pensa / reflecting` | `Estado de processamento. A espiral interna comunica organização sem virar loader genérico.` | `spiral 14-22s + inner drift` |
| `saved` | `Exala / saved` | `Confirmação curta após salvar ou concluir reflexão.` | `exhale 1.8s uma vez` |
| `disabled` | `Indisponível / disabled` | `Estado indisponível. Mantém a forma, reduz saturação e remove a chamada para ação.` | `movimento reduzido + glow baixo` |

### Anatomia

| Parte | Regra |
| --- | --- |
| `Core` | `Gradiente canônico do orb. Deve usar o componente-base real, não CSS solto por tela.` |
| `Halo` | `Luz externa respirando. Atmosfera, não segundo orb.` |
| `Rings` | `Aparecem apenas em recording para sinalizar captura.` |
| `Waveform` | `13 barras no estado recording. Não usar como gráfico decorativo fora do orb.` |
| `Spiral` | `Camada interna de reflecting. Comunica pensamento e organização.` |
| `Grain` | `Textura sutil para tirar o orb do look plástico.` |

### Motion tokens

| Token | Duração | Uso | Comportamento |
| --- | --- | --- | --- |
| `breathe` | `4.8s` | `Idle e reflecting` | `scale 1 -> 1.045 -> 1` |
| `haloBreathe` | `5.4s` | `Luz externa` | `opacity + scale suave` |
| `recPulse` | `2.3s` | `Recording rings` | `ring expande e desaparece` |
| `wave` | `0.7-1.12s` | `Recording waveform` | `barras reagem em cadência alternada` |
| `spiralSpin` | `14-22s` | `Reflecting` | `rotação lenta, nunca nervosa` |
| `exhale` | `1.8s` | `Saved` | `confirmação curta` |

### Notas de movimento

| Estado | Movimento | Regra |
| --- | --- | --- |
| `Idle` | `respiração 5-7s` | `A aura quase não chama atenção.` |
| `Recording` | `anéis finos + waveform` | `Feedback claro sem ansiedade visual.` |
| `Reflecting` | `rotação interna lenta` | `Sensação de processamento contemplativo.` |
| `Result` | `orb atrás do card` | `Calma, leitura e síntese.` |
| `Reduced motion` | `sem escala contínua` | `Manter estados por cor, texto e ícone.` |

### Uso permitido e proibido

| Modo | Contexto | Regra |
| --- | --- | --- |
| `Use` | `Diário` | `Orb como controle principal de falar, parar, continuar ou refletir.` |
| `Use` | `Landing / DS` | `Um orb hero canônico quando a página precisa ensinar a assinatura.` |
| `Use` | `Componente` | `Demonstrações pequenas apenas quando o assunto é o próprio orb.` |
| `Evite` | `Cards e listas` | `Não usar orb como marcador, ícone de feature ou marcador de etapa.` |
| `Evite` | `Formulário` | `Se o logo já tem orb, use linha aurora, estrela, glass ou amostra de cor.` |
| `Evite` | `Fundo` | `Não transformar o orb em textura repetida ou papel de parede.` |

### Orçamento visual do orb

| Número | Regra | Descrição |
| --- | --- | --- |
| `01` | `Um papel por viewport` | `Escolha se o orb será marca, controle principal, hero canônico ou demonstração. Nunca todos ao mesmo tempo.` |
| `02` | `Um orb dominante` | `Fora do logo, use no máximo um orb acima de 64px na mesma viewport. Se houver hero orb, cards e formulários usam luz, linhas ou textura.` |
| `03` | `Nunca como marcador` | `Cards, listas, badges, etapas e ícones genéricos não usam orb. Use marcadores lineares, amostras de cor, numeração ou tipografia.` |

## Padrões

Seção:

- ID: `padroes`
- Kicker: `Padrões`
- Título: `A mesma marca, densidades diferentes.`
- Texto: `Landing, produto e operação usam a mesma identidade, mas não a mesma densidade visual.`

| Superfície | Regra |
| --- | --- |
| `Landing` | `Editorial e cinematográfica, mas com CTA único, promessa clara e sem linguagem clínica.` |
| `Diário` | `Uma ação principal por tela. O orb grava, para, continua ou sinaliza estado.` |
| `Timeline` | `Leitura densa e calma. Humor aparece como sinal discreto, não decoração.` |
| `Onboarding` | `Educa o uso sem parecer tutorial pesado. Explica que Aurora não é chat genérico.` |
| `Admin` | `Operacional, denso e utilitário. Métricas primeiro, diagnósticos depois, tabelas por último.` |

### Responsive Screen Lab

Rota:

- `/design-system/patterns?token=<DESIGN_SYSTEM_ADMIN_TOKEN>`

Função:

- renderizar tela inteira, não só componente isolado;
- alternar `Pattern`, `Ambiente` e `Cenário`;
- conferir mobile, tablet e desktop como composições específicas;
- preparar a Fase 4 antes de mexer em `/diario`, `/timeline` e `/fios`.

Arquivos:

- `components/patterns/responsive/responsive-pattern-config.ts`
- `components/patterns/responsive/ResponsivePatternFrame.tsx`
- `components/patterns/responsive/PatternControls.tsx`
- `components/patterns/responsive/ResponsivePatternLab.tsx`
- `components/patterns/responsive/ResponsivePatterns.module.css`
- `components/patterns/responsive/index.ts`

Regra: mobile, tablet e desktop não são versões reduzidas da mesma tela. Cada ambiente pode mudar densidade, navegação, foco de ação, contexto lateral e quantidade de conteúdo visível.

Regras atuais:

- Diário usa fundo estrelado e não mostra botões abaixo do orb por default.
- Os controles `Ações` e `Fundo` existem para testar exceções futuras do Diário.
- Resultado deve permanecer fiel à tela real de devolutiva em produção.
- Timeline usa `FlipCard` como padrão; `Sem flip` é cenário de exceção.

## Telas de exemplo

Seção:

- ID: `exemplos`
- Kicker: `Telas de exemplo`
- Título: `Exemplos em produto real, não mockup descartável.`
- Texto: `O DS precisa mostrar como os tokens viram Diário, gravação, reflexão, timeline, fio e admin.`

### Estados de produto

| Estado visual | Orb | Título | Texto | Apoio |
| --- | --- | --- | --- | --- |
| Espera | `idle` | `O que está vivo em você agora?` | `Não precisa organizar. Só fale.` | `Toque no orb para continuar.` |
| Gravação | `recording` | `Gravando` | `Pode falar no seu tempo.` | `Toque no orb para continuar.` |
| Reflexão | `reflecting` | `Aproveite para respirar.` | `Aurora está pensando no que você falou.` | `Toque no orb para continuar.` |

### Timeline

Topo:

- Logo Aurora horizontal.
- Abas: `Semana`, `Mês`, `Tudo`.
- Label: `Seus registros — intercalados com devolutivas da Aurora`.

Cards:

| Metadado | Conteúdo | CTA |
| --- | --- | --- |
| `Hoje · 22:16` | `Estou há três semanas tentando tomar essa decisão sobre mudar de emprego.` | `Ver tudo` |
| `Aurora` | `Você se permitiu sentir essa satisfação hoje. Isso não é pouca coisa.` | `Seu registro` |
| `Seg · 06:32` | `A Maia nasceu hoje de manhã. Às 6h14. Olhei para ela e não consegui falar nada.` | `Ver Aurora` |

### Fio aberto

Topo:

- Logo Aurora horizontal.
- Botão: `Ordenar: recente`.
- Label: `Fio aberto`.

Blocos:

| Bloco | Conteúdo |
| --- | --- |
| `Último momento` | `Voltei da viagem com o Henrique. Ele fez 18 anos e a gente foi para Portugal juntos, uma semana só nós dois.` |
| Apoio do último momento | `Áudio · 1 min 23 s` |
| `Padrão do fio` | `Você registra presença quando sente que o tempo está passando rápido.` |
| `Pergunta viva` | `O que você quer guardar dessa viagem que ainda não colocou em palavras?` |

### Admin cockpit

Conteúdo:

- Kicker: `Admin cockpit`
- Título: `Operacional, não editorial.`
- Texto: `Sem headline gigante, sem cards decorativos dominantes, sem Fraunces em dados.`

Tabela:

| Métrica | Status | Próxima ação |
| --- | --- | --- |
| `Waitlist` | `normal` | `Revisar origem` |
| `Convites` | `atenção` | `Liberar lote 02` |
| `Erros áudio` | `baixo` | `Monitorar` |

## Voz e tom

Seção:

- ID: `voz`
- Kicker: `Voz e tom`
- Título: `Aurora fala com calma. Nunca com urgência.`
- Texto: `O tom é presente, específico e convidativo. A Aurora não pressiona, não julga e não dramatiza.`

### Princípios

| Princípio | Use | Evite |
| --- | --- | --- |
| `Presente sem urgência` | `Quando quiser falar, é aqui.` | `Fale agora para não perder o momento.` |
| `Específico sem julgamento` | `Você mencionou cansaço três vezes.` | `Você parece muito estressado.` |
| `Convidativo sem obrigação` | `Você pode continuar ou pausar aqui.` | `Continue para completar seu passado.` |

### Microcopy por estado

| Estado | Tom | Copy |
| --- | --- | --- |
| `Idle` | `Convidativo` | `Quando quiser falar, é aqui.` |
| `Recording` | `Presente` | `Pode falar no seu tempo.` |
| `Reflecting` | `Calmante` | `Aurora está pensando no que você disse.` |
| `Result` | `Reflexivo` | `Aqui está o que Aurora notou.` |
| `Error` | `Não alarmista` | `Algo saiu do fluxo. Nada foi perdido.` |
| `Timeline vazia` | `Acolhedor` | `Seus momentos vão aparecer aqui.` |
| `Diário vazio` | `Suave` | `Quando quiser, é aqui.` |

## Uso do logo

Seção:

- ID: `logo`
- Kicker: `Uso do logo`
- Título: `Um orb. Quatro contextos. Zero distorções.`
- Texto: `O logo deve respirar. Nunca recolorir gradiente, cortar o orb ou usar a assinatura como textura.`

Variações:

| Variação | Uso |
| --- | --- |
| `Horizontal dark` | `Padrão. Headers, docs e fundos escuros.` |
| `Horizontal light` | `Amanhecer, email e superfícies claras.` |
| `Mist` | `Sobre fotos ou superfícies texturadas.` |
| `Icon only` | `Favicons, app icons, contextos compactos.` |

Regras:

- Tamanho mínimo: `Ícone: 24px. Horizontal: 80px largura. Nunca encostar o logo em borda ou outros elementos.`
- Proibido: `Não distorcer, não colocar em moldura quadrada, não recolorir gradiente e não usar o orb sozinho como ícone de navegação.`

## Novos componentes v2

Seção:

- ID: `novos-componentes`
- Kicker: `Novos componentes v2`
- Título: `IA, crescimento, privacidade e navegação.`
- Texto: `Blocos que faltavam no inventário para cobrir produto real, aquisição e estados vazios.`

| Componente | Descrição | Demonstração |
| --- | --- | --- |
| `StreamingText` | `UX de IA: texto surgindo progressivamente durante geração.` | `Parece que você volta a esse tema quando está perto de uma decisão importante.` |
| `FeedbackMicro` | `Coleta silenciosa pós-insight. Dois botões discretos, sem nota visível.` | Botões: `Fez sentido`, `Não tanto` |
| `BottomNav — mobile` | `Navegação principal em produto. Áreas de toque de 44px e label mínimo.` | Itens: `Diário`, `Timeline`, `Fio`, `Perfil` |
| `EmptyState` | `Copy específica por contexto. Nunca usar 'sem dados'.` | `Quando quiser falar, o orb está aqui.` / `Não precisa se preparar.` |
| `WaitlistBlock + PrivacyChip` | `CTA de conversão com microprivacidade embutida.` | Placeholder `seu@email.com`; botão `Entrar`; microcopy `Dados mínimos. Sem spam, sem textos sensíveis.` |

## Composições responsivas

Seção:

- ID: `composicoes`
- Kicker: `Visuais-chave — mobile · tablet · desktop`
- Título: `Três composições. Uma mesma identidade.`
- Texto: `O orb não escala proporcionalmente; ele tem papel composicional diferente em cada formato.`

| Formato | Regra |
| --- | --- |
| `Mobile · 375px` | `Orb centralizado ocupa 40-50% da largura. Contraste alto. BottomNav sempre visível.` |
| `Tablet · 768px` | `Split 50/50. Orb à esquerda, conteúdo à direita. Navegação no topo.` |
| `Desktop · 1440px` | `Orb como âncora lateral esquerda. Conteúdo à direita. Barra de navegação no topo, sem sidebar.` |

## FlipCard

Seção:

- ID: `flipcard`
- Kicker: `Flipcard — componente do sistema`
- Título: `A fala do usuário e a devolutiva da Aurora, frente e verso.`
- Texto: `Na timeline, os cards aparecem intercalados. O usuário lê tudo antes de virar e acessar a devolutiva.`

### Card curto

- Kicker: `Card curto — virado para Aurora`
- Autor: `Aurora`
- Texto: `Você se permitiu sentir essa satisfação hoje. Isso não é pouca coisa — muitas vezes você passa rápido por esse tipo de reconhecimento.`
- Apoio: `Seu registro`
- Nota: `Frente: fala do usuário em glass neutro. Verso: devolutiva da Aurora em glass aurora.`

### Card longo

- Kicker: `Card longo — expansível antes do flip`
- Metadado: `Seg · 06:32`
- Texto: `A Maia nasceu hoje de manhã. Às 6h14. Olhei para ela e não consegui falar nada. Fiquei só olhando. O Rodrigo estava chorando.`
- Ações: `Ver tudo · Ver Aurora`
- Nota: `Textos longos: clamp de 5 linhas com botão Ver tudo antes do flip.`

### Regras do FlipCard

| Regra | Descrição |
| --- | --- |
| `Frente — Fala do usuário` | `bg rgba(255,255,255,0.055) · borda hairline branca · texto em Fraunces italic · ponto de humor · data no topo` |
| `Verso — Devolutiva Aurora` | `bg rgba(169,155,217,0.08) · borda aurora · mini orb/avatar · texto mais claro` |
| `Overflow elegante` | `Textos acima de 5 linhas ganham botão Ver tudo antes do flip. Expansão animada, sem quebrar o grid.` |

## Botões e player

Seção:

- ID: `botoes`
- Kicker: `Botões — galeria completa`
- Título: `Cada ação tem um botão certo.`
- Texto: `Ações principais, navegação, player e feedback usam a mesma escala de toque e o mesmo foco visível.`

Ações de navegação:

- `Voltar`
- `Avançar`
- `Abrir`
- `Fechar`

Player de áudio/vídeo:

- Label: `Entrada de ontem`
- Duração: `Áudio · 1 min 23 s`
- Botão: `Reproduzir`
- Visual: waveform/progresso inline.

## Movimento

Seção:

- ID: `motion`
- Kicker: `Movimentos`
- Título: `Movimento é respiração, não performance.`
- Texto: `Cada animação serve um estado emocional. Breathe é calma. Ring é atenção. Wave é presença.`

| Nome | Duração | Regra |
| --- | --- | --- |
| `Breathe` | `5.8s` | `Orb em idle. Escala sutil 1 -> 1.038.` |
| `Halo pulse` | `6s` | `Aura ao redor do orb. Opacidade e escala, sempre em segundo plano.` |
| `Ring` | `2.5s` | `Anel de gravação/reflexão. Opacidade 38% -> 95%.` |
| `Wave` | `0.82s` | `Barras do waveform durante gravação. Delays escalonados.` |
| `Screen enter` | `0.42s` | `Transição entre telas. Fade + translateY(10px -> 0).` |
| `Spin slow` | `20s` | `Camada interna do orb em reflecting. Rotação contemplativa.` |

Cada item renderiza um `code` no formato:

- `animation: <nome-em-kebab-case> <duração> ease-in-out infinite`

## Ilustrações

Seção:

- ID: `ilustracoes`
- Kicker: `Ilustrações`
- Título: `Abstrato, luminoso, nunca literal.`
- Texto: `Ilustrações Aurora são composições abstratas baseadas no gradiente do orb. Sem pessoas, sem ícones médicos, sem corações.`

Cards:

| Nome | Uso |
| --- | --- |
| `Repouso` | `Timeline vazia, estado idle` |
| `Transição` | `Entre estados, carregamento` |
| `Expansão` | `Novo insight, resultado` |
| `Gravidade` | `Estado ansioso, pesado` |

Regras:

- `Sempre abstrato`: `Composições de gradiente e forma. Nunca pessoas, rostos ou símbolos médicos.`
- `Baseado na paleta`: `Usa warm, pink, blue, mint e accent. Sem cores externas.`
- `Orb como âncora`: `O ícone do orb pode aparecer centrado como ponto focal.`

## Microinterações

Seção:

- ID: `microinteracoes`
- Kicker: `Microinterações`
- Título: `O produto responde com calma.`
- Texto: `Hover, foco, carregamento e feedback precisam confirmar ação sem criar urgência.`

| Interação | Regra |
| --- | --- |
| `Botão` | `Hover 120ms; foco com outline 2px e offset 3px.` |
| `Card de diário` | `Background +0.02 opacidade; borda +0.05; texto +0.15 em 200ms.` |
| `Carregamento` | `Texto claro com spinner discreto; nunca transformar espera em urgência.` |
| `MoodDot` | `Seleção persiste por cor e label, não por animação excessiva.` |
| `FeedbackMicro` | `Estado ativo silencioso, sem pontuação visível.` |

## Guardrails de agentes

Seção:

- ID: `guardrails`
- Kicker: `Guardrails de agentes`
- Título: `Regras que agentes devem obedecer.`
- Texto: `Este bloco espelha o guardrail em docs/agent-guardrails/design-system.md para consulta rápida.`

Regras renderizadas:

1. `Não prometer terapia, diagnóstico, cura, tratamento ou suporte emergencial.`
2. `Definir o papel do orb por viewport e respeitar o limite de um orb dominante fora do logo.`
3. `Não usar o orb como bullet, ícone genérico, enfeite de card ou textura de fundo.`
4. `Não usar Fraunces em métricas, tabelas, labels operacionais ou botões.`
5. `Não criar cards dentro de cards.`
6. `Não enviar email, nome, áudio, transcrição, reflexão ou resposta aberta para analytics.`
7. `Não criar tela nova sem checar mobile 390px e foco visível.`

## QA

Seção:

- ID: `qa`
- Kicker: `QA`
- Título: `Antes de publicar, compare.`
- Texto: `Exatidão vem de tokens, componentes e verificação visual em desktop e mobile.`

### Arquivos fonte

- `docs/design-system/index.md`
- `docs/design-system/reference.md`
- `docs/design-system/component-inventory.md`
- `docs/design-system/ui-ux-creation-brief.md`
- `docs/design-system/tokens.md`
- `docs/design-system/qa-checklist.md`
- `docs/agent-guardrails/design-system.md`

### Checks mínimos

- `Mobile 390px sem overflow.`
- `Desktop largo com hierarquia estável.`
- `Foco visível em interativos.`
- `npx tsc --noEmit` antes do handoff.

## O que não está autorizado por esta referência

- Usar o orb como decoração repetida.
- Usar um segundo orb dominante quando o logo ou hero já tiverem orb.
- Criar interface de produto com estética de landing.
- Criar admin editorial ou heroizado.
- Criar estados de IA sem microcopy calma e feedback legível.
- Usar Fraunces em dados, tabela, botão ou métrica.
- Criar cards dentro de cards.
- Criar copy sem acento, sem revisão ou com urgência artificial.
