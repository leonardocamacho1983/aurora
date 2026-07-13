# Aurora Launch Hardening

## Escopo

Este documento registra os controles minimos para operar o funil de lancamento sem misturar produto/app, billing ou compliance amplo.

## Controles implementados no repo

- [x] `GET /api/waitlist/lifecycle` exige `Authorization: Bearer $CRON_SECRET`.
- [x] Execucao manual do lifecycle fica em `POST /api/waitlist/lifecycle?token=$WAITLIST_ADMIN_TOKEN`.
- [x] O lifecycle diario roda `runWaitlistMaintenance` antes de enviar emails.
- [x] Manutencao manual fica em `POST /api/waitlist/maintenance?token=$WAITLIST_ADMIN_TOKEN&dryRun=1`.
- [x] Emails com bounce, complaint ou suppressed entram em `waitlist_email_suppressed` e nao recebem novo envio.
- [x] Emails nao confirmados com 7+ dias entram em supressao operacional; com 30+ dias entram em arquivamento operacional.
- [x] `/admin` mostra saude de email: bloqueios duros, pausados, arquivados, reativados e ultimas execucoes.
- [x] `POST /api/resend/webhook` verifica assinatura Svix/Resend usando raw body e `RESEND_WEBHOOK_SECRET`.
- [x] Webhook do Resend grava eventos seguros em `waitlist_events`, sem conteudo de email, sem email do destinatario em metadata e sem URL completa de clique.
- [x] Admin passa a mostrar delivered, opened, clicked, bounced e complained dos ultimos 30 dias.
- [x] `/admin` mostra confiabilidade basica: `CRON_SECRET`, `RESEND_WEBHOOK_SECRET`, `RESEND_API_KEY`, ultimo lifecycle, ultima manutencao, ultimo webhook Resend e problemas recentes de email.
- [x] `GET/POST /api/observability/resend-webhook` exige token administrativo e audita/sincroniza o cadastro do webhook no Resend sem retornar segredo.
- [x] Sentry Next.js captura erros client/server com `sendDefaultPii=false`, sem session replay e com scrubbing de query string, tokens, emails, headers, cookies e campos sensiveis.
- [x] `POST /api/observability/sentry-smoke` exige token administrativo e envia apenas um evento tecnico controlado para validar a integracao.
- [x] Smoke script read-only: `npm run smoke:waitlist`.

## Variaveis obrigatorias em producao

- `CRON_SECRET`: segredo aleatorio para o Vercel Cron enviar como bearer token.
- `WAITLIST_ADMIN_TOKEN`: token para execucao manual/admin.
- `RESEND_WEBHOOK_SECRET`: signing secret do endpoint de webhook no Resend.
- `RESEND_API_KEY`: chave ja usada para envio; tambem permite instanciar o SDK que verifica o webhook.
- `NEXT_PUBLIC_SENTRY_DSN`: DSN publico do projeto Sentry para o SDK.
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`: usados pela build/deploy para release e sourcemaps.

Status desta revisao: `CRON_SECRET` existe em Production, o Vercel Cron esta ativo para `/api/waitlist/lifecycle`, `RESEND_WEBHOOK_SECRET` existe em Production, e `POST /api/resend/webhook` em producao responde `invalid webhook` para payload sem assinatura. O cadastro externo no painel/API do Resend deve ser acompanhado pelo sinal "Ultimo webhook Resend" no `/admin`.

Status Sentry desta revisao: as variaveis existem em Preview e Production via integracao Vercel. Preview cobre staging baseado em branch/deploy preview; se houver um ambiente/branch `staging` separado, ele deve herdar ou receber as mesmas variaveis antes de virar ambiente operacional.

## Privacidade de monitoramento

Sentry e Vercel observability sao ferramentas de erro e estabilidade, nao o pipeline de insight de produto.

- Nao enviar email, nome, audio, transcricao, reflexao, resposta aberta, prompt, entrada de diario ou payload bruto de API como contexto automatico de erro.
- Logs que passem por Vercel/Sentry devem ser tecnicos: rota, status, classe de erro, request id, duracao e flags fechadas.
- Entradas e reflexoes podem alimentar conteudo, marketing, GTM, produto, estrategia e personas, mas essa frente deve ser propria, controlada, auditavel e separada de monitoramento externo de erro.

Smoke de Sentry:

```bash
curl -X POST "https://www.faleaurora.com/api/observability/sentry-smoke?token=$WAITLIST_ADMIN_TOKEN"
```

Resposta esperada: `{"ok":true,"eventId":"..."}`. Depois, confirmar o evento "Aurora Sentry smoke test" no painel do Sentry.

## Manutencao de email

O cron de `/api/waitlist/lifecycle` roda uma etapa de higiene antes de selecionar candidatos para email. Essa etapa nao deleta linhas da `waitlist`; ela registra eventos auditaveis em `waitlist_events` para limpar a base operacional sem perder historico.

- `waitlist_email_suppressed` com `reason=provider_signal`: existe `email_bounced`, `email_complained` ou `email_suppressed`.
- `waitlist_email_suppressed` com `reason=unconfirmed_7d`: cadastro nao confirmado com 7 a 29 dias.
- `waitlist_email_archived` com `reason=unconfirmed_30d`: cadastro nao confirmado com 30+ dias.
- `waitlist_maintenance_run`: heartbeat da manutencao real, mesmo quando nao ha pessoa selecionada.
- `waitlist_lifecycle_run`: heartbeat da rotina diaria depois da manutencao e dos envios.

Regras de envio:

- Nao enviar lifecycle para contatos suprimidos, arquivados, bounced, complained ou suppressed.
- Nao enviar lembrete de 1 hora para nao confirmados.
- Enviar no maximo um lembrete de confirmacao entre 24 horas e 7 dias.
- Bloquear reenvio pelo formulario quando houver sinal duro de entrega (`bounce`, `complaint`, `suppressed`).
- Reativar bloqueio de inatividade se a propria pessoa voltar ao formulario; sinais duros de entrega nao sao reativados automaticamente.

## Endpoint Resend

Configure no Resend:

- Endpoint: `https://www.faleaurora.com/api/resend/webhook`
- Eventos: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`, `email.delivery_delayed`, `email.failed`, `email.suppressed`

Validacao operacional:

- Se o endpoint estiver sem `RESEND_WEBHOOK_SECRET`, ele retorna `503`.
- Se o endpoint estiver configurado e receber payload sem assinatura valida, ele retorna `400 invalid webhook`.
- Auditoria protegida: `GET /api/observability/resend-webhook?token=$WAITLIST_ADMIN_TOKEN` lista apenas status/eventos/match de signing secret.
- Sincronizacao protegida: `POST /api/observability/resend-webhook?token=$WAITLIST_ADMIN_TOKEN` reativa o webhook e corrige eventos quando o endpoint ja existe no Resend.
- Quando o Resend enviar um evento assinado real, o `/admin` deve atualizar "Ultimo webhook Resend" e os contadores de delivered/opened/clicked/bounced/complained.

## Smoke check

Read-only:

```bash
AURORA_SMOKE_BASE_URL=https://www.faleaurora.com npm run smoke:waitlist
```

Com cadastro controlado, apenas quando quiser disparar email de teste:

```bash
AURORA_SMOKE_BASE_URL=https://www.faleaurora.com \
AURORA_SMOKE_WRITE=1 \
AURORA_SMOKE_EMAIL=seu-email-de-teste@example.com \
npm run smoke:waitlist
```
