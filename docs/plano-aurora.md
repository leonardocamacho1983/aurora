# Plano Aurora

## Escopo

O **Plano Aurora** consolida a evolucao do projeto alem da waitlist: transformar a primeira experiencia em um produto intimo e funcional, preparar a Aurora para publicos internacionais, definir bases minimas de compliance, avaliar oportunidades para profissionais e deixar billing/Stripe pronto para uma decisao futura sem antecipar monetizacao. Este documento nao substitui issues nem PRDs detalhados; ele serve como mapa de continuidade para que qualquer novo chat, agente ou engenheiro entenda o que ja foi decidido, o que esta em aberto e qual frente deve ser atacada primeiro.

## Estado atual conhecido

- [x] Landing page principal aprovada em direcao geral.
- [x] Hero/teaser aprovado.
- [x] Dominio principal PT-BR definido: `faleaurora.com`.
- [x] Dominio global/ingles definido como futuro coming soon: `talkaurora.com`.
- [x] Web Analytics da Vercel implantado.
- [x] PostHog configurado para eventos principais.
- [x] Waitlist viral funcionando ponta a ponta.
- [x] Ritual de Chegada conectado a dados da waitlist.
- [x] Banco com campos de referral e dados do ritual.
- [x] Primeira camada de onboarding contextual implementada.
- [x] Diario contextualizado criado como primeira experiencia de produto.
- [x] Admin revisado para leitura operacional de waitlist, email e rede de convites.
- [x] Cadencia inicial de emails de lifecycle implementada.
- [ ] Webhook Resend para delivered, opened, clicked, bounced e complained.
- [ ] Timeline/account redesenhados com o mesmo nivel de qualidade do diario.
- [ ] Billing/modelo de negocios definido.
- [ ] Compliance internacional revisado antes de escala global.

## Principios de produto

- [ ] Separar funil de lancamento, produto/app e modelo de negocio.
- [ ] Priorizar mobile first de verdade.
- [ ] Evitar telas com aparencia de dashboard quando a experiencia pede intimidade.
- [ ] Evitar elementos gigantes sem funcao.
- [ ] Nao repetir orb/logo sem necessidade.
- [ ] Manter elegancia, calma, calor emocional e clareza.
- [ ] Usar microcopy humana, sem cara de texto interno.
- [ ] Evitar promessas medicas, terapeuticas ou clinicas indevidas.
- [ ] Nenhum usuario deve ficar bloqueado por nao ter completado Ritual de Chegada.
- [ ] Decisoes de billing nao devem ser implementadas antes da proposta de valor e pricing.

## Checklist por frente

### Produto e primeira experiencia

- [x] Definir primeira experiencia como `login -> onboarding contextual -> diario por voz`.
- [x] Ler contexto do Ritual de Chegada quando existir.
- [x] Permitir entrada no produto mesmo sem Ritual completo.
- [x] Criar onboarding curto, com opcao de pular.
- [x] Persistir conclusao de onboarding no banco.
- [x] Contextualizar a primeira tela do diario com nome, momento e presenca quando existirem.
- [ ] Redesenhar timeline mobile first.
- [ ] Redesenhar account/perfil mobile first.
- [ ] Revisar login como porta de entrada do produto, nao hero/landing.
- [ ] Criar estados vazios elegantes para diario, timeline e account.
- [ ] Definir quando e como a Aurora pede mais contexto depois do primeiro uso.

### Dados, insights e perfil do cliente

- [ ] Consolidar perfil do usuario com dados declarados, uso do diario, preferencias e consentimentos.
- [ ] Separar dados sensiveis do diario de analytics operacional.
- [ ] Definir quais insights podem aparecer para o usuario sem parecer diagnostico.
- [ ] Definir pagina de perfil do cliente com identidade, preferencias, idioma, privacidade e plano.
- [ ] Mapear eventos de produto alem da waitlist: login, onboarding, primeira gravacao, reflexao, retorno e timeline.
- [ ] Definir retencao e exclusao de audio, transcricao, reflexao e embeddings.
- [ ] Garantir que PostHog nao receba conteudo sensivel de diario.
- [ ] Criar leitura operacional de ativacao: onboarding concluido, primeira entrada, reflexao recebida, retorno.

### Localizacao PT-BR/EN

- [ ] Manter `faleaurora.com` como dominio principal PT-BR.
- [ ] Manter `talkaurora.com` como dominio global/ingles em coming soon ate o produto estar pronto.
- [ ] Preparar mensagens, emails, paginas legais e produto para i18n real.
- [ ] Definir estrategia de locale por dominio, navegador e preferencia do usuario.
- [ ] Criar matriz de conteudo PT-BR/EN para landing, produto, emails e documentos legais.
- [ ] Revisar copy em ingles com cuidado cultural, nao apenas traducao literal.
- [ ] Garantir que eventos de analytics tenham `locale`, `domain` e `country` quando apropriado.

### Compliance internacional

- [ ] Revisar LGPD para base legal, consentimento, exclusao e portabilidade.
- [ ] Revisar GDPR antes de escalar `talkaurora.com`.
- [ ] Revisar termos, privacidade, seguranca e disclaimers de bem-estar.
- [ ] Definir consentimentos granulares para diario, analytics, emails e uso de IA.
- [ ] Definir politica de retencao de dados sensiveis.
- [ ] Definir processo de exclusao de conta e dados.
- [ ] Evitar linguagem medica, terapeutica, diagnostica ou promessa de tratamento.
- [ ] Definir resposta segura para crise, risco alto e recursos de ajuda.
- [ ] Documentar subprocessadores: Vercel, Supabase, Resend, PostHog, OpenAI, Anthropic e futuros provedores.

### Profissionais

- [ ] Tratar profissionais como frente exploratoria, nao promessa ativa.
- [ ] Avaliar casos para terapeutas, coaches, facilitadores e grupos.
- [ ] Mapear diferenca entre uso pessoal, uso acompanhado e uso institucional.
- [ ] Nao criar dashboard profissional antes de validar demanda.
- [ ] Validar riscos de compliance, confidencialidade e responsabilidade profissional.
- [ ] Definir se profissionais convidam clientes, acompanham progresso ou apenas indicam a Aurora.
- [ ] Avaliar modelo de parceria, afiliacao ou plano profissional somente depois de pesquisa.

### Planos, precos e billing futuro

- [ ] Documentar hipoteses de planos sem assumir Free/Beta/Plus/Founder como decisao final.
- [ ] Definir proposta de valor antes de pricing.
- [ ] Definir limites de uso por plano: gravacoes, reflexoes, historico, exportacao, memoria e recursos avancados.
- [ ] Definir se havera trial, lista de espera paga, acesso antecipado ou plano vitalicio.
- [ ] Separar monetizacao B2C, profissionais e parcerias.
- [ ] Definir metricas de valor antes de cobrar: ativacao, frequencia, retencao e momentos de "aha".
- [ ] Nao implementar paywall antes de definir regras de acesso e comunicacao.

### Stripe e infraestrutura de cobranca

- [ ] Integrar Stripe somente depois de decisao de modelo e pricing.
- [ ] Definir produtos, prices e ambientes test/live.
- [ ] Definir webhooks obrigatorios: checkout, subscription created/updated/deleted, invoice paid/failed.
- [ ] Definir tabela de subscriptions e sincronizacao com `users.plan`.
- [ ] Definir portal de billing e cancelamento.
- [ ] Definir tratamento para falha de pagamento, downgrade e grace period.
- [ ] Definir recibos, impostos e moeda antes de lancamento internacional.

### Analytics, experimentos e lifecycle

- [x] PostHog configurado para eventos principais da waitlist.
- [x] Eventos de pos-cadastro instrumentados: inbox, status link e resend.
- [x] Lifecycle emails iniciais implementados via rota protegida.
- [ ] Configurar `CRON_SECRET` no Vercel para cron automatico seguro.
- [ ] Configurar webhook Resend para metricas de entrega, abertura, clique, bounce e complaint.
- [ ] Criar A/B tests no PostHog para copy pos-cadastro, CTA da landing e sala de convite.
- [ ] Garantir que variantes de experimentos sejam persistentes por usuario/navegador.
- [ ] Criar dashboard de ativacao do produto alem da waitlist.
- [ ] Avaliar Sentry para erros de producao.
- [ ] Avaliar Checkly para monitorar funil critico com Playwright.

## Decisoes ja tomadas

- [x] A frente imediata da waitlist deve ficar separada do produto/app.
- [x] A primeira fatia de produto e `login + onboarding + diario`.
- [x] O Ritual de Chegada informa a primeira experiencia, mas nao bloqueia entrada.
- [x] Timeline e account devem ser redesenhados depois do diario.
- [x] Billing nao deve ser implementado antes de discutir modelo de negocio.
- [x] Profissionais sao oportunidade a avaliar, nao escopo fechado.
- [x] `EMAIL_FROM` segue com `hello@leonardocamacho.com` enquanto nao houver decisao nova.
- [x] `faleaurora.com` e o dominio principal PT-BR.
- [x] `talkaurora.com` e global/ingles, em coming soon por enquanto.

## Decisoes em aberto

- [ ] Qual sera o modelo de negocio inicial da Aurora.
- [ ] Quais nomes e limites de planos fazem sentido.
- [ ] Se havera plano gratuito, beta, founder, trial ou acesso pago antecipado.
- [ ] Se profissionais terao produto separado, parceria ou apenas material de indicacao.
- [ ] Qual nivel de memoria historica a Aurora deve oferecer ao usuario.
- [ ] Quais dados podem alimentar insights sem gerar risco de privacidade ou interpretacao clinica.
- [ ] Quando abrir `talkaurora.com` para publico global.
- [ ] Quais jurisdicoes internacionais serao priorizadas alem do Brasil.

## Proximos passos recomendados

1. Fechar qualidade do produto pessoal: timeline, account e perfil.
2. Criar dashboard simples de ativacao do produto: onboarding, primeira gravacao, reflexao e retorno.
3. Revisar lifecycle emails com webhook do Resend antes de acelerar trafego.
4. Planejar compliance minimo para uso internacional.
5. Discutir modelo de negocio antes de qualquer implementacao Stripe.
6. Validar oportunidade para profissionais com pesquisa e entrevistas, nao com dashboard pronto.

## Notas de implementacao tecnica

- `docs/launch-log.md` e registro operacional de lancamento e nao deve ser misturado com este plano.
- `docs/plano-aurora.md` deve ser atualizado sempre que uma decisao estrutural mudar.
- Checklists marcados como completos devem refletir estado real do repo ou decisao explicita.
- Nao registrar tokens, emails privados completos, chaves ou dados sensiveis neste documento.
- Ao iniciar novo chat, citar **Plano Aurora** deve apontar para este arquivo.
- Ao implementar billing, criar plano tecnico separado antes de tocar em Stripe.
- Ao implementar compliance internacional, criar revisao legal separada antes de mudar copy publica.
