# Lifecycle de email com Resend

## Objetivo

Usar Resend como camada de execucao para Contacts, Segments, Topics e Automations,
mantendo a Aurora como fonte da verdade sobre acesso, Ritual, produto e frequencia.

## Guardrails

- Nao enviar respostas abertas do Ritual para o Resend.
- Nao enviar transcricao, audio, reflexao ou conteudo do diario.
- Usar apenas categorias amplas: `ritual_status`, `ritual_intent`,
  `access_status`, `lifecycle_state` e `tester_status`.
- Manter o freio de no maximo um email nao transacional por pessoa por dia local
  de Sao Paulo.
- Broadcasts ficam para campanhas amplas; lifecycle deve rodar por evento.

## Flags

Por padrao, o sync externo fica desligado.

```bash
RESEND_LIFECYCLE_SYNC_ENABLED=1
```

Ativa envio de Contacts/Eventos para o Resend.

```bash
RESEND_LIFECYCLE_MANAGE_AUDIENCE=1
```

Permite criar Segments, Topics e Custom Events automaticamente se ainda nao
existirem.
Sem essa flag, o sync usa apenas recursos ja existentes no Resend.

## Eventos

Eventos emitidos pela Aurora:

- `aurora.waitlist.confirmed`
- `aurora.ritual.started`
- `aurora.ritual.completed`
- `aurora.access.granted`
- `aurora.account.created`
- `aurora.first_entry.created`
- `aurora.first_reflection.created`
- `aurora.returned_day2`
- `aurora.invite.shared`

No banco, esses eventos tambem aparecem em `waitlist_events` com `.` convertido
para `_`, por exemplo `aurora_ritual_completed`.

## Segments

- `Aurora - Waitlist sem Ritual`
- `Aurora - Ritual iniciado incompleto`
- `Aurora - Ritual completo sem acesso`
- `Aurora - Acesso liberado sem conta`
- `Aurora - Conta sem primeira entrada`
- `Aurora - Primeira reflexao feita`
- `Aurora - Tester ativo`
- `Aurora - Intencao tarefas e projetos`
- `Aurora - Intencao momentos dificeis`
- `Aurora - Intencao autoconhecimento`
- `Aurora - Intencao pratica de diario`

## Topics

- `Acesso e participacao nos testes`
- `Aprender a usar a Aurora`
- `Novidades do produto`
- `Comunidade e convites`

## Backfill

Dry-run:

```bash
GET /api/email/lifecycle-sync?token=...&dryRun=1&limit=200
```

Sync real, depois das flags em producao:

```bash
POST /api/email/lifecycle-sync?token=...&dryRun=0&limit=200
```

O endpoint mascara emails na resposta e sincroniza apenas propriedades leves.

## Migration

A tabela `email_outbox` foi criada para suportar filas e idempotencia em fases
posteriores. A cadencia atual ainda envia diretamente, mas agora passa pelo
frequency guard antes do disparo.

## Proxima virada

1. Subir a migration.
2. Ativar `RESEND_LIFECYCLE_MANAGE_AUDIENCE=1` temporariamente e rodar backfill.
3. Desligar `RESEND_LIFECYCLE_MANAGE_AUDIENCE` se quiser evitar criacao automatica.
4. Criar/publish templates no Resend.
5. Criar Automations com triggers dos eventos `aurora.*`.
6. Ativar `RESEND_LIFECYCLE_SYNC_ENABLED=1`.
7. Monitorar `waitlist_events`:
   - `resend_lifecycle_contact_synced`
   - `resend_lifecycle_event_sent`
   - `resend_lifecycle_event_failed`
   - `email_frequency_guard_skipped`
