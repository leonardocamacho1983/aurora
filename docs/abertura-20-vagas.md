# Campanha: 20 vagas gratuitas para usar a Aurora

## Objetivo

Abrir 20 vagas de uso gratuito da Aurora sem usar "Alpha" como linguagem principal.
A campanha deve ativar pessoas confirmadas da waitlist, excluir quem ja participa
do teste atual e manter a exclusividade na permissao de acesso, nao no esconderijo
do login.

## Linguagem

- Assunto principal: `20 vagas abertas para usar a Aurora gratuitamente`
- Preheader operacional: `Uso ilimitado durante o programa de testes.`
- Evitar no topo: `Alpha`, `Alpha Test`, `proxima leva`.
- Pode aparecer no corpo: `programa de testes`.
- Promessa permitida: uso gratuito e ilimitado enquanto durar o programa de testes.
- Guardrail: a Aurora esta em construcao, mas a experiencia principal ja funciona.

## Segmentacao de entrada

Base de convite:

- waitlist confirmada;
- email permitido, sem bounce/complaint/supressao ativa;
- sem acesso atual por `waitlist.unlocked_at` ou `access_invites.sent_at`;
- sem conta de produto existente;
- sem email recente nos ultimos 2 dias;
- exclui internos, testes e emails bloqueados por padrao operacional.

Prioridade:

1. Ritual de Chegada completo.
2. Sinais de intencao: Ritual iniciado, sala vista, convite copiado/enviado.
3. Antiguidade de confirmacao.

## Regra de acesso

O envio inicial pode ir para a base elegivel. O CTA do email nao libera acesso
por clique: ele leva a pessoa direto para o Ritual de Chegada.

Quando a pessoa completa o Ritual, a Aurora libera a entrada no teste e envia um
email explicando o momento do produto, o uso gratuito e ilimitado durante o
programa de testes e um convite cuidadoso para chamar pessoas proximas.

A conclusao do Ritual grava:

- `waitlist.unlocked_at`;
- evento `open_spots_access_claimed`;
- evento `ritual_alpha_access_granted`;
- evento de envio do email `ritual_alpha_access_email_sent` ou falha;
- segmento de origem quando existir.

O limite de 20 continua como controle operacional da abertura e da leitura de
resultado, nao como bloqueio por clique no email.

## Cadencia automatizada

O follow-up roda pelo cron diario de `/api/waitlist/lifecycle`, depois da cadencia
existente.

1. `claim_reminder`
   - 24h depois do convite;
   - pessoa convidada, sem Ritual completo/liberacao de acesso, sem conta.
2. `account_reminder`
   - 6h depois da liberacao pelo Ritual;
   - acesso liberado, mas conta ainda nao criada.
3. `first_entry_prompt`
   - 6h depois da conta criada;
   - conta criada, sem primeira entrada.
4. `feedback_checkin`
   - 12h depois da primeira reflexao;
   - pergunta por resposta direta ao email.
5. `return_prompt`
   - 36h depois do primeiro uso;
   - atividade em apenas um dia local, sem retorno em outro dia.

Todos os follow-ups respeitam bloqueios de email, dedupe por campanha e cooldown
de email recente.

## Endpoints

- Dry-run do convite inicial:
  `GET /api/waitlist/open-spots?token=...&mode=invite&dryRun=1&limit=100`
- Envio real do convite inicial:
  `POST /api/waitlist/open-spots?token=...&mode=invite&dryRun=0&confirm=send-open-spots-20-free-2026-07-14`
- Rodar follow-up manual:
  `POST /api/waitlist/open-spots?token=...&mode=followup&dryRun=0`
- Rodar uma etapa especifica:
  `POST /api/waitlist/open-spots?token=...&mode=followup&kind=account_reminder&dryRun=0`
- Relatorio agregado:
  `GET /api/waitlist/open-spots?token=...&mode=report`

## Medicao

Ler 24h, 48h e 72h:

- convidados;
- acessos liberados por Ritual completo;
- contas criadas;
- primeira entrada;
- primeira reflexao;
- retorno em outro dia;
- microfeedback/PMF quando elegivel.

Usar eventos da campanha como coorte inicial e cruzar depois com `users`,
`entries`, `product_events` e `product_feedback`, sempre sem expor conteudo de
diario.
