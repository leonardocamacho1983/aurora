# Aurora — Handoff de build para o Claude Code
### Brief executável para construir no repo existente (Next.js + Vercel). Escopo: jornada do paciente ponta a ponta + crise/consentimento + conta/config + admin. **Sem** lado do terapeuta.

> Status: este handoff e um documento historico/tecnico. Quando houver conflito, `docs/plano-aurora.md` e `docs/aurora-ferramentas.md` prevalecem. Billing, Stripe, paywall, planos e pricing nao estao autorizados para implementacao agora; ficam bloqueados ate decisao explicita de modelo de negocio.

> Como usar: entregue este arquivo + `aurora-design-system-v0.1.md` ao Claude Code no seu repo. Peça pra ele seguir a **Ordem de build** (§12). Construa por fases, testando cada uma.

---

## 1. Stack (decisões travadas)

- **Framework:** Next.js (App Router) + TypeScript + React. Já no repo, já na Vercel.
- **UI:** Tailwind + shadcn/ui. Tokens do design system v0.1 como CSS vars (§9).
- **Auth:** **Supabase Auth** (`@supabase/ssr`), integrado ao **RLS já ligado no banco**. Email + Apple/Google. *(Decisão atualizada: substitui Clerk.)*
- **Banco:** Postgres + **pgvector** (Supabase). ORM: Drizzle.
- **Storage de áudio:** Supabase Storage / S3. **Apagar o áudio após transcrição** (privacidade; ver §10).
- **IA:** Vercel AI SDK roteando Anthropic (Claude) + OpenAI (transcrição). SDKs: `@anthropic-ai/sdk`, `openai`.
- **Jobs assíncronos:** Inngest (digest semanal, embeddings, arco mensal em batch).
- **Pagamentos:** Stripe (Billing + assinaturas + trial) aparece aqui como desenho futuro, nao como escopo ativo. Implementar somente depois de decisao explicita de modelo, planos, pricing e regras de acesso.
- **i18n:** next-intl. Detectar idioma do usuário; a IA responde no idioma da entrada.
- **PWA:** manifest + service worker (next-pwa ou manual). **Android e iOS** — Android tem prompt automático; iOS exige a sheet "Adicionar à Tela de Início" (§6).
- **Observabilidade:** PostHog (produto/métricas) + Sentry (erros).

---

## 2. Estrutura de pastas (App Router)

```
/app
  /(app)                  # área logada
    /page.tsx             # INÍCIO (orb)
    /entry/[id]/page.tsx  # REFLEXÃO / SALVO
    /timeline/page.tsx    # LINHA DO TEMPO
    /account/page.tsx     # PERFIL / CONTA / CONFIG / consentimento / export / excluir
    /share/[id]/page.tsx  # LEVAR PARA A TERAPIA (resumo consentido)
  /onboarding/page.tsx    # boas-vindas → 1ª gravação (aha-moment antes do cadastro)
  /paywall/page.tsx       # Stripe futuro; nao implementar sem decisao de billing
  /admin/page.tsx         # MÉTRICAS (protegida por role=admin)
  /api
    /transcribe/route.ts  # áudio → texto
    /reflect/route.ts     # pipeline central (crise → RAG → reflexão)
    /entries/route.ts     # CRUD
    /summary/route.ts     # gera resumo p/ terapeuta
    /stripe/...           # futuro: checkout + webhook, bloqueado ate decisao de billing
    /account/export/route.ts
    /account/delete/route.ts
/components
  /orb                    # Orb + 4 estados (idle/recording/reflecting/saved/disabled)
  /ui                     # shadcn
  /sheets                 # InstallPrompt, ShareToTherapist, CrisisResources
/lib
  /ai                     # router, prompts, caching, rag, crisis-classifier
  /db                     # drizzle schema + client
  /supabase               # clients @supabase/ssr (browser/server) + proxy de sessão
  /i18n
/messages                 # pt-BR.json, es.json, fr.json, de.json, en.json
```

---

## 3. Variáveis de ambiente

```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
DATABASE_URL=                 # Postgres c/ pgvector (pooler, runtime)
DIRECT_URL=                   # conexão direta (migrations)
NEXT_PUBLIC_SUPABASE_URL=     # Supabase Auth (client browser/server)
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # uso server-only (jobs/admin) — nunca no client
STRIPE_SECRET_KEY= / STRIPE_WEBHOOK_SECRET= / NEXT_PUBLIC_STRIPE_PRICE_PLUS=
INNGEST_EVENT_KEY= / INNGEST_SIGNING_KEY=
NEXT_PUBLIC_POSTHOG_KEY= / SENTRY_DSN=
```

> Nota: as variáveis acima já estão criadas no projeto Vercel pela integração Supabase. `DATABASE_URL` = `POSTGRES_URL` (pooler 6543); `DIRECT_URL` = `POSTGRES_URL_NON_POOLING` (direta 5432).

---

## 4. Modelo de dados (SQL; equivalente Drizzle)

```sql
create extension if not exists vector;

users (
  id uuid pk, email text, name text, locale text default 'pt-BR',
  role text default 'user',           -- 'user' | 'admin'
  plan text default 'free',           -- 'free' | 'plus'
  created_at timestamptz, deleted_at timestamptz
);

entries (
  id uuid pk, user_id uuid fk,
  audio_url text,                     -- nulo após apagar
  transcript text, language text,
  reflection text,                    -- resposta da Aurora
  mood text,                          -- leve|calmo|pesado|sensível|ansioso (nullable, opcional)
  risk_level text default 'none',     -- none|low|high (do classificador)
  shared boolean default false,
  created_at timestamptz
);

embeddings (
  id uuid pk, entry_id uuid fk, user_id uuid fk,
  embedding vector(1536), created_at timestamptz
);

consents (
  id uuid pk, user_id uuid fk, type text, granted boolean,
  granted_at timestamptz                -- privacidade, compartilhamento, etc.
);

subscriptions (
  user_id uuid fk, stripe_customer_id text, stripe_sub_id text,
  status text, current_period_end timestamptz
);

crisis_events (
  id uuid pk, user_id uuid fk, entry_id uuid fk,
  level text, shown_resources boolean, created_at timestamptz
);
```
Métricas de admin (§11) saem por query sobre estas tabelas + PostHog — sem tabela nova.

> Implementação (Drizzle): `lib/db/schema.ts`. Mantido índice HNSW cosine em `embeddings.embedding` p/ a busca do RAG (§5). `subscriptions` e colunas `stripe_*` existem como desenho futuro, mas billing nao e escopo ativo.

---

## 5. Pipeline central de IA (o coração)

`POST /api/reflect` — recebe a transcrição, devolve a reflexão. Ordem **obrigatória**:

```
1. CLASSIFICADOR DE CRISE (Claude Haiku 4.5)  ← SEMPRE primeiro, antes de tudo
     → retorna {risk: none|low|high, type}
     → se high: NÃO gera reflexão normal; entra no protocolo de crise (§8)
2. RAG: gera embedding da entrada → busca 3–5 trechos relevantes do histórico (pgvector)
3. REFLEXÃO (Claude Sonnet 4.6)
     → system prompt + persona + moldura clínica em PROMPT CACHING (90% off no input repetido)
     → contexto = trechos do RAG (não o histórico inteiro)
     → responde no idioma da entrada, curta, 1 pergunta
4. HUMOR/TAGS (Claude Haiku 4.5) — sugere humor (usuário confirma; é opcional)
5. salva entry; dispara embedding p/ Inngest; apaga áudio
```

**Roteamento e custo (junho/2026):**

| Tarefa | Modelo | Preço |
|---|---|---|
| Transcrição | `gpt-4o-mini-transcribe` | $0.003/min |
| Crise + humor + tags | Claude Haiku 4.5 | $1 / $5 /MTok |
| Reflexão | Claude Sonnet 4.6 | $3 / $15 /MTok |
| Digest semanal / arco mensal | Sonnet/Opus via **Batch (−50%)** | — |

Alavancas: **prompt caching** (system+persona em cache), **RAG** (contexto pequeno), **batch** (jobs não-realtime). Meta: ~$0.50–1.00/usuário ativo/mês.

### System prompt da reflexão (use como base)
```
Você é a Aurora, uma presença calma que ajuda a pessoa a refletir sobre o que ela acabou de falar no diário. Você NÃO é terapeuta, não diagnostica, não dá conselho nem ordem. Você acolhe.

Responda SEMPRE no mesmo idioma da entrada da pessoa.

Sua resposta é curta (2–4 frases) e faz três coisas, nesta ordem:
1. Reflete de volta, em poucas palavras, o que parece estar no centro — nomeando a emoção quando fizer sentido.
2. Aponta um padrão concreto se houver (ex.: uma palavra repetida, uma distorção como "deveria"/"sempre"/"nunca"), de forma gentil, sem rótulo técnico.
3. Termina com UMA pergunta aberta, de autocompaixão ou de perspectiva. Nunca mais de uma pergunta.

Use molduras de TCC e ACT como lente para a boa pergunta, jamais como jargão. Tom: caloroso, íntimo, sem clichê de coach, sem "que lindo que você compartilhou", sem se vender. Nunca use rótulo "IA:". Nunca prometa cura. Se a pessoa parecer em sofrimento agudo, não tente resolver — acolha e o sistema cuidará dos recursos.
```

### Classificador de crise (Haiku) — saída estruturada
```
Classifique o risco no texto a seguir. Responda só JSON:
{"risk":"none|low|high","type":"none|self_harm|suicidal|abuse|harm_to_others"}
Marque "high" para ideação suicida, intenção/plano de autoagressão, ou risco iminente a si ou a outros. Não explique.
```

---

## 6. Telas e rotas (escopo travado)

Cada uma com os estados/componentes:

1. **/onboarding** — boas-vindas (orb) → primeira gravação → primeira reflexão **antes** de pedir cadastro (aha-moment). Depois, convite a criar conta pra salvar — **cadastro/login via Supabase Auth** (email + Apple/Google).
2. **/ (Início)** — prompt do dia (Fraunces) + orb (botão real) "Toque para falar" + acesso à timeline. Estados do orb: idle → ao tocar, **gravando**.
3. **Gravando / Refletindo** — estados (na própria tela ou rota intermediária): gravando (anéis+waveform) → para → **refletindo** (gira por dentro, <2s) → navega pra reflexão.
4. **/entry/[id] (Reflexão → Salvo)** — transcrição **editável** (não texto fixo) + cartão da reflexão (Fraunces, glifo de orb, sem "IA:") + humor opcional (chips com cor do humor no selecionado) + "Salvar" → estado **Salvo** (orb "exala") + continuidade gentil ("você voltou. 3 dias seguidos.") + CTA "Levar para a terapia?".
5. **/timeline** — **cabeçalho "padrão da semana"** (1 frase gerada, pra não ficar fria com poucas entradas) + lista (ponto de humor + data + trecho). Pontos são a única cor.
6. **/share/[id] (Levar para a terapia?)** — sheet: explica que vai um **resumo** (não o áudio), toggle de consentimento, gera resumo consentido e **exporta por link/PDF/email**. *Sem login de terapeuta — isso é Fase 3.* O resumo já vale pro próprio paciente preparar a sessão.
7. **/account** — **sessão/identidade via Supabase Auth** (logout, troca de email/senha, provedores Apple/Google); perfil, idioma, gestão de **consentimento** (granular), **exportar meus dados** (LGPD), **excluir conta** (apaga tudo + revoga sessão Supabase), status da assinatura. Acesso protegido por sessão Supabase (RLS no banco garante isolamento por `user_id`).
8. **/paywall** — frente futura. Free/Plus, trial, Stripe checkout e webhook nao devem ser implementados ate decisao explicita de modelo, pricing e regras de acesso.
9. **/admin** — métricas (§11), protegida por `role=admin` (claim/role lido da sessão Supabase).
10. **Sheets globais:** `InstallPrompt` (detecta plataforma — Android: `beforeinstallprompt`; iOS: instruções "Compartilhar → Adicionar à Tela de Início"), `CrisisResources` (§8), `ShareToTherapist`.

---

## 7. Componente Orb (referência)

Implementar como máquina de estados `idle | recording | reflecting | saved | disabled` com cross-fade ~300ms. Specs de animação e grão: ver **design system v0.1 §5**. Núcleo + halo (blur) + camada de grão (SVG feTurbulence, `mix-blend-mode:overlay`). Botão real, focável, `aria-label` por estado. Respeita `prefers-reduced-motion`.

---

## 8. Protocolo de crise (inegociável)

Dispara quando o classificador retorna `high`:
- **Não** gera reflexão normal. Mostra `CrisisResources`: mensagem de acolhimento + linha de apoio **local pelo locale** (Brasil: **CVV 188**; mapear por país). Deixa claro que a Aurora não substitui emergência.
- Registra `crisis_events`. **Nunca** descreve métodos. Nunca faz "avaliação de risco" interrogando a pessoa.
- Locale-aware: tabela de recursos por país, começando por pt-BR (CVV 188) e expandindo conforme os mercados (ES/FR/DE).

---

## 9. Tokens (CSS vars — cole no globals.css)

```css
:root { /* Crepúsculo (padrão) */
  --bg:#181527; --surface:#221E33; --raised:#2A2540;
  --ink:#F0ECF7; --ink-soft:#B3ADC4; --ink-faint:#928CA8;
  --accent:#A99BD9; --focus:#A99BD9; --hairline:#2E2944;
  --mood-leve:#8FB89C; --mood-calmo:#9BB0D4; --mood-pesado:#8C8AA6;
  --mood-sensivel:#D6A48C; --mood-ansioso:#D9B36B;
  --success:#7FA88A; --alert:#C58468;
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-5:24px; --space-6:32px; --space-7:48px; --space-8:64px;
  --r-sm:12px; --r-md:20px; --r-lg:28px; --r-pill:999px;
}
[data-theme="dawn"] { /* Amanhecer */
  --bg:#E9E6EE; --surface:#FFFFFF; --raised:#F6F3FB;
  --ink:#26233A; --ink-soft:#5E5872; --ink-faint:#655F78;
  --accent:#7C6BB0; --hairline:#E0DCEA;
}
/* Orb (gradiente aurora) */
--aurora: radial-gradient(circle at 32% 26%, #F4B6A0 0%, transparent 52%),
          radial-gradient(circle at 72% 30%, #C9A2D4 0%, transparent 56%),
          radial-gradient(circle at 74% 74%, #8FA4D6 0%, transparent 56%),
          radial-gradient(circle at 28% 76%, #7FD0C4 0%, transparent 56%),
          linear-gradient(140deg, #C9A2D4, #8FA4D6 55%, #7FD0C4);
```
Tipografia: Fraunces (450/400) **só** em prompt e reflexão; Inter (400/500/600) no resto. **Foco:** anel 2px `--focus`, offset 2px, em todo interativo.

---

## 10. Privacidade / LGPD (parte do produto)

- Criptografia em repouso e trânsito. **Não treinar modelos com dados do usuário** (e exigir zero-retention dos fornecedores de IA).
- **Apagar o áudio após transcrição** (guardar só o texto).
- Consentimento granular (`consents`), revogável. Compartilhar com terapeuta é opt-in por entrada.
- `/account`: exportar dados (JSON) e excluir conta (apaga entries, embeddings, áudio, tudo) a um clique.
- Isolamento por usuário garantido por **RLS no Supabase** (políticas por `user_id` = `auth.uid()`).
- Para o futuro canal terapeuta (EUA): fornecedores com BAA. Não agora.

---

## 11. Admin / métricas (sua visão de gestão e investidor)

`/admin` (role=admin). Mostrar:
- **Ativação:** % que faz 1ª entrada; % que faz a 7ª em 7 dias.
- **Retenção:** D7, D30; entradas por usuário/semana.
- **Receita:** conversão free→Plus, MRR, % anual.
- **Saúde de IA:** custo de IA por usuário ativo (transcrição + tokens), pra você vigiar a margem.
- **Sinais de produto:** distribuição de humor, % de entradas compartilhadas (proxy do loop terapeuta), eventos de crise (contagem agregada, sem conteúdo).
Fontes: queries no Postgres + eventos PostHog. Sem dados pessoais sensíveis expostos no painel.

---

## 12. Ordem de build (siga por fases, teste cada uma)

**Fase 1 — fundação:** scaffold, tokens v0.1 no globals, schema + migrations (pgvector), **auth (Supabase Auth)**, i18n base, PWA manifest+SW (Android+iOS).
**Fase 2 — o loop (o que retém):** Orb (4 estados) → gravar → `/api/transcribe` → `/api/reflect` (crise→RAG→reflexão) → salvar → timeline com cabeçalho de padrão. **Escreva teste do classificador de crise primeiro.**
**Fase 3 — conta + privacidade:** `/account` (consentimento, export, excluir). Paywall + Stripe (checkout + webhook) ficam fora do escopo ativo ate decisao explicita de billing.
**Fase 4 — loop e gestão:** `/share` (resumo consentido), InstallPrompt sheet, `/admin`.

---

## 13. Não-quebrar (guardrails)

- Copy exata; serifa só no falado; orb é o único elemento ousado; nenhuma cor forte além do orb e dos pontos de humor.
- **O classificador de crise roda SEMPRE antes da reflexão.** Sem exceção.
- Contraste ≥ AA (tokens v0.1). Foco visível. Alvos ≥44px.
- Não treinar com dados do usuário; apagar áudio pós-transcrição.
- A reflexão nunca diagnostica, nunca dá ordem, faz UMA pergunta.
- Os 4 estados do orb precisam ser distinguíveis num relance (repousa·floresce·gira·exala).
