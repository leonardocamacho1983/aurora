import type { Metadata } from "next";
import { Orb, type OrbState } from "@/components/orb/Orb";
import styles from "./DesignSystem.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aurora Design System",
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams = Promise<{ token?: string }>;

const colors = [
  ["bg/base", "--bg-base", "#08060F"],
  ["bg", "--bg", "#0D0C17"],
  ["surface", "--surface", "#181527"],
  ["raised", "--raised", "#221E33"],
  ["ink", "--ink", "#F8F6FC"],
  ["ink/soft", "--ink-soft", "#B3ADC4"],
  ["accent", "--accent", "#A99BD9"],
  ["warm", "--aurora-warm", "#F4B6A0"],
  ["pink", "--aurora-pink", "#C9A2D4"],
  ["blue", "--aurora-blue", "#8FA4D6"],
  ["mint", "--aurora-mint", "#7FD0C4"],
  ["amanhecer/bg", "--bg em dawn", "#F6F3FB"],
];

const typography = [
  ["Marketing Display", "56-64", "Fraunces ou Inter", "Hero e landing"],
  ["Product PageTitle", "32-40", "Inter 600", "Produto, máximo 1 por tela"],
  ["Mobile PageTitle", "26-32", "Inter 600", "Linha curta"],
  ["Reflection", "20-40", "Fraunces italic", "Diário e insight"],
  ["PanelTitle", "18-24", "Inter 560", "Cards, sheets e seções"],
  ["Body", "16/24", "Inter 400", "Leitura padrão"],
  ["Small", "14/20", "Inter 400", "Metadados legíveis"],
  ["Meta", "12/16", "Inter 650 + caps", "Status e labels"],
];

const spacing: Array<[string, number]> = [
  ["4px", 8],
  ["8px", 14],
  ["12px", 20],
  ["16px", 28],
  ["24px", 44],
  ["32px", 62],
  ["48px", 92],
  ["64px", 132],
];

const radius = [
  ["r-sm", "12px", "Campos, chips e controles compactos"],
  ["r-md", "20px", "Cards funcionais e painéis"],
  ["r-lg", "28px", "Seções, sheets e blocos de destaque"],
  ["r-pill", "9999px", "Botões, inputs e pílulas"],
];

const glassEffects = [
  ["Painel / raised", "var(--raised) + var(--hairline)", "Glass é superfície funcional, não decoração."],
  ["Leitura", "blur moderado + contraste", "Texto nunca depende só de brilho ou transparência."],
  ["Borda", "hairline 8-18%", "A borda desenha hierarquia sem virar moldura pesada."],
];

const components = [
  ["Orb", "repouso / gravação / reflexão / resultado / erro", "Controle principal no Diário, visual-chave em marketing."],
  ["Button", "primário / secundário / ghost / perigo", "44px mínimo, carregamento, indisponível e foco visível."],
  ["Panel", "padrão / elevado / compacto", "Superfície funcional com glass e borda hairline."],
  ["ReflectionCard", "compacto / expandido / resultado", "Fraunces apenas no texto reflexivo."],
  ["TimelineEntryCard", "padrão / ativo / fio", "Humor discreto como ponto ou chip."],
  ["SegmentedTabs", "semana / mês / tudo", "Estado selecionado claro, sem competir com o conteúdo."],
  ["DataTable", "admin denso", "Inter, escaneável, sem escala editorial."],
  ["PrivacyChip", "local / privado / anônimo", "Sinal de confiança discreto, nunca invasivo."],
];

const componentInventory = [
  ["Button", "primário · secundário · ghost · perigo", "44px mínimo, carregamento e foco visível."],
  ["Orb", "repouso · gravação · reflexão · resultado · erro", "Controle principal, não ornamento."],
  ["ReflectionCard", "compacto · expandido · resultado", "Fraunces apenas no texto reflexivo."],
  ["TimelineEntryCard", "padrão · ativo · fio", "Humor discreto como ponto/chip."],
  ["SegmentedTabs", "semana · mês · tudo", "Foco e seleção por contraste."],
  ["DataTable", "admin denso", "Inter, sem hero editorial."],
  ["StreamingText", "streaming · concluído", "Cursor piscante durante geração de IA."],
  ["BottomNav", "diário · timeline · fio · perfil", "Áreas de toque de 44px e estado ativo por cor."],
  ["EmptyState", "diário · timeline · fio", "Copy específica por contexto."],
  ["WaitlistBlock", "idle · enviado · confirmado", "CTA conversão + microprivacidade."],
  ["FeedbackMicro", "fez sentido · não tanto", "Coleta silenciosa pós-insight."],
  ["PrivacyChip", "local · privado · anônimo", "Sinal de confiança discreto, nunca invasivo."],
];

const orbStates: Array<[OrbState, string, string, string]> = [
  ["idle", "Repousa / idle", "Estado de espera. O orb respira devagar e convida a voz.", "breathe 4.8s + halo 5.4s"],
  ["recording", "Floresce / recording", "Estado ativo de gravação. Anéis e forma de onda deixam claro que há captura.", "pulse 1.7s + wave 0.7-1.12s"],
  ["reflecting", "Pensa / reflecting", "Estado de processamento. A espiral interna comunica organização sem virar loader genérico.", "spiral 14-22s + inner drift"],
  ["saved", "Exala / saved", "Confirmação curta após salvar ou concluir reflexão.", "exhale 1.8s uma vez"],
  ["disabled", "Indisponível / disabled", "Estado indisponível. Mantém a forma, reduz saturação e remove a chamada para ação.", "movimento reduzido + glow baixo"],
];

const orbRules = [
  ["01", "Um papel por viewport", "Escolha se o orb será marca, controle principal, hero canônico ou demonstração. Nunca todos ao mesmo tempo."],
  ["02", "Um orb dominante", "Fora do logo, use no máximo um orb acima de 64px na mesma viewport. Se houver hero orb, cards e formulários usam luz, linhas ou textura."],
  ["03", "Nunca como marcador", "Cards, listas, badges, etapas e ícones genéricos não usam orb. Use marcadores lineares, amostras de cor, numeração ou tipografia."],
];

const orbAnatomy = [
  ["Core", "Gradiente canônico do orb. Deve usar o componente-base real, não CSS solto por tela."],
  ["Halo", "Luz externa respirando. Atmosfera, não segundo orb."],
  ["Rings", "Aparecem apenas em recording para sinalizar captura."],
  ["Waveform", "13 barras no estado recording. Não usar como gráfico decorativo fora do orb."],
  ["Spiral", "Camada interna de reflecting. Comunica pensamento e organização."],
  ["Grain", "Textura sutil para tirar o orb do look plástico."],
];

const motionTokens = [
  ["breathe", "4.8s", "Idle e reflecting", "scale 1 -> 1.045 -> 1"],
  ["haloBreathe", "5.4s", "Luz externa", "opacity + scale suave"],
  ["recPulse", "2.3s", "Recording rings", "ring expande e desaparece"],
  ["wave", "0.7-1.12s", "Recording waveform", "barras reagem em cadência alternada"],
  ["spiralSpin", "14-22s", "Reflecting", "rotação lenta, nunca nervosa"],
  ["exhale", "1.8s", "Saved", "confirmação curta"],
];

const motionNotes = [
  ["Idle", "respiração 5-7s", "A aura quase não chama atenção."],
  ["Recording", "anéis finos + waveform", "Feedback claro sem ansiedade visual."],
  ["Reflecting", "rotação interna lenta", "Sensação de processamento contemplativo."],
  ["Result", "orb atrás do card", "Calma, leitura e síntese."],
  ["Reduced motion", "sem escala contínua", "Manter estados por cor, texto e ícone."],
];

const orbUsage = [
  ["Use", "Diário", "Orb como controle principal de falar, parar, continuar ou refletir."],
  ["Use", "Landing / DS", "Um orb hero canônico quando a página precisa ensinar a assinatura."],
  ["Use", "Componente", "Demonstrações pequenas apenas quando o assunto é o próprio orb."],
  ["Evite", "Cards e listas", "Não usar orb como marcador, ícone de feature ou marcador de etapa."],
  ["Evite", "Formulário", "Se o logo já tem orb, use linha aurora, estrela, glass ou amostra de cor."],
  ["Evite", "Fundo", "Não transformar o orb em textura repetida ou papel de parede."],
];

const patterns = [
  ["Landing", "Editorial e cinematográfica, mas com CTA único, promessa clara e sem linguagem clínica."],
  ["Diário", "Uma ação principal por tela. O orb grava, para, continua ou sinaliza estado."],
  ["Timeline", "Leitura densa e calma. Humor aparece como sinal discreto, não decoração."],
  ["Onboarding", "Educa o uso sem parecer tutorial pesado. Explica que Aurora não é chat genérico."],
  ["Admin", "Operacional, denso e utilitário. Métricas primeiro, diagnósticos depois, tabelas por último."],
];

const voicePrinciples = [
  ["Presente sem urgência", "Quando quiser falar, é aqui.", "Fale agora para não perder o momento."],
  ["Específico sem julgamento", "Você mencionou cansaço três vezes.", "Você parece muito estressado."],
  ["Convidativo sem obrigação", "Você pode continuar ou pausar aqui.", "Continue para completar seu passado."],
];

const microcopy = [
  ["Idle", "Convidativo", "Quando quiser falar, é aqui."],
  ["Recording", "Presente", "Pode falar no seu tempo."],
  ["Reflecting", "Calmante", "Aurora está pensando no que você disse."],
  ["Result", "Reflexivo", "Aqui está o que Aurora notou."],
  ["Error", "Não alarmista", "Algo saiu do fluxo. Nada foi perdido."],
  ["Timeline vazia", "Acolhedor", "Seus momentos vão aparecer aqui."],
  ["Diário vazio", "Suave", "Quando quiser, é aqui."],
];

const logoUsage = [
  ["Horizontal dark", "Padrão. Headers, docs e fundos escuros."],
  ["Horizontal light", "Amanhecer, email e superfícies claras."],
  ["Mist", "Sobre fotos ou superfícies texturadas."],
  ["Icon only", "Favicons, app icons, contextos compactos."],
];

const newComponents = [
  ["StreamingText", "UX de IA: texto surgindo progressivamente durante geração."],
  ["FeedbackMicro", "Coleta silenciosa pós-insight. Dois botões discretos, sem nota visível."],
  ["BottomNav — mobile", "Navegação principal em produto. Áreas de toque de 44px e label mínimo."],
  ["EmptyState", "Copy específica por contexto. Nunca usar 'sem dados'."],
  ["WaitlistBlock + PrivacyChip", "CTA de conversão com microprivacidade embutida."],
];

const compositionRules = [
  ["Mobile · 375px", "Orb centralizado ocupa 40-50% da largura. Contraste alto. BottomNav sempre visível."],
  ["Tablet · 768px", "Split 50/50. Orb à esquerda, conteúdo à direita. Navegação no topo."],
  ["Desktop · 1440px", "Orb como âncora lateral esquerda. Conteúdo à direita. Barra de navegação no topo, sem sidebar."],
];

const flipRules = [
  ["Frente — Fala do usuário", "bg rgba(255,255,255,0.055) · borda hairline branca · texto em Fraunces italic · ponto de humor · data no topo"],
  ["Verso — Devolutiva Aurora", "bg rgba(169,155,217,0.08) · borda aurora · mini orb/avatar · texto mais claro"],
  ["Overflow elegante", "Textos acima de 5 linhas ganham botão Ver tudo antes do flip. Expansão animada, sem quebrar o grid."],
];

const buttonMotions = [
  ["Breathe", "5.8s", "Orb em idle. Escala sutil 1 -> 1.038."],
  ["Halo pulse", "6s", "Aura ao redor do orb. Opacidade e escala, sempre em segundo plano."],
  ["Ring", "2.5s", "Anel de gravação/reflexão. Opacidade 38% -> 95%."],
  ["Wave", "0.82s", "Barras do waveform durante gravação. Delays escalonados."],
  ["Screen enter", "0.42s", "Transição entre telas. Fade + translateY(10px -> 0)."],
  ["Spin slow", "20s", "Camada interna do orb em reflecting. Rotação contemplativa."],
];

const microInteractions = [
  ["Botão", "Hover 120ms; foco com outline 2px e offset 3px."],
  ["Card de diário", "Background +0.02 opacidade; borda +0.05; texto +0.15 em 200ms."],
  ["Carregamento", "Texto claro com spinner discreto; nunca transformar espera em urgência."],
  ["MoodDot", "Seleção persiste por cor e label, não por animação excessiva."],
  ["FeedbackMicro", "Estado ativo silencioso, sem pontuação visível."],
];

const guardrails = [
  "Não prometer terapia, diagnóstico, cura, tratamento ou suporte emergencial.",
  "Definir o papel do orb por viewport e respeitar o limite de um orb dominante fora do logo.",
  "Não usar o orb como bullet, ícone genérico, enfeite de card ou textura de fundo.",
  "Não usar Fraunces em métricas, tabelas, labels operacionais ou botões.",
  "Não criar cards dentro de cards.",
  "Não enviar email, nome, áudio, transcrição, reflexão ou resposta aberta para analytics.",
  "Não criar tela nova sem checar mobile 390px e foco visível.",
];

function PrivateScreen({ configured }: { configured: boolean }) {
  return (
    <main className={styles.private}>
      <div className={styles.privateStars} aria-hidden="true" />
      <div className={styles.privateAurora} aria-hidden="true" />
      <div className={styles.privateHorizon} aria-hidden="true" />

      <section className={styles.privateShell}>
        <div className={styles.privateBrand}>
          <img src="/brand/aurora-logo-horizontal.svg" alt="Aurora" />
        </div>

        <div className={styles.privateStory}>
          <p className={styles.privateKicker}>Design System Aurora</p>
          <h1>Entre no universo visual da Aurora.</h1>
          <p>
            Consulte tokens, componentes, padrões e guardrails para criar novas telas sem sair da identidade da marca.
          </p>
        </div>

        <div className={styles.privateCard}>
          <span className={styles.accessSignal} aria-hidden="true" />
          <p className={styles.privateCardLabel}>Acesso reservado</p>
          <h2>Guardrail visual</h2>
          <p>
            {configured
              ? "Use o token do Design System para abrir a biblioteca viva da Aurora."
              : "Configure DESIGN_SYSTEM_ADMIN_TOKEN para liberar esta rota."}
          </p>
          {configured ? (
            <form className={styles.form} action="/design-system">
              <label className={styles.privateField}>
                <span>Token</span>
                <input className={styles.input} name="token" type="password" placeholder="design-system-token" autoComplete="off" />
              </label>
              <button className={styles.primaryButton} type="submit">
                Entrar no Design System
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#top" aria-label="Aurora Design System">
        <img src="/brand/aurora-logo-horizontal.svg" alt="" />
      </a>
      <nav className={styles.nav} aria-label="Design system">
        <a href="#tokens">Fundamentos</a>
        <a href="#componentes">Componentes</a>
        <a href="#orb">Orb</a>
        <a href="#padroes">Padrões</a>
        <a href="#exemplos">Exemplos</a>
        <a href="#voz">Voz</a>
        <a href="#motion">Movimento</a>
        <a href="#qa">QA</a>
      </nav>
    </header>
  );
}

function SectionHeader({ kicker, title, copy }: { kicker: string; title: string; copy: string }) {
  return (
    <div className={styles.sectionHeader}>
      <div>
        <p className={styles.kicker}>{kicker}</p>
        <h2>{title}</h2>
      </div>
      <p>{copy}</p>
    </div>
  );
}

function FoundationExtras() {
  return (
    <div className={styles.foundationStack}>
      <article className={styles.foundationPanel}>
        <p className={styles.panelKicker}>Espaçamento</p>
        <div className={styles.spacingScale}>
          {spacing.map(([label, width]) => (
            <div className={styles.spacingRow} key={label}>
              <span>{label}</span>
              <i style={{ width }} aria-hidden="true" />
            </div>
          ))}
        </div>
      </article>

      <article className={styles.foundationPanel}>
        <p className={styles.panelKicker}>Radius</p>
        <div className={styles.radiusGrid}>
          {radius.map(([name, value, note]) => (
            <div className={styles.radiusSample} key={name}>
              <span>{name}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </div>
          ))}
        </div>
      </article>

      <article className={styles.foundationPanel}>
        <p className={styles.panelKicker}>Efeitos / glass</p>
        <p className={styles.panelCopy}>
          Glass é superfície funcional, não decoração. Use borda hairline, blur moderado e contraste suficiente para leitura.
        </p>
        <div className={styles.glassRows}>
          {glassEffects.map(([title, spec, note]) => (
            <div key={title}>
              <strong>{title}</strong>
              <code>{spec}</code>
              <span>{note}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function ComponentInventory() {
  return (
    <section className={styles.section} id="inventario">
      <SectionHeader
        kicker="Componentes"
        title="Componentes com intenção. Cada um no seu lugar."
        copy="Cada componente tem variantes por estado e tamanho. Nenhum é decorativo: todos servem uma ação."
      />
      <div className={styles.componentList}>
        {componentInventory.map(([name, variants, note]) => (
          <article className={styles.componentRow} key={name}>
            <div>
              <h3>{name}</h3>
              <p>{variants}</p>
              <small>{note}</small>
            </div>
            <span>Completo</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductExamples() {
  return (
    <section className={styles.section} id="exemplos">
      <SectionHeader
        kicker="Telas de exemplo"
        title="Exemplos em produto real, não mockup descartável."
        copy="O DS precisa mostrar como os tokens viram Diário, gravação, reflexão, timeline, fio e admin."
      />

      <div className={styles.exampleStack}>
        <article className={styles.productState}>
          <div className={styles.productOrb}><Orb state="idle" decorative /></div>
          <div>
            <h3>O que está vivo em você agora?</h3>
            <p>Não precisa organizar. Só fale.</p>
            <small>Toque no orb para continuar.</small>
          </div>
        </article>

        <article className={styles.productState}>
          <div className={styles.productOrb}><Orb state="recording" decorative /></div>
          <div>
            <h3>Gravando</h3>
            <p>Pode falar no seu tempo.</p>
            <small>Toque no orb para continuar.</small>
          </div>
        </article>

        <article className={styles.productState}>
          <div className={styles.productOrb}><Orb state="reflecting" decorative /></div>
          <div>
            <h3>Aproveite para respirar.</h3>
            <p>Aurora está pensando no que você falou.</p>
            <small>Toque no orb para continuar.</small>
          </div>
        </article>

        <article className={styles.timelinePreview}>
          <div className={styles.previewTop}>
            <img src="/brand/aurora-logo-horizontal.svg" alt="Aurora" />
            <div className={styles.segmentedMini}>
              <span>Semana</span>
              <span>Mês</span>
              <span>Tudo</span>
            </div>
          </div>
          <p className={styles.panelKicker}>Seus registros — intercalados com devolutivas da Aurora</p>
          <div className={styles.timelineCards}>
            <div>
              <span>Hoje · 22:16</span>
              <strong>Estou há três semanas tentando tomar essa decisão sobre mudar de emprego.</strong>
              <small>Ver tudo</small>
            </div>
            <div>
              <span>Aurora</span>
              <strong>Você se permitiu sentir essa satisfação hoje. Isso não é pouca coisa.</strong>
              <small>Seu registro</small>
            </div>
            <div>
              <span>Seg · 06:32</span>
              <strong>A Maia nasceu hoje de manhã. Às 6h14. Olhei para ela e não consegui falar nada.</strong>
              <small>Ver Aurora</small>
            </div>
          </div>
        </article>

        <article className={styles.threadPreview}>
          <div className={styles.previewTop}>
            <img src="/brand/aurora-logo-horizontal.svg" alt="Aurora" />
            <button type="button">Ordenar: recente</button>
          </div>
          <p className={styles.panelKicker}>Fio aberto</p>
          <div className={styles.threadCard}>
            <span>Último momento</span>
            <p>Voltei da viagem com o Henrique. Ele fez 18 anos e a gente foi para Portugal juntos, uma semana só nós dois.</p>
            <small>Áudio · 1 min 23 s</small>
          </div>
          <div className={styles.threadMini}>
            <strong>Padrão do fio</strong>
            <p>Você registra presença quando sente que o tempo está passando rápido.</p>
          </div>
          <div className={styles.threadMini}>
            <strong>Pergunta viva</strong>
            <p>O que você quer guardar dessa viagem que ainda não colocou em palavras?</p>
          </div>
        </article>

        <article className={styles.adminPreview}>
          <p className={styles.panelKicker}>Admin cockpit</p>
          <h3>Operacional, não editorial.</h3>
          <p>Sem headline gigante, sem cards decorativos dominantes, sem Fraunces em dados.</p>
          <table className={styles.miniTable}>
            <tbody>
              <tr><th>Métrica</th><th>Status</th><th>Próxima ação</th></tr>
              <tr><td>Waitlist</td><td>normal</td><td>Revisar origem</td></tr>
              <tr><td>Convites</td><td>atenção</td><td>Liberar lote 02</td></tr>
              <tr><td>Erros áudio</td><td>baixo</td><td>Monitorar</td></tr>
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
}

function VoiceAndLogo() {
  return (
    <>
      <section className={styles.section} id="voz">
        <SectionHeader
          kicker="Voz e tom"
          title="Aurora fala com calma. Nunca com urgência."
          copy="O tom é presente, específico e convidativo. A Aurora não pressiona, não julga e não dramatiza."
        />
        <div className={styles.voiceGrid}>
          {voicePrinciples.map(([title, good, bad]) => (
            <article className={styles.voiceCard} key={title}>
              <h3>{title}</h3>
              <div className={styles.goodBad}>
                <span>{good}</span>
                <span>{bad}</span>
              </div>
            </article>
          ))}
        </div>
        <div className={styles.microcopyTable}>
          {microcopy.map(([state, tone, copy]) => (
            <div key={state}>
              <strong>{state}</strong>
              <span>{tone}</span>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} id="logo">
        <SectionHeader
          kicker="Uso do logo"
          title="Um orb. Quatro contextos. Zero distorções."
          copy="O logo deve respirar. Nunca recolorir gradiente, cortar o orb ou usar a assinatura como textura."
        />
        <div className={styles.logoGrid}>
          {logoUsage.map(([title, note], index) => (
            <article className={styles.logoCard} key={title}>
              {index === 3 ? (
                <span className={styles.logoOrbOnly} aria-hidden="true" />
              ) : (
                <img src="/brand/aurora-logo-horizontal.svg" alt="Aurora" />
              )}
              <div>
                <h3>{title}</h3>
                <p>{note}</p>
              </div>
            </article>
          ))}
        </div>
        <article className={styles.logoRules}>
          <strong>Tamanho mínimo</strong>
          <p>Ícone: 24px. Horizontal: 80px largura. Nunca encostar o logo em borda ou outros elementos.</p>
          <strong>Proibido</strong>
          <p>Não distorcer, não colocar em moldura quadrada, não recolorir gradiente e não usar o orb sozinho como ícone de navegação.</p>
        </article>
      </section>
    </>
  );
}

function NewComponents() {
  return (
    <section className={styles.section} id="novos-componentes">
      <SectionHeader
        kicker="Novos componentes v2"
        title="IA, crescimento, privacidade e navegação."
        copy="Blocos que faltavam no inventário para cobrir produto real, aquisição e estados vazios."
      />
      <div className={styles.newComponentStack}>
        {newComponents.map(([title, note]) => (
          <article className={styles.newComponentCard} key={title}>
            <p className={styles.panelKicker}>{title}</p>
            <p>{note}</p>
            {title === "StreamingText" ? (
              <div className={styles.streamingDemo}>
                Parece que você volta a esse tema quando está perto de uma decisão importante.
              </div>
            ) : null}
            {title === "FeedbackMicro" ? (
              <div className={styles.feedbackDemo}>
                <button type="button">Fez sentido</button>
                <button type="button">Não tanto</button>
              </div>
            ) : null}
            {title.startsWith("BottomNav") ? (
              <div className={styles.bottomNavDemo}>
                <span>Diário</span><span>Timeline</span><span>Fio</span><span>Perfil</span>
              </div>
            ) : null}
            {title === "EmptyState" ? (
              <div className={styles.emptyDemo}>
                <strong>Quando quiser falar, o orb está aqui.</strong>
                <span>Não precisa se preparar.</span>
              </div>
            ) : null}
            {title.startsWith("WaitlistBlock") ? (
              <div className={styles.waitlistDemo}>
                <input aria-label="Email de exemplo" placeholder="seu@email.com" />
                <button type="button">Entrar</button>
                <small>Dados mínimos. Sem spam, sem textos sensíveis.</small>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function Compositions() {
  return (
    <section className={styles.section} id="composicoes">
      <SectionHeader
        kicker="Visuais-chave — mobile · tablet · desktop"
        title="Três composições. Uma mesma identidade."
        copy="O orb não escala proporcionalmente; ele tem papel composicional diferente em cada formato."
      />
      <div className={styles.compositionGrid}>
        {compositionRules.map(([title, note], index) => (
          <article className={styles.compositionCard} key={title}>
            <p className={styles.panelKicker}>{title}</p>
            <div className={styles.deviceMock} data-size={index}>
              <span className={styles.mockOrb} />
              <i />
              <i />
              <i />
            </div>
            <p>{note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FlipCardSystem() {
  return (
    <section className={styles.section} id="flipcard">
      <SectionHeader
        kicker="Flipcard — componente do sistema"
        title="A fala do usuário e a devolutiva da Aurora, frente e verso."
        copy="Na timeline, os cards aparecem intercalados. O usuário lê tudo antes de virar e acessar a devolutiva."
      />
      <div className={styles.flipStack}>
        <article className={styles.flipPanel}>
          <p className={styles.panelKicker}>Card curto — virado para Aurora</p>
          <div className={styles.reflectionCard}>
            <span>Aurora</span>
            <p>Você se permitiu sentir essa satisfação hoje. Isso não é pouca coisa — muitas vezes você passa rápido por esse tipo de reconhecimento.</p>
            <small>Seu registro</small>
          </div>
          <p>Frente: fala do usuário em glass neutro. Verso: devolutiva da Aurora em glass aurora.</p>
        </article>
        <article className={styles.flipPanel}>
          <p className={styles.panelKicker}>Card longo — expansível antes do flip</p>
          <div className={styles.reflectionCard}>
            <span>Seg · 06:32</span>
            <p>A Maia nasceu hoje de manhã. Às 6h14. Olhei para ela e não consegui falar nada. Fiquei só olhando. O Rodrigo estava chorando.</p>
            <small>Ver tudo · Ver Aurora</small>
          </div>
          <p>Textos longos: clamp de 5 linhas com botão Ver tudo antes do flip.</p>
        </article>
        <div className={styles.flipRules}>
          {flipRules.map(([title, note]) => (
            <div key={title}>
              <h3>{title}</h3>
              <p>{note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ButtonsAndMotion() {
  return (
    <>
      <section className={styles.section} id="botoes">
        <SectionHeader
          kicker="Botões — galeria completa"
          title="Cada ação tem um botão certo."
          copy="Ações principais, navegação, player e feedback usam a mesma escala de toque e o mesmo foco visível."
        />
        <div className={styles.buttonGallery}>
          <article>
            <p className={styles.panelKicker}>Ações de navegação</p>
            <div className={styles.buttonRow}>
              <button type="button" className={styles.secondaryButton}>Voltar</button>
              <button type="button" className={styles.secondaryButton}>Avançar</button>
              <button type="button" className={styles.primaryButton}>Abrir</button>
              <button type="button" className={styles.secondaryButton}>Fechar</button>
            </div>
          </article>
          <article>
            <p className={styles.panelKicker}>Player de áudio/vídeo</p>
            <div className={styles.playerDemo}>
              <div><strong>Entrada de ontem</strong><span>Áudio · 1 min 23 s</span></div>
              <div className={styles.progressWave}><span /></div>
              <button type="button" aria-label="Reproduzir">Reproduzir</button>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.section} id="motion">
        <SectionHeader
          kicker="Movimentos"
          title="Movimento é respiração, não performance."
          copy="Cada animação serve um estado emocional. Breathe é calma. Ring é atenção. Wave é presença."
        />
        <div className={styles.motionSpecGrid}>
          {buttonMotions.map(([name, duration, note]) => (
            <article className={styles.motionSpec} key={name}>
              <div><h3>{name}</h3><span>{duration}</span></div>
              <p>{note}</p>
              <code>animation: {name.toLowerCase().replaceAll(" ", "-")} {duration} ease-in-out infinite</code>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function IllustrationAndMicrointeractions() {
  return (
    <>
      <section className={styles.section} id="ilustracoes">
        <SectionHeader
          kicker="Ilustrações"
          title="Abstrato, luminoso, nunca literal."
          copy="Ilustrações Aurora são composições abstratas baseadas no gradiente do orb. Sem pessoas, sem ícones médicos, sem corações."
        />
        <div className={styles.illustrationGrid}>
          {["Repouso", "Transição", "Expansão", "Gravidade"].map((item, index) => (
            <article className={styles.illustrationCard} key={item}>
              <div className={styles.illustrationArt} data-tone={index}><span /></div>
              <h3>{item}</h3>
              <p>{index === 0 ? "Timeline vazia, estado idle" : index === 1 ? "Entre estados, carregamento" : index === 2 ? "Novo insight, resultado" : "Estado ansioso, pesado"}</p>
            </article>
          ))}
        </div>
        <div className={styles.illustrationRules}>
          <div><strong>Sempre abstrato</strong><p>Composições de gradiente e forma. Nunca pessoas, rostos ou símbolos médicos.</p></div>
          <div><strong>Baseado na paleta</strong><p>Usa warm, pink, blue, mint e accent. Sem cores externas.</p></div>
          <div><strong>Orb como âncora</strong><p>O ícone do orb pode aparecer centrado como ponto focal.</p></div>
        </div>
      </section>

      <section className={styles.section} id="microinteracoes">
        <SectionHeader
          kicker="Microinterações"
          title="O produto responde com calma."
          copy="Hover, foco, carregamento e feedback precisam confirmar ação sem criar urgência."
        />
        <div className={styles.microGrid}>
          {microInteractions.map(([name, note]) => (
            <article className={styles.microCard} key={name}>
              <h3>{name}</h3>
              <p>{note}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export default async function DesignSystemPage({ searchParams }: { searchParams: SearchParams }) {
  const { token } = await searchParams;
  const designSystemToken = process.env.DESIGN_SYSTEM_ADMIN_TOKEN?.trim();

  if (!designSystemToken || token !== designSystemToken) {
    return <PrivateScreen configured={Boolean(designSystemToken)} />;
  }

  return (
    <main className={styles.page} id="top">
      <div className={styles.shell}>
        <Header />

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Design System v2 / Aurora</p>
            <h1>Um sistema íntimo, escuro e luminoso para escutar com calma.</h1>
            <p>
              Aurora é um diário emocional por voz com IA. Este DS organiza tokens, componentes e padrões para produto, landing e operação sem virar uma coleção de cards soltos.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href="#tokens">Começar pelos tokens</a>
              <a className={styles.secondaryButton} href="#guardrails">Princípios de privacidade</a>
            </div>
          </div>
          <div className={styles.heroOrb} aria-label="Orb canônico Aurora">
            <Orb state="reflecting" decorative />
          </div>
        </section>

        <section className={styles.section} id="tokens">
          <SectionHeader
            kicker="Fundamentos"
            title="Crepúsculo como padrão. Amanhecer como abertura."
            copy="A página mostra os tokens que devem orientar código, Figma, assets e novas telas."
          />
          <div className={styles.colorGrid}>
            {colors.map(([label, tokenName, value]) => (
              <article className={styles.colorCard} key={tokenName}>
                <span className={styles.swatch} style={{ background: value }} />
                <strong>{label}</strong>
                <code>{tokenName}</code>
                <small>{value}</small>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <SectionHeader
            kicker="Tipografia"
            title="O tamanho serve o conteúdo."
            copy="Produto e admin não usam escala de hero. Fraunces fica reservado para marca, prompt e reflexão."
          />
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Uso</th>
                  <th>Escala</th>
                  <th>Fonte</th>
                  <th>Contexto</th>
                </tr>
              </thead>
              <tbody>
                {typography.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell) => <td key={cell}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <FoundationExtras />

        <section className={styles.section} id="componentes">
          <SectionHeader
            kicker="Componentes"
            title="Componentes com intenção."
            copy="Cada componente existe para uma ação, estado ou leitura. Variantes devem ser explícitas, não estilos soltos."
          />
          <div className={styles.componentGrid}>
            {components.map(([name, variants, note]) => (
              <article className={styles.componentCard} key={name}>
                <div>
                  <span className={name === "Orb" ? styles.orbSample : styles.componentIcon} aria-hidden="true" />
                  <h3>{name}</h3>
                </div>
                <p>{variants}</p>
                <small>{note}</small>
              </article>
            ))}
          </div>
        </section>

        <ComponentInventory />

        <section className={styles.section} id="orb">
          <SectionHeader
            kicker="Sistema do orb"
            title="Orbes animadas, estados e orçamento visual."
            copy="A página usa o componente real de components/orb/Orb.tsx para expor movimento, estados, anatomia e regras de uso."
          />
          <div className={styles.orbStateGrid}>
            {orbStates.map(([state, label, role, motion]) => (
              <article className={styles.orbStateCard} key={state}>
                <div className={styles.orbDemoStage}>
                  <Orb state={state} decorative />
                </div>
                <div className={styles.orbStateCopy}>
                  <p>{label}</p>
                  <h3>{role}</h3>
                  <code>{motion}</code>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.orbDetailGrid}>
            <article className={styles.orbPanel}>
              <h3>Anatomia</h3>
              <ul className={styles.detailList}>
                {orbAnatomy.map(([name, note]) => (
                  <li key={name}>
                    <strong>{name}</strong>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className={styles.orbPanel}>
              <h3>Motion tokens</h3>
              <div className={styles.motionTable}>
                {motionTokens.map(([name, duration, use, behavior]) => (
                  <div className={styles.motionRow} key={name}>
                    <code>{name}</code>
                    <span>{duration}</span>
                    <span>{use}</span>
                    <small>{behavior}</small>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className={styles.orbUsageGrid}>
            {orbUsage.map(([mode, context, note]) => (
              <article className={mode === "Use" ? styles.usageDo : styles.usageDont} key={`${mode}-${context}`}>
                <span>{mode}</span>
                <h3>{context}</h3>
                <p>{note}</p>
              </article>
            ))}
          </div>

          <div className={styles.orbRuleGrid}>
            {orbRules.map(([index, title, copy]) => (
              <article className={styles.orbRuleCard} key={index}>
                <span>{index}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="padroes">
          <SectionHeader
            kicker="Padrões"
            title="A mesma marca, densidades diferentes."
            copy="Landing, produto e operação usam a mesma identidade, mas não a mesma densidade visual."
          />
          <div className={styles.patternGrid}>
            {patterns.map(([name, note]) => (
              <article className={styles.patternCard} key={name}>
                <h3>{name}</h3>
                <p>{note}</p>
              </article>
            ))}
          </div>
        </section>

        <ProductExamples />
        <VoiceAndLogo />
        <NewComponents />
        <Compositions />
        <FlipCardSystem />
        <ButtonsAndMotion />
        <IllustrationAndMicrointeractions />

        <section className={styles.section} id="guardrails">
          <SectionHeader
            kicker="Guardrails de agentes"
            title="Regras que agentes devem obedecer."
            copy="Este bloco espelha o guardrail em docs/agent-guardrails/design-system.md para consulta rápida."
          />
          <div className={styles.guardrailGrid}>
            {guardrails.map((item, index) => (
              <article className={styles.guardrailCard} key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="qa">
          <SectionHeader
            kicker="QA"
            title="Antes de publicar, compare."
            copy="Exatidão vem de tokens, componentes e verificação visual em desktop e mobile."
          />
          <div className={styles.qaGrid}>
            <article className={styles.qaCard}>
              <h3>Arquivos fonte</h3>
              <ul>
                <li><code>docs/design-system/index.md</code></li>
                <li><code>docs/design-system/reference.md</code></li>
                <li><code>docs/design-system/component-inventory.md</code></li>
                <li><code>docs/design-system/ui-ux-creation-brief.md</code></li>
                <li><code>docs/design-system/tokens.md</code></li>
                <li><code>docs/design-system/qa-checklist.md</code></li>
                <li><code>docs/agent-guardrails/design-system.md</code></li>
              </ul>
            </article>
            <article className={styles.qaCard}>
              <h3>Checks mínimos</h3>
              <ul>
                <li>Mobile 390px sem overflow.</li>
                <li>Desktop largo com hierarquia estável.</li>
                <li>Foco visível em interativos.</li>
                <li><code>npx tsc --noEmit</code> antes do handoff.</li>
              </ul>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
