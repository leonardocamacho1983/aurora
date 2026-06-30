# Feedback comportamental da devolutiva

## Decisão

A pergunta "A devolutiva fez sentido pra você?" não deve aparecer depois de toda devolutiva.

Ela é um sinal de calibração da Aurora, não uma etapa fixa do diário. O objetivo é aprender se a leitura ajudou a pessoa a se reconhecer sem transformar a experiência em formulário.

## Regra de experiência

Mostrar o feedback somente quando houver um contexto comportamental claro:

- primeira ou segunda devolutiva normal recebida;
- retorno depois de alguns dias sem uso;
- continuação de fio;
- reflexão com sinal de valor mais forte, como entrada longa ou fio recorrente;
- amostragem leve, no máximo uma vez por janela de tempo.

Não mostrar quando:

- `risk_level` for `high`;
- houve erro técnico de transcrição ou reflexão;
- a pessoa respondeu feedback recentemente;
- a entrada é muito curta ou puramente operacional;
- a pessoa já respondeu o PMF;
- a pessoa pediu para continuar um fio e ainda está no meio da ação principal.

## Frequência proposta

- Nunca mais de uma vez por dia.
- Nunca em duas devolutivas consecutivas.
- No máximo uma vez a cada 5 reflexões normais.
- Reabilitar depois de 7 dias sem resposta ou após uma continuação de fio relevante.

## Gatilhos técnicos

O endpoint `/api/product-feedback` deve calcular um `reflectionMicro.eligible` mais restritivo usando:

- quantidade de reflexões do usuário;
- última resposta `reflection_micro`;
- última exibição `reflection_micro`;
- `entry_mode`;
- presença de `thread_id` ou `continued_from_entry_id`;
- tamanho aproximado da entrada;
- `risk_level`;
- estado do PMF.

## Relação com PMF

O microfeedback é uma porta suave para o PMF, mas não é o PMF.

Fluxo:

1. Aurora entrega a devolutiva.
2. Em contexto elegível, pergunta: "Isso ajudou a nomear o que estava acontecendo?"
3. Respostas: "Sim, ajudou" / "Não muito".
4. Se positivo e o usuário estiver elegível para PMF, abrir a pergunta PMF declarada.
5. Se negativo, registrar o sinal e não abrir PMF imediatamente.

## Copy recomendada

Trocar:

> A devolutiva fez sentido pra você?

Por:

> Isso ajudou a nomear o que estava acontecendo?

Botões:

- Sim, ajudou
- Não muito

## Critérios de aceite

- A pergunta não aparece em toda reflexão.
- A pergunta nunca aparece em alto risco.
- A pergunta não aparece mais de uma vez por dia para o mesmo usuário.
- Após resposta positiva, o PMF só aparece se a elegibilidade PMF estiver verdadeira.
- Após resposta negativa, o PMF não abre na mesma sessão.
- Eventos continuam fechados e sem enviar transcrição, reflexão ou resposta aberta para analytics.
