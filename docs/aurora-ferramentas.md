# Aurora Ferramentas

## Escopo

Este documento consolida ferramentas, integracoes e servicos que podem agregar valor a Aurora sem misturar funil de lancamento, produto/app, compliance e billing. Ele serve como mapa vivo para decidir o que configurar agora, o que instalar antes de acelerar trafego ou abrir o produto, e o que apenas avaliar depois. A regra principal e simples: nenhuma ferramenta deve entrar por curiosidade tecnica; ela precisa reduzir risco operacional, aumentar aprendizado real, proteger dados sensiveis, melhorar experiencia do usuario ou destravar crescimento com governanca.

Ultima revisao: 2026-06-20.

## Estado atual da Aurora

Ja existe ou ja esta em uso:

- [x] Next.js App Router na Vercel.
- [x] Vercel Analytics.
- [x] Supabase Auth e Supabase/Postgres.
- [x] Drizzle ORM.
- [x] Resend para emails transacionais.
- [x] PostHog para eventos e leitura de funil.
- [x] OpenAI e Anthropic para recursos de IA.
- [x] Waitlist viral, confirmacao por email, lifecycle inicial e admin operacional.
- [x] `faleaurora.com` como dominio PT-BR.
- [ ] `talkaurora.com` como frente EN/global futura.
- [x] Monitoramento simples no `/admin` para cron, webhook Resend e problemas recentes de email.
- [ ] Sentry ou equivalente externo para erro real de producao.
- [ ] Monitor sintetico externo para funis criticos.
- [x] Endpoint assinado do Resend pronto em producao para delivered/opened/clicked/bounced/complained.
- [ ] Confirmar evento real do Resend no `/admin` depois do proximo envio assinado.
- [ ] Ferramenta de consentimento/privacidade madura para escala internacional.

## Principios de decisao

- [ ] Preferir configurar melhor o que ja existe antes de adicionar fornecedor novo.
- [ ] Separar analytics de waitlist, analytics de produto e dados sensiveis do diario.
- [ ] Nunca enviar email, nome, transcricao, reflexao, audio ou respostas abertas para analytics generico.
- [ ] Privacidade e compliance entram antes de escala internacional.
- [ ] Billing/Stripe fica atras da decisao de modelo de negocio.
- [ ] Profissionais continuam como frente exploratoria ate haver validacao.
- [ ] Toda ferramenta nova precisa ter dono, objetivo, custo esperado, plano de rollback e criterio de sucesso.

## Matriz de prioridade

### Instalar ou configurar agora

Estas frentes tem alto valor e baixo risco para o momento atual.

| Ferramenta | Tipo | Por que agora | Acao recomendada | Cuidado |
|---|---|---|---|---|
| Sentry | Erros e performance | Hoje o produto ja tem rotas autenticadas, APIs, emails e banco. Erros silenciosos prejudicam confianca. | Instalar no Next.js, capturar erros server/client e filtrar PII. | Configurar scrubbing antes de ativar session replay. |
| Resend Webhooks | Email lifecycle | A estrategia de email depende de saber entrega, bounce, complaint e cliques. | Criar endpoint assinado e tabela/eventos de email. | Abertura de email e imperfeita; usar como sinal fraco, nao verdade absoluta. |
| PostHog Feature Flags e Experiments | Produto e growth | Ja existe PostHog. Permite testar CTA, pos-cadastro e onboarding sem redeploy pesado. | Criar flags para experimentos pequenos e persistentes. | Nao mandar conteudo sensivel; evitar experimento demais com pouca amostra. |
| Supabase Advisors / RLS review | Seguranca de dados | A Aurora lida com intimidade. RLS e grants precisam estar corretos antes de abrir produto. | Rodar advisors e documentar achados. | Corrigir com migracoes revisadas, nao direto em producao sem registro. |
| Checkly ou OpenStatus | Monitoramento sintetico | QA manual nao basta para login, waitlist, confirmacao e admin. | Comecar com 1 ou 2 checks: home e cadastro/status. | Browser checks podem gerar custo; controlar frequencia. |

### Configurar antes de acelerar trafego

Estas frentes nao precisam bloquear tudo hoje, mas devem existir antes de campanha maior, PR ou abertura ampla.

| Ferramenta | Tipo | Valor para Aurora | Momento ideal | Cuidado |
|---|---|---|---|---|
| Hookdeck ou fila equivalente | Webhooks confiaveis | Ajuda a receber webhooks de Resend/Stripe com retry, historico e replay. | Antes de depender de webhooks para lifecycle, billing ou auditoria. | Supabase Queues pode cobrir jobs internos; Hookdeck e mais forte para webhooks externos. |
| Supabase Cron | Jobs recorrentes | Pode rodar lifecycle, limpeza e manutencao perto do banco. | Quando jobs deixarem de ser acionados manualmente. | Proteger endpoints com segredo; evitar duplicidade com Vercel Cron. |
| Supabase Queues | Jobs internos | Fila duravel no Postgres para email, embeddings, resumos e tarefas assinc. | Quando diario/IA tiver volume real. | Manter mensagens sem PII desnecessaria. |
| Supabase Storage | Audio e arquivos | Necessario para diario por voz se o fluxo salvar audio temporario. | Antes de liberar diario amplo. | Politica clara de apagar audio apos transcricao, se essa for a decisao. |
| pgvector / Supabase Vector | Memoria e contexto | Base para memoria pessoal, busca semantica e reflexoes contextuais. | Depois de definir retencao e consentimento. | Embeddings podem ser dado sensivel derivado; tratar como dado protegido. |
| Consentimento e CMP leve | Compliance | Ajuda LGPD/GDPR, cookies, analytics e comunicacoes. | Antes de `talkaurora.com` e trafego internacional. | Evitar banner generico que nao reflete processamento real. |

### Avaliar depois

Boas oportunidades, mas ainda cedo para instalar.

| Ferramenta | Categoria | Possivel valor | Quando avaliar |
|---|---|---|---|
| Stripe | Billing | Assinaturas, checkout, portal, invoices e webhooks. | Depois de decidir modelo, planos, pricing e regras de acesso. |
| Loops, Customer.io ou similar | Lifecycle marketing | Jornadas mais ricas que emails transacionais. | Quando cadencia estiver validada e houver volume. |
| n8n self-host ou Pipedream | Automacoes internas | Operacoes sem criar painel proprio para tudo. | Quando houver processos repetitivos claros. |
| Metabase | BI open-source | Dashboards internos em cima do Postgres. | Quando admin interno nao bastar para analise. |
| Basedash | Admin/BI sobre Supabase | Admin rapido para suporte e operacao. | Se o `/admin` ficar limitado para operacao manual. |
| Bemi | Audit trail open-source | Auditoria automatica de mudancas no Postgres. | Antes de profissional, billing ou dados sensiveis em escala. |
| Directus | CMS/admin open-source | Conteudo, paginas e colecoes gerenciaveis. | Se Aurora precisar de CMS real para manifesto, paginas e conteudo editorial. |
| Sanity | CMS | Conteudo editorial e internacionalizacao com workflow. | Se houver equipe editorial ou localization intensa. |
| Crowdin, Lokalise ou Tolgee | Localizacao | Workflow de traducao e revisao PT-BR/EN. | Antes de abrir `talkaurora.com` de verdade. |
| OpenPanel ou Plausible | Analytics privacy-friendly | Analitica simples e menos invasiva. | Se PostHog/Vercel Analytics ficarem pesados para paginas publicas. |
| Vercel Firewall / Bot protection | Seguranca | Mitigar abuso em signup, APIs e rotas sensiveis. | Quando houver trafego pago, bots ou abuso. |
| Vercel Edge Config | Config remota | Flags simples, banners, datas de lancamento. | Quando houver data oficial e contagem regressiva. |

## Vercel Marketplace

### Recomendadas para Aurora

- [ ] **Sentry**: prioridade alta. Captura erros client/server, performance e releases. Valor direto: saber quando login, diario, admin, email ou APIs quebram sem depender de print do usuario.
- [ ] **Checkly**: prioridade media-alta. Monitora rotas e fluxos criticos com checks de API ou browser. Valor direto: detectar funil quebrado antes de campanha.
- [ ] **PostHog**: ja usado. Manter como camada de produto, funis, flags e A/B tests. Valor direto: aprender sobre ativacao sem enviar conteudo sensivel.
- [x] **Supabase**: ja usado. Manter como banco/auth/storage potencial. Valor direto: Postgres, Auth, RLS, Storage, Vector, Cron e Queues no mesmo ecossistema.
- [x] **Resend**: ja usado. Proximo passo e webhook, nao trocar ferramenta.
- [ ] **Stripe**: nao instalar ainda. Valor claro, mas depende de modelo de negocio.
- [ ] **Sanity**: avaliar depois. Pode ajudar se a Aurora virar uma experiencia editorial/localizada com muitas paginas e idiomas.

### Regra para instalar via Vercel

- [ ] Instalar via Marketplace apenas quando houver projeto correto vinculado e ambiente confirmado.
- [ ] Conferir env vars geradas antes de deploy.
- [ ] Documentar custo, dono e motivo em `docs/aurora-ferramentas.md`.
- [ ] Nunca adicionar ferramenta paga sem estimativa de uso.

## Supabase: integracoes e recursos nativos

### Prioridade alta

- [ ] **RLS e Security Advisors**: revisar tabelas expostas, policies, grants, views e service role. A Aurora nao pode confiar apenas em boas intencoes de backend.
- [ ] **Database Webhooks**: util para disparar fluxos quando linhas mudam. Bom para prototipos e automacoes simples. Para webhooks externos com retries/replay, avaliar Hookdeck.
- [ ] **Cron**: bom para lifecycle recorrente, limpeza e verificacoes. Pode substituir ou complementar Vercel Cron, mas deve haver uma unica fonte de verdade por job.
- [ ] **Storage**: usar quando audio do diario precisar ser armazenado temporariamente. Criar buckets privados, URLs assinadas e politica de apagamento.

### Prioridade media

- [ ] **Queues**: usar para tarefas internas duraveis: email, embeddings, digest, limpeza, reprocessamento. Boa opcao quando a tarefa vive perto do banco.
- [ ] **pgvector / Vector**: usar para memoria e contexto do diario, com consentimento e retencao definidos.
- [ ] **Edge Functions**: considerar para webhooks ou tarefas proximas do Supabase. No app Next/Vercel, nao duplicar logica sem necessidade.
- [ ] **Realtime**: avaliar se houver experiencia viva, como reflexao em andamento, sala colaborativa ou status instantaneo.

### Marketplace Supabase

Ferramentas a observar:

- [ ] **Bemi**: audit trail open-source para Postgres. Bom para compliance, billing, admin e suporte.
- [ ] **Basedash**: admin/BI rapido para operar dados Supabase sem construir tudo no `/admin`.
- [ ] **Directus**: open-source, bom para CMS/admin se Aurora precisar gerenciar conteudo estruturado.
- [ ] **Metabase**: BI open-source para dashboards mais flexiveis que o admin interno.
- [ ] **n8n**: automacoes self-host/open-source para operacao e integracoes internas.

## Email e lifecycle

### Agora

- [x] Resend envia confirmacao, status, milestone e lifecycle inicial.
- [x] Criar endpoint assinado para webhook Resend:
  - [x] `delivered`
  - [x] `opened`
  - [x] `clicked`
  - [x] `bounced`
  - [x] `complained`
- [x] Salvar `RESEND_WEBHOOK_SECRET` no Vercel e validar endpoint em producao.
- [ ] Confirmar no `/admin` que o Resend enviou ao menos um evento assinado real para o endpoint.
- [x] Criar tabela ou evento interno seguro para email:
  - [x] tipo do email
  - [x] provider
  - [x] status
  - [x] timestamp
  - [x] erro tecnico, quando houver
  - [x] sem conteudo do email
- [ ] Criar admin de email com:
  - [ ] enviados
  - [ ] falhas
  - [ ] bounces
  - [ ] complaints
  - [ ] confirmacao depois do email
  - [ ] pendentes ha 24h

### Depois

- [ ] Avaliar Loops ou Customer.io se o lifecycle ficar complexo.
- [ ] Avaliar Hookdeck antes de depender fortemente de webhooks externos.
- [ ] Criar segmentacao por comportamento sem usar conteudo sensivel.

## Produto e analytics

### PostHog

- [x] Eventos de waitlist configurados.
- [ ] Separar taxonomy:
  - [ ] `waitlist_*`
  - [ ] `product_onboarding_*`
  - [ ] `diary_*`
  - [ ] `account_*`
  - [ ] `email_*`
- [ ] Criar feature flags para:
  - [ ] CTA hero
  - [ ] copy pos-cadastro
  - [ ] onboarding contextual
  - [ ] primeira tela do diario
- [ ] Criar funis:
  - [ ] visitante -> cadastro -> confirmacao -> link pessoal -> convite
  - [ ] login -> onboarding -> primeira gravacao -> reflexao -> retorno

### Vercel Analytics

- [x] Manter como leitura simples de trafego e paginas.
- [ ] Usar para sanidade de topo de funil, nao para produto profundo.

## Observabilidade e confiabilidade

- [x] **Admin reliability**: monitorar cron, endpoint Resend, ultimo webhook e problemas recentes de email.
- [ ] **Sentry**: instalar quando houver projeto/DSN definido para erro real externo.
- [ ] **Checkly/OpenStatus**: monitorar home, API de waitlist e login. Depois, monitorar diario.
- [ ] **Vercel Logs/Observability**: usar para investigacao de deploy e funcao.
- [ ] **Supabase Logs/Advisors**: revisar auth, database, RLS e performance.

Checks minimos sugeridos:

- [ ] `GET /` retorna 200 e contem CTA principal.
- [ ] `GET /faq` retorna 200.
- [ ] `POST /api/waitlist` com email de teste controlado retorna sucesso ou resposta esperada.
- [ ] `GET /login` retorna 200.
- [ ] `GET /diario` deslogado redireciona corretamente.
- [ ] `GET /admin` sem token nao expoe dados.

## Compliance e privacidade

Ferramentas possiveis:

- [ ] CMP leve para cookies/consentimento, quando houver tracking internacional.
- [ ] Bemi ou audit trail equivalente para mudancas sensiveis no banco.
- [ ] Export/delete account via rotas internas antes de ferramenta externa.
- [ ] DPA/subprocessadores documentados para Vercel, Supabase, Resend, PostHog, OpenAI, Anthropic e futuros provedores.

Regra:

- [ ] Ferramenta de compliance nao substitui decisao de produto. Primeiro definir dados, retencao, consentimento e exclusao.

## IA, memoria e dados sensiveis

- [ ] Manter OpenAI/Anthropic como provedores atuais.
- [ ] Avaliar Vercel AI Gateway depois, se houver necessidade de roteamento, fallback, limites e custo consolidado.
- [ ] Usar pgvector/Supabase Vector apenas depois de politica clara para embeddings.
- [ ] Considerar prompt/version tracking interno antes de ferramenta externa.
- [ ] Nao enviar diario bruto para ferramentas de analytics, session replay ou suporte.

## Ferramentas por fase

### Fase 1: agora, antes de mais trafego

- [ ] Sentry.
- [ ] Resend Webhooks ativos em producao.
- [ ] PostHog flags/experiments basicos.
- [ ] Supabase Security Advisors/RLS review.
- [ ] Monitor simples com Checkly ou OpenStatus.

### Fase 2: antes de abrir produto para mais usuarios

- [ ] Supabase Storage com politica de audio.
- [ ] Supabase Queues ou outra fila para jobs internos.
- [ ] Cron automatico governado.
- [ ] Dashboard de ativacao do produto.
- [ ] Processo de exclusao/exportacao de dados.

### Fase 3: antes de internacionalizar

- [ ] i18n workflow para PT-BR/EN.
- [ ] Consentimento/cookies por regiao.
- [ ] Revisao LGPD/GDPR/California.
- [ ] Subprocessadores documentados.
- [ ] `talkaurora.com` com estrategia propria, nao apenas traducao.

### Fase 4: antes de monetizar

- [ ] Modelo de negocio decidido.
- [ ] Stripe em ambiente test.
- [ ] Webhooks de billing com retry/replay.
- [ ] Tabela de subscriptions.
- [ ] Portal de billing.
- [ ] Politica de trial, cancelamento, grace period e impostos.

## Decisoes recomendadas neste momento

- [ ] Nao instalar Stripe agora.
- [ ] Nao instalar CMS agora.
- [ ] Nao trocar Resend agora.
- [ ] Nao trocar PostHog agora.
- [ ] Instalar/configurar Sentry antes de abrir mais produto.
- [ ] Configurar Resend Webhooks no Resend/Vercel antes de aumentar cadencia de email.
- [ ] Usar Supabase Queues/Cron apenas quando jobs forem automatizados de verdade.
- [ ] Tratar Bemi/Metabase/Basedash como avaliacao, nao urgencia.

## Fontes consultadas

- Vercel Marketplace e integracoes: https://vercel.com/marketplace
- Vercel Integrations docs: https://vercel.com/docs/integrations
- Vercel changelog sobre Sentry, Checkly e Dash0: https://vercel.com/changelog/sentry-checkly-and-dash0-join-the-vercel-marketplace
- Supabase Integrations docs: https://supabase.com/docs/guides/integrations
- Supabase Marketplace docs: https://supabase.com/docs/guides/integrations/supabase-marketplace
- Supabase Database Webhooks: https://supabase.com/docs/guides/database/webhooks
- Supabase Cron: https://supabase.com/modules/cron
- Supabase Queues: https://supabase.com/docs/guides/queues
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase pgvector: https://supabase.com/docs/guides/database/extensions/pgvector
- PostHog Feature Flags: https://posthog.com/docs/feature-flags
- PostHog Vercel Marketplace integration: https://posthog.com/docs/integrations/vercel-marketplace
- Sentry pricing/free developer plan: https://sentry.io/pricing/
- Checkly pricing: https://www.checklyhq.com/pricing/
- Resend pricing: https://resend.com/pricing
