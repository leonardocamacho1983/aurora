# Aurora Launch Hardening

## Escopo

Este documento registra os controles minimos para operar o funil de lancamento sem misturar produto/app, billing ou compliance amplo.

## Controles implementados no repo

- [x] `GET /api/waitlist/lifecycle` exige `Authorization: Bearer $CRON_SECRET`.
- [x] Execucao manual do lifecycle fica em `POST /api/waitlist/lifecycle?token=$WAITLIST_ADMIN_TOKEN`.
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
