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
- [x] Smoke script read-only: `npm run smoke:waitlist`.

## Variaveis obrigatorias em producao

- `CRON_SECRET`: segredo aleatorio para o Vercel Cron enviar como bearer token.
- `WAITLIST_ADMIN_TOKEN`: token para execucao manual/admin.
- `RESEND_WEBHOOK_SECRET`: signing secret do endpoint de webhook no Resend.
- `RESEND_API_KEY`: chave ja usada para envio; tambem permite instanciar o SDK que verifica o webhook.

Status local desta revisao: as variaveis nao estavam disponiveis na shell do Codex, entao a ativacao externa ainda precisa ser feita no Vercel/Resend.

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
