# Pipeline de Insights da Aurora

Versão: v1
Objetivo: transformar uso do produto e sinais não identificáveis em aprendizado acionável de produto, persona, conteúdo, objeções e fricções, sem expor conteúdo íntimo das pessoas.

## Plano curto

1. Separar sinais por trilha: lançamento, acesso e produto.
2. Usar apenas eventos, buckets, flags, estados do fluxo e agregados.
3. Traduzir sinais qualitativos em abstrações seguras antes de qualquer relatório.
4. Produzir um relatório semanal curto, orientado a decisões.
5. Registrar lacunas de instrumentação sem transformar o relatório em dashboard.

## Princípios

A Aurora aprende com padrões, não com intimidade exposta. O pipeline pode observar comportamento agregado, continuidade, fricções, estados do fluxo, buckets de duração, flags de risco, tipos de erro e temas abstratos. Ele não deve copiar, exportar ou resumir falas pessoais de forma identificável.

O produto deve manter três trilhas analíticas separadas:

| Trilha | Para que serve | Exemplos de sinais |
| --- | --- | --- |
| Lançamento | Entender aquisição, campanha, landing, convite e waitlist | pageviews, CTA, UTM, referral, confirmação de email, lifecycle |
| Acesso | Entender quem recebeu acesso, ativou, entrou ou travou antes de usar | convite enviado, acesso liberado, login, onboarding iniciado, onboarding concluído |
| Produto | Entender valor percebido, continuidade e fricção dentro da experiência | diário visto, gravação iniciada, gravação concluída, reflexão recebida, retorno, continuação de fio, falhas técnicas |

O relatório semanal nunca deve misturar resultado de campanha com aprendizado de produto sem explicitar a diferença. Uma campanha pode atrair curiosidade; produto precisa provar valor depois do acesso.

## Dados que podem e não podem entrar

Podem entrar:

- IDs pseudônimos, como `user_id`, `referral_code` ou `distinctId` não reversível no relatório.
- Eventos de produto allowlistados.
- Buckets, como duração da gravação, etapa do fluxo, dispositivo, idioma, origem e janela de tempo.
- Flags, como `has_mood`, `risk_level`, `entry_mode`, `has_onboarding_moment`.
- Contagens, percentuais, tendências e coortes pequenas com proteção de privacidade.
- Temas abstratos criados por revisão segura, como "decisão difícil", "procrastinação", "sobrecarga de cuidado", "continuidade de fio".
- Sinais de crise apenas como contagem agregada protegida e sem exemplo textual.

Não podem entrar:

- Email, nome, telefone, handles sociais ou qualquer identificador direto.
- Transcript, áudio, reflexão completa ou resposta aberta original.
- Frases literais da pessoa, mesmo sem nome.
- Trechos de reflexão da Aurora que revelem o conteúdo da fala.
- Dados de uma pessoa única quando a combinação de atributos puder identificá-la.
- Exemplos de crise, autoagressão, abuso ou risco iminente.
- Exportação de texto aberto para PostHog ou relatórios operacionais.

## Categorias de análise

### Produto

| Campo | Definição |
| --- | --- |
| Pergunta que responde | As pessoas chegam ao valor central da Aurora: falar, receber organização, perceber clareza e ter vontade de continuar? |
| Sinais permitidos | `product_onboarding_viewed`, `product_onboarding_completed`, `product_onboarding_skipped`, `product_diary_viewed`, `product_diary_recording_started`, `product_diary_recording_stopped`, `product_reflection_received`, `product_transcription_failed`, `product_reflection_failed`, `product_reflection_feedback_answered`, `product_pmf_prompt_answered`, `entry_mode`, `duration_bucket`, `device_family`, retorno por semana, continuação de fio, quantidade de registros por pessoa em buckets e respostas PMF fechadas. |
| Sinais proibidos | Áudio, transcript, reflexão, texto de onboarding aberto, frase original, nome da pessoa, email, conteúdo de fio. |
| Insight seguro | "Entre novos usuários ativos, a maior queda aconteceu entre abrir o diário e concluir a primeira gravação. O padrão foi mais forte em `ios_safari` e em gravações abaixo de 10 segundos." |
| Decisão que orienta | Melhorar permissão de microfone, estado de gravação e primeiro prompt antes de mexer na geração da reflexão. |

### Persona

| Campo | Definição |
| --- | --- |
| Pergunta que responde | Quais momentos de vida e motivações parecem encontrar mais valor na Aurora? |
| Sinais permitidos | Campos de onboarding transformados em buckets seguros, como momento declarado, presença desejada, valor esperado, ritmo de uso, retorno, primeira reflexão recebida, segundo registro, fio retomado. |
| Sinais proibidos | Nome, profissão específica quando puder identificar, história pessoal completa, descrição literal de família, saúde, relacionamento ou trabalho. |
| Insight seguro | "Usuários no bucket 'muita coisa para organizar' tiveram maior taxa de segunda sessão do que usuários no bucket 'curiosidade inicial'." |
| Decisão que orienta | Priorizar onboarding e copy para quem sente que há sentimentos, ideias, decisões e próximos passos soltos, em vez de vender a Aurora como ferramenta genérica de produtividade. |

### Conteúdo

| Campo | Definição |
| --- | --- |
| Pergunta que responde | Que linguagem, promessa e exemplos ajudam a pessoa certa a entender a Aurora sem confundir com chat, terapia ou app de tarefas? |
| Sinais permitidos | Origem de campanha, CTA clicado, página visitada, resposta a variações de mensagem, conclusão do ritual de chegada, início de onboarding, entrada no diário, primeira reflexão recebida. |
| Sinais proibidos | Resposta aberta copiada, DM, email pessoal, frase literal de feedback, comentário identificável em rede social. |
| Insight seguro | "Mensagens sobre 'muita coisa solta na cabeça' trouxeram mais cadastros confirmados, mas mensagens sobre 'perceber padrões' trouxeram maior conclusão do onboarding." |
| Decisão que orienta | Usar mensagens de identificação para aquisição e mensagens de continuidade/padrões na ativação. |

### Objeções

| Campo | Definição |
| --- | --- |
| Pergunta que responde | O que impede alguém de confiar, começar, pagar ou voltar? |
| Sinais permitidos | Abandono antes de gravar, skip de onboarding, cliques em privacidade, perguntas agrupadas de suporte, resposta qualitativa transformada em tipo de objeção, falha de login, baixa retomada após primeira reflexão. |
| Sinais proibidos | Texto original de medo, relato íntimo, email de suporte, nome da pessoa, conteúdo usado para justificar a objeção. |
| Insight seguro | "A objeção mais frequente da semana foi 'não sei o que acontece com minha fala'. Ela apareceu perto da permissão de microfone e antes da primeira gravação." |
| Decisão que orienta | Reforçar privacidade prática no momento de gravação, com linguagem curta e não defensiva. |

### Fricções

| Campo | Definição |
| --- | --- |
| Pergunta que responde | Onde a experiência quebra, pesa ou exige esforço demais? |
| Sinais permitidos | Erros técnicos, timeout, permissão negada, gravação curta, retry, drop-off por etapa, dispositivo, navegador, tempo até reflexão, eventos repetidos sem conclusão. |
| Sinais proibidos | Áudio de erro, texto transcrito, descrição pessoal do problema se for identificável. |
| Insight seguro | "A fricção dominante foi técnica: pessoas em iOS pararam mais antes de receber reflexão, com concentração em falhas de transcrição." |
| Decisão que orienta | Priorizar robustez de gravação/transcrição em iOS antes de adicionar novas telas de continuidade. |

## Modelo de relatório semanal

Use este modelo em toda sexta-feira ou no primeiro dia útil seguinte.

```md
# Pipeline de Insights Aurora - Semana de AAAA-MM-DD a AAAA-MM-DD

## Resumo executivo

- Principal aprendizado:
- Principal risco:
- Decisão recomendada:
- Lacuna de dados mais importante:

## Mudanças relevantes da semana

- Produto:
- Lançamento:
- Acesso:
- Instrumentação:
- Incidentes ou limitações:

## Aprendizados por categoria

### Produto

- Sinal observado:
- Interpretação:
- Confiança: alta / média / baixa
- Decisão sugerida:

### Persona

- Sinal observado:
- Interpretação:
- Confiança: alta / média / baixa
- Decisão sugerida:

### Conteúdo

- Sinal observado:
- Interpretação:
- Confiança: alta / média / baixa
- Decisão sugerida:

### Objeções

- Sinal observado:
- Interpretação:
- Confiança: alta / média / baixa
- Decisão sugerida:

### Fricções

- Sinal observado:
- Interpretação:
- Confiança: alta / média / baixa
- Decisão sugerida:

## Sinais fortes vs sinais fracos

### Sinais fortes

- Sinal:
- Por que é forte:
- O que fazer:

### Sinais fracos

- Sinal:
- Por que ainda é fraco:
- O que observar na próxima semana:

## Riscos de interpretação

- Tamanho da amostra:
- Viés de origem:
- Viés de acesso:
- Viés de dispositivo:
- Eventos ausentes:
- Mudanças de produto/campanha que afetam comparação:

## Decisões recomendadas

1. Decisão:
   - Evidência:
   - Impacto esperado:
   - Dono:
   - Prazo:

2. Decisão:
   - Evidência:
   - Impacto esperado:
   - Dono:
   - Prazo:

## Backlog de instrumentação

| Prioridade | Lacuna | Por que importa | Evento ou propriedade sugerida | Restrição de privacidade |
| --- | --- | --- | --- | --- |
| Alta |  |  |  |  |
| Média |  |  |  |  |
| Baixa |  |  |  |  |

## Perguntas abertas para a próxima semana

- Pergunta 1:
- Pergunta 2:
- Pergunta 3:

## Anexo de privacidade

- Nenhum texto aberto, áudio, transcript, reflexão completa, email ou nome foi usado neste relatório.
- Sinais de crise, se existirem, foram tratados apenas como agregados protegidos.
- Exemplos qualitativos foram convertidos em categorias abstratas antes da síntese.
```

## Como resumir sem expor conteúdo íntimo

### Regra prática

Todo resumo deve passar por esta transformação:

1. Remover identificadores diretos.
2. Remover texto original.
3. Converter conteúdo em tema abstrato.
4. Converter intensidade em bucket.
5. Ligar o sinal a uma etapa do produto.
6. Usar frequência relativa, não caso individual.
7. Gerar implicação de produto, não interpretação sobre a vida da pessoa.

### Exemplo de transformação

Não usar:

> "A pessoa disse: [frase original sobre família, medo, trabalho ou relação]."

Usar:

| Dimensão segura | Exemplo |
| --- | --- |
| Tema | decisão difícil |
| Bucket emocional | carga alta |
| Etapa do produto | primeira reflexão recebida |
| Frequência relativa | apareceu em parte relevante dos usuários ativos da semana |
| Implicação | a pergunta final da reflexão precisa ajudar a separar emoção, contexto e próximo passo possível |

Resumo seguro:

"Em parte relevante dos usuários ativos, o tema abstrato 'decisão difícil' apareceu associado a carga alta logo na primeira reflexão. Isso sugere revisar a experiência pós-reflexão para ajudar a pessoa a transformar clareza inicial em um próximo passo pequeno."

### Exemplos adicionais

| Entrada bruta proibida | Transformação segura | Decisão possível |
| --- | --- | --- |
| Frase pessoal sobre estar travada | Tema: procrastinação; intensidade: média/alta; etapa: diário antes da gravação; frequência: recorrente em novos usuários | Testar prompt inicial sobre "o que está travando?" |
| Relato longo sobre cuidar de outras pessoas | Tema: sobrecarga de cuidado; etapa: onboarding; frequência: concentrado em um segmento | Ajustar copy para "um momento para se escutar também" |
| Texto sobre medo de privacidade | Objeção: uso da fala; etapa: permissão de microfone; frequência: sinal fraco/médio | Inserir microcopy de privacidade antes da gravação |
| Sinal de crise | Safety: `risk_level=high`; etapa: reflexão; contagem agregada protegida | Revisar se recursos foram mostrados e se o fluxo evitou reflexão normal |

### O que nunca entra no relatório

- "A pessoa falou que..."
- "Um usuário chamado..."
- "Uma founder disse..."
- "O áudio mostra..."
- "O transcript dizia..."
- "A reflexão da Aurora respondeu..."
- Qualquer exemplo de crise.
- Qualquer história completa, mesmo anonimizando o nome.
- Qualquer combinação rara que permita reconhecer a pessoa.

## Quem entra na amostra semanal

### Inclusão

Entram na amostra semanal:

- Usuários ativos no produto durante a semana.
- Novos usuários que iniciaram onboarding.
- Pessoas que iniciaram onboarding e não concluíram.
- Pessoas que abriram o diário.
- Pessoas que iniciaram gravação.
- Pessoas que concluíram gravação.
- Pessoas que receberam reflexão.
- Pessoas que retornaram depois da primeira reflexão.
- Pessoas que usaram modo de continuidade, quando houver sinal de `entry_mode=continue`.
- Eventos de crise/safety somente como agregados protegidos.

### Exclusão

Ficam fora da análise:

- Registros de teste, internos ou administrativos.
- Pessoas com email bloqueado, bounce ou complaint quando a análise for de ativação de produto.
- Duplicatas técnicas.
- Eventos incompletos sem timestamp confiável.
- Qualquer linha que exija olhar email, nome, transcript, áudio ou reflexão completa para ser entendida.
- Amostras pequenas demais para segmentar sem risco de identificação.

### Segmentos recomendados

Para produto:

- Novo usuário da semana.
- Usuário que recebeu primeira reflexão.
- Usuário que voltou.
- Usuário que continuou um fio.
- Usuário que parou antes da primeira reflexão.

Para acesso:

- Convite enviado.
- Acesso aceito.
- Login concluído.
- Onboarding iniciado.
- Onboarding concluído ou pulado.

Para lançamento:

- Visitante de campanha.
- Cadastro criado.
- Email confirmado.
- Pessoa indicada.
- Pessoa que compartilhou convite.

### Vieses a declarar

Todo relatório deve declarar:

- Se a semana teve campanha específica.
- Se o acesso foi manual ou restrito.
- Se houve incidente técnico.
- Se a amostra veio de canal muito concentrado.
- Se usuários internos ou conhecidos podem distorcer comportamento.
- Se a base é pequena demais para inferir persona.
- Se algum evento importante ainda não existe.

## Rotina semanal

### 1. Coleta

Duração: 30 a 45 minutos
Responsável: produto ou analytics

Coletar:

- Eventos de lançamento.
- Eventos de acesso.
- Eventos de produto.
- Erros técnicos.
- Contagens de safety agregadas.
- Notas qualitativas já abstratizadas, se existirem.

Checklist:

- A janela semanal está correta.
- Eventos internos/testes foram separados.
- Nenhum campo aberto foi exportado para planilha ou PostHog.

### 2. Limpeza e anonimização

Duração: 30 minutos
Responsável: analytics ou engenharia

Fazer:

- Remover emails, nomes e identificadores diretos.
- Agrupar IDs em coortes ou pseudônimos.
- Substituir valores raros por "outros" quando houver risco de identificação.
- Separar lançamento, acesso e produto.
- Remover qualquer texto aberto.

Checklist:

- Não há transcript.
- Não há reflexão.
- Não há áudio.
- Não há resposta aberta original.
- Não há email ou nome.
- Não há exemplo de crise.

### 3. Classificação

Duração: 45 a 60 minutos
Responsável: produto

Classificar sinais em:

- Produto.
- Persona.
- Conteúdo.
- Objeções.
- Fricções.

Para cada sinal, marcar:

- Etapa do fluxo.
- Frequência relativa.
- Intensidade.
- Confiança.
- Decisão possível.

Checklist:

- Toda classificação tem evidência.
- Nenhuma classificação depende de uma história individual.
- Sinais fracos foram marcados como fracos.

### 4. Revisão

Duração: 30 minutos
Responsável: produto + privacy/ops

Revisar:

- Se algum insight pode identificar alguém.
- Se a linguagem ficou clínica, patologizante ou invasiva.
- Se sinais de crise ficaram agregados.
- Se interpretações estão proporcionais ao tamanho da amostra.

Checklist:

- O texto fala de comportamento do produto, não da vida íntima da pessoa.
- Nenhuma frase pessoal foi preservada.
- O relatório consegue ser compartilhado internamente sem expor alguém.

### 5. Síntese

Duração: 45 minutos
Responsável: produto

Produzir:

- Resumo executivo.
- Aprendizados por categoria.
- Sinais fortes e fracos.
- Riscos de interpretação.
- Decisões recomendadas.
- Backlog de instrumentação.

Checklist:

- O relatório cabe em leitura de 10 minutos.
- Cada recomendação tem evidência.
- Cada evidência tem limite declarado.

### 6. Decisões

Duração: 30 minutos
Responsável: fundador/produto/engenharia

Decidir:

- Uma mudança de produto.
- Uma mudança de conteúdo ou onboarding.
- Uma lacuna de instrumentação.
- Um ponto que não será mexido ainda.

Checklist:

- Cada decisão tem dono.
- Cada decisão tem prazo.
- Cada decisão tem critério de acompanhamento.

### 7. Instrumentação

Duração: 30 minutos de triagem; implementação separada
Responsável: engenharia + produto

Registrar lacunas:

- Evento ausente.
- Propriedade ausente.
- Segmento impossível de medir.
- Risco de privacidade.
- Evento que deve ser removido ou restringido.

Checklist:

- Nenhuma sugestão pede texto aberto.
- Toda nova propriedade é bucket, flag ou enum.
- Toda mudança preserva separação entre lançamento, acesso e produto.

### 8. Acompanhamento

Duração: 15 minutos na semana seguinte
Responsável: produto

Responder:

- A decisão da semana anterior mudou o comportamento?
- O sinal ficou mais forte ou mais fraco?
- A lacuna de dados foi fechada?
- Algum risco novo apareceu?

## Backlog inicial de instrumentação

Este backlog é sugestão de produto. Não implica implementação automática.

| Prioridade | Lacuna | Evento ou propriedade sugerida | Por que importa | Restrição |
| --- | --- | --- | --- | --- |
| Alta | Separar acesso de produto no relatório operacional | `access_invite_sent`, `access_accepted`, `access_login_completed` | Evita confundir curiosidade de convite com ativação real | Sem email no payload; usar ID pseudônimo |
| Alta | Medir retorno depois da primeira reflexão | coorte por `product_reflection_received` + retorno em 7 dias | Prova se a Aurora gera vontade de continuar | Não usar conteúdo da reflexão |
| Alta | Medir continuação de fio | `entry_mode=continue` e contagem por bucket | Mostra se continuidade vira valor percebido | Não usar título, resumo ou texto do fio |
| Média | Entender abandono pré-gravação | evento de permissão negada e etapa anterior | Ajuda a separar objeção de privacidade e problema técnico | Sem texto livre |
| Média | Agrupar motivo de skip no onboarding | enum opcional, sem campo aberto | Ajuda a entender objeções iniciais | Opções fechadas; não capturar explicação |
| Média | Medir qualidade operacional da reflexão | tempo em bucket até resposta e status | Ajuda a priorizar performance e confiabilidade | Sem conteúdo gerado |
| Baixa | Agrupar temas seguros de uso | `theme_bucket` revisado antes de relatório | Ajuda persona e conteúdo | Nunca enviar tema derivado de caso único para ferramenta externa |

## Checklist final antes de compartilhar

- O relatório separa lançamento, acesso e produto.
- O relatório não contém nome, email, transcript, áudio, reflexão completa ou resposta aberta.
- Todo exemplo qualitativo virou abstração segura.
- Sinais de crise aparecem apenas como agregado protegido.
- Sinais fortes e fracos estão separados.
- O tamanho da amostra está declarado.
- As decisões recomendadas são proporcionais à evidência.
- O texto usa linguagem humana, clara e não clínica.
