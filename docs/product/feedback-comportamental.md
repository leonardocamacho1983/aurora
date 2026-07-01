# Feedback comportamental da Aurora

## Decisao

O feedback "A devolutiva fez sentido pra voce?" e uma calibragem comportamental, nao
uma etapa fixa depois de toda reflexao. Ele deve aparecer com contexto, recencia e
frequencia controladas para nao cansar a pessoa nem transformar o Diario em pesquisa.

## Regra geral

- Nao perguntar em toda devolutiva.
- Nao perguntar durante crise, erro, reflexao expandida ou fluxo interrompido.
- Nao perguntar quando a pessoa apenas abriu o app, timeline, conta ou esta fora de
  uma reflexao ativa no `/diario`.
- Para usuarios comuns, repetir no maximo uma vez a cada 5 dias por usuario.
- Para usuarios comuns, exigir pelo menos 10 reflexoes concluidas desde o ultimo
  microfeedback.
- Para usuarios comuns, nunca mostrar mais de uma vez no mesmo dia, mesmo se a
  pessoa fizer muitas reflexoes.
- Se a pessoa ainda nao tem historico de microfeedback, a primeira reflexao valida
  pode receber a pergunta uma vez.
- Depois disso, a pergunta comum so volta quando as tres condicoes forem verdadeiras:
  5+ dias desde o ultimo microfeedback, 10+ reflexoes concluidas desde o ultimo
  microfeedback e nenhum microfeedback mostrado no dia atual.

## Excecao PMF

Toda pessoa que entra no perfil PMF deve passar pelo fluxo PMF no proximo registro
elegivel. Para esse grupo, o microfeedback nao e apenas amostragem; ele e a porta de
entrada do fluxo PMF.

Perfil PMF, no Alpha, significa pelo menos um dos sinais:

- atividade em dois ou mais dias;
- continuidade explicita de um fio;
- uso intenso suficiente para indicar valor recebido;
- usuario marcado para teste PMF.

## Fluxo PMF

1. A pessoa grava no `/diario`.
2. A Aurora transcreve, reflete e mostra a devolutiva.
3. Se a entrada tem reflexao valida e nao e crise, aparece primeiro:
   "A devolutiva fez sentido pra voce?"
4. A pessoa responde `Fez sentido` ou `Nao tanto`.
5. Se a pessoa esta em perfil PMF, a resposta deve ser registrada e o fluxo PMF deve
   seguir depois desse microfeedback.
6. O modal PMF pergunta:
   "Como voce se sentiria se nao pudesse mais usar a Aurora?"
7. A pessoa escolhe uma resposta fechada.
8. A Aurora pergunta o motivo/follow-up fechado:
   "O que te daria vontade de voltar aqui outra vez?"
9. A resposta PMF e registrada como dado declarado. Ela complementa PMF leve
   comportamental; nao substitui retorno real.

## Guardrails

- O microfeedback avalia a devolutiva, nao a pessoa.
- A PMF declarada e opcional para leitura de produto, mas quando a pessoa entra no
  perfil PMF o produto deve conduzir o fluxo em vez de depender de amostragem comum.
- Nao enviar conteudo de diario, transcricao, reflexao ou resposta aberta para
  analytics generico.
- Admin deve mostrar agregados e contagens, nao conteudo bruto.
