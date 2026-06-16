# Aurora — Decisões de design: interações do Diário (`/diario`)

> Registro das decisões de UX/UI tomadas para o loop central (gravar → refletir →
> resultado). Fonte da verdade pra evoluir a tela sem reabrir o que já foi decidido.
> Âncoras: Design System v0.1 §5 (orb), Handoff §5 (pipeline), §6 (telas), §8 (crise),
> §10 (privacidade), §13 (guardrails).

## Princípio-guia
**Uma tela só, sem rolagem, sem escolhas desnecessárias.** O Diário é um momento calmo,
não um formulário. O orb é o herói e o único controle; texto é mínimo; nada de "modos"
ou botões competindo. Anti-ansiedade acima de tudo.

## 1. O orb é o controle (e a única affordance)
- **Tocar no orb** é a ação central — não há botão "Gravar" separado.
- Estados do orb como máquina de estados visual (DS v0.1 §5):
  - **Repousa (idle)** → "Toque para falar".
  - **Floresce (recording)** → tocar de novo para parar.
  - **Gira (reflecting)** → ocupado; não clicável (`aria-busy`).
  - **Resultado** → o orb vira um **sol calmo (idle, respirando)** atrás do card.
  - **Crise** → orb desabilitado + sheet de recursos.
  - **Erro** → mensagem na tela; orb volta ao repouso.

## 2. Composição "sol atrás do card" (vista de resultado)
- O orb cresce para **~440px (sol)** e **escorrega para a esquerda**; o **card entra da
  metade do orb até a direita**, sobrepondo o sol.
- O orb **ilumina o card**: glow + um brilho radial vazando do lado do sol; card com
  vidro fosco (backdrop blur). Em telas estreitas, empilha (sol em cima, card abaixo).
- **Continuar falando:** tocar no orb (parte exposta à esquerda) → ele "sobe" pro centro
  (gravando → refletindo) → o card **atualiza** com a nova reflexão.
  - *Hoje:* cada nova gravação gera uma nova entrada cuja reflexão substitui o card.
  - *Futuro (em aberto):* anexar de verdade à mesma entrada / fio de conversa.

## 3. Fluxo de voz e privacidade (§6, §10)
- `getUserMedia` → `MediaRecorder` → ao parar, o blob vai **inline (multipart)** para
  `/api/transcribe`; **o áudio nunca é persistido** (transcrição em memória, §10).
- Transcrição → `/api/reflect` (pipeline §5). Os estados do orb seguem cada fase.

## 4. Crise primeiro, sem reflexão na crise (§8, §13)
- Se `/api/reflect` responde `status:"crisis"`, a tela mostra **só o sheet de recursos**
  (CVV 188 por locale), **sem nenhuma reflexão**, orb desabilitado.
- O classificador roda SEMPRE antes da reflexão (garantido no backend, §13).

## 5. Fail-loud
- Qualquer erro (microfone, rede, pipeline) **aparece na tela**; **nunca** vira uma
  reflexão inventada. Erro tem `role="alert"`.

## 6. Direção de arte / tipografia
- **Fraunces (serifa) só no falado/reflexão:** prompt do dia + texto da reflexão.
  Inter no resto (metainfo, trechos, controles).
- **Ênfase do modelo vira itálico:** `*assim*`/`_assim_` são renderizados como itálico
  (e `**x**` como negrito) — nunca mostramos asteriscos crus. Itálico em Fraunces lê como
  ênfase editorial, "premium". (`lib/render-prose.tsx`)
- **Sem rótulo "IA:"**, sem clichê de coach, sem promessa de cura (vem do system prompt §5).
- **Glifo do orb** marca o cartão; o orb é a assinatura/manifestação da Aurora.
- **Calma nas animações:** "gira" é um facho de luz percorrendo o orb (legível, não um
  spinner ansioso); "exala" é uma respiração lenta e suave; `prefers-reduced-motion`
  respeitado (glow fixo, sem anéis/rotação).

## 7. Salvar é automático; editar é discreto
- A entrada é **salva automaticamente** por `/api/reflect` (retorna `entryId`).
- A vista de resultado **não tem "Salvar"** — só um **"Concluir"** de baixo destaque.
  Isso mantém a tela limpa ("sem escolher").
- A **edição explícita** (transcrição editável + chips de humor + Salvar) existe no
  backend (`PATCH /api/entries/[id]`), mas foi **tirada da vista do Diário** para não
  poluir; vai morar no **detalhe da entrada** (a partir da timeline), onde editar uma
  entrada faz mais sentido.

## 8. Humor
- Sugerido pelo Haiku (§5), exibido como um **ponto de cor discreto, somente leitura** no
  resultado — **não** é um passo obrigatório de escolha. As cores de humor são os únicos
  acentos de cor (consistente com a timeline).

## 9. Acessibilidade (DS v0.1 §2/§4)
- Orb é um `<button>` real, focável, com **`aria-label` por estado**.
- Alvos ≥44px (o orb é bem maior); **foco visível** (anel 2px do token `--focus`).
- Copy em pt-BR; contraste ≥ AA (tokens v0.1).

## 10. Navegação
- No repouso, link discreto **"Linha do tempo"** → `/timeline`.
- A timeline volta pelo botão **no formato do orb** ("Nova entrada") → `/diario`.

## Em aberto (decisões futuras)
- Transformar `/diario` na home `/` e tratar o **onboarding** (1ª gravação antes do
  cadastro — aha-moment, §6.1).
- **Continuidade** ("você voltou. 3 dias seguidos.").
- **Detalhe/edição** da entrada ao abrir um card da timeline.
- **CTA "Levar para a terapia"** (§6.6 / Fase 4).
- "Complementar" de verdade a mesma entrada com uma 2ª gravação (fio de conversa).
- **Prompt do dia** hoje é fixo ("O que está vivo em você agora?"); pode virar dinâmico.
