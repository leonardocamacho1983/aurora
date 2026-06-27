import type { Metadata } from "next";
import { Button, CardSurface, Chip, IconButton, Panel, SegmentedTabs } from "@/components/ui";
import {
  BottomNav,
  ContinueThreadButton,
  EmptyState,
  FeedbackMicro,
  FlipCard,
  PrivacyChip,
  ReflectionCard,
  StreamingText,
  ThreadCard,
  TimelineEntryCard,
} from "@/components/product";
import { DesignSystemShell, PrivateScreen, SectionHeader, getDesignSystemAccess, type DesignSystemSearchParams } from "../_shared";
import styles from "../DesignSystem.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Biblioteca de Componentes | Aurora Design System",
  robots: {
    index: false,
    follow: false,
  },
};

const components = [
  ["UI", "Button", "primário · secundário · ghost · perigo", "44px mínimo, carregamento e foco visível.", "Pronto 2B"],
  ["UI", "IconButton", "voltar · fechar · ordenar · reproduzir", "Ação compacta com alvo de toque de 44px.", "Pronto 2B"],
  ["UI", "CardSurface", "padrão · elevado · compacto · interativo", "Base de cards antes de conteúdo de produto.", "Pronto 2B"],
  ["UI", "Panel", "padrão · elevado · compacto", "Superfície funcional com glass e borda hairline.", "Pronto 2B"],
  ["UI", "Chip", "humor · status · privacidade · data", "Sinal curto, nunca botão disfarçado.", "Pronto 2B"],
  ["UI", "SegmentedTabs", "semana · mês · tudo", "Foco e seleção por contraste.", "Pronto 2C"],
  ["Product", "OrbControl", "idle · recording · reflecting · saved · disabled", "Controle principal, não ornamento.", "Existente / refinar"],
  ["Product", "ReflectionCard", "compacto · expandido · resultado", "Fraunces apenas no texto reflexivo.", "Pronto 2B"],
  ["Product", "TimelineEntryCard", "padrão · ativo · fio", "Humor discreto como ponto/chip.", "Pronto 2B"],
  ["Product", "ThreadCard", "último momento · padrão · pergunta viva", "Organiza continuidade do fio sem virar decoração.", "Pronto 2B"],
  ["Product", "ContinueThreadButton", "idle · loading · disabled · erro", "Ação de retomada com estado claro.", "Pronto 2B"],
  ["Product", "FlipCard", "front · back · expanded · flipped", "Texto longo expande antes do flip para a devolutiva.", "Pronto 2B.1"],
  ["Product", "StreamingText", "streaming · concluído", "Cursor discreto durante geração de IA.", "Pronto 2C"],
  ["Product", "BottomNav", "diário · timeline · fio · perfil", "Áreas de toque de 44px e estado ativo por cor.", "Pronto 2C"],
  ["Product", "EmptyState", "diário · timeline · fio", "Copy específica por contexto.", "Pronto 2C"],
  ["Growth", "WaitlistBlock", "idle · enviado · confirmado", "CTA conversão + microprivacidade.", "Depois"],
  ["Feedback", "FeedbackMicro", "fez sentido · não tanto", "Coleta silenciosa pós-insight.", "Pronto 2C"],
  ["Trust", "PrivacyChip", "local · privado · anônimo", "Sinal de confiança discreto, nunca invasivo.", "Pronto 2C"],
];

const groups = ["Todos", "UI", "Product", "Growth", "Feedback", "Trust"];

const bottomNavItems = [
  { key: "diary", href: "/diario", label: "Diário", icon: "○" },
  { key: "timeline", href: "/timeline", label: "Timeline", icon: "◔" },
  { key: "fio", href: "/fios", label: "Fio", icon: "⌁" },
  { key: "perfil", href: "/account", label: "Perfil", icon: "♙" },
];

export default async function BibliotecaPage({ searchParams }: { searchParams: DesignSystemSearchParams }) {
  const access = await getDesignSystemAccess(searchParams);

  if (!access.allowed) {
    return <PrivateScreen configured={access.configured} />;
  }

  return (
    <DesignSystemShell token={access.token}>
      <section className={styles.hubHero}>
        <p className={styles.kicker}>Biblioteca de Componentes</p>
        <h1>Peças prontas para montar telas.</h1>
        <p>Esta área fica só com componentes: camada, nome, variantes, regra de uso e fase de entrega.</p>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Filtros de leitura"
          title="Comece pela camada."
          copy="Os filtros são visuais por enquanto. A próxima fase pode transformar isso em navegação interativa por componente."
        />
        <div className={styles.libraryFilters} aria-label="Camadas de componentes">
          {groups.map((group) => (
            <span key={group}>{group}</span>
          ))}
        </div>
      </section>

      <section className={styles.section} id="fase-2b">
        <SectionHeader
          kicker="Fase 2B pronta"
          title="Componentes reais, não só inventário."
          copy="Esta vitrine usa os componentes importados de components/ui e components/product. A próxima migração deve consumir essas peças."
        />

        <div className={styles.componentDemoGrid}>
          <article className={styles.componentDemoPanel}>
            <p className={styles.panelKicker}>UI / Button</p>
            <h2>Botões com estados explícitos.</h2>
            <div className={styles.componentDemoRow}>
              <Button>Abrir</Button>
              <Button variant="secondary">Voltar</Button>
              <Button variant="ghost">Fechar</Button>
              <Button variant="danger">Remover</Button>
              <Button loading>Continuando</Button>
            </div>
          </article>

          <article className={styles.componentDemoPanel}>
            <p className={styles.panelKicker}>UI / IconButton + Chip</p>
            <h2>Ações compactas e sinais curtos.</h2>
            <div className={styles.componentDemoRow}>
              <IconButton label="Voltar" icon="←" />
              <IconButton label="Fechar" icon="×" />
              <IconButton label="Reproduzir" icon="▶" variant="primary" />
              <Chip tone="mood" withDot>calmo</Chip>
              <Chip tone="privacy">privado</Chip>
              <Chip tone="date">hoje</Chip>
            </div>
          </article>

          <Panel className={styles.componentDemoPanel} compact>
            <p className={styles.panelKicker}>UI / Panel</p>
            <h2>Painel funcional.</h2>
            <p className={styles.panelCopy}>Superfície para contexto, formulário, bloco de operação ou agrupamento curto sem virar moldura decorativa.</p>
          </Panel>

          <CardSurface className={styles.componentDemoPanel} variant="raised">
            <p className={styles.panelKicker}>UI / CardSurface</p>
            <h2>Base para cards.</h2>
            <p className={styles.panelCopy}>Define glass, borda, padding, radius e estado interativo antes de receber conteúdo de produto.</p>
          </CardSurface>
        </div>

        <div className={styles.productDemoGrid}>
          <ReflectionCard variant="result" support="Resultado de reflexão">
            Você volta a esse tema quando está perto de uma decisão importante.
          </ReflectionCard>

          <TimelineEntryCard meta="Hoje · 22:16" mood="sensível" actionLabel="Ver tudo" active>
            Estou há três semanas tentando tomar essa decisão sobre mudar de emprego.
          </TimelineEntryCard>

          <TimelineEntryCard author="aurora" meta="Aurora" mood="padrão" actionLabel="Seu registro">
            Você se permitiu sentir essa satisfação hoje. Isso não é pouca coisa.
          </TimelineEntryCard>

          <div className={styles.threadDemoStack}>
            <ThreadCard variant="latest" title="Último momento" meta="Fio aberto">
              Voltei da viagem com o Henrique e ainda estou tentando entender o que quero guardar disso.
            </ThreadCard>
            <ThreadCard variant="question" title="Pergunta viva" meta="Aurora">
              O que você quer preservar dessa viagem que ainda não colocou em palavras?
            </ThreadCard>
            <div className={styles.componentDemoRow}>
              <ContinueThreadButton />
              <ContinueThreadButton state="loading" />
              <ContinueThreadButton state="disabled" />
              <ContinueThreadButton state="error" />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="fase-2b1">
        <SectionHeader
          kicker="Fase 2B.1 pronta"
          title="FlipCard como comportamento de produto."
          copy="O flip não é formato visual: é interação entre frente, verso, leitura completa e devolutiva da Aurora."
        />

        <div className={styles.flipDemoGrid}>
          <FlipCard
            front="A Maia nasceu hoje de manhã. Às 6h14. Olhei para ela e não consegui falar nada. Fiquei só olhando. O Rodrigo estava chorando. Eu achei que ia sentir uma coisa enorme, mas senti silêncio. Depois, quando peguei ela no colo, veio uma calma que eu não sei explicar."
            back="Você descreve um momento em que a emoção não chegou como explosão, mas como presença. Talvez esse silêncio também seja uma forma de reconhecer que algo mudou de lugar dentro de você."
            frontMeta="Seg · 06:32"
            backMeta="Aurora"
            frontSupport="Áudio · 1 min 23 s"
            backSupport="Devolutiva exibida depois da leitura completa do registro."
            requiresExpansionBeforeFlip
          />

          <article className={styles.componentDemoPanel}>
            <p className={styles.panelKicker}>Product / FlipCard</p>
            <h2>Regras de comportamento.</h2>
            <ul className={styles.behaviorList}>
              <li>Frente mostra a fala do usuário.</li>
              <li>Texto longo usa Ver tudo antes do flip.</li>
              <li>Verso mostra a devolutiva da Aurora.</li>
              <li>Flip acontece por ação explícita, nunca automático.</li>
              <li>Teclado, foco e reduced motion continuam legíveis.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.section} id="fase-2c">
        <SectionHeader
          kicker="Fase 2C pronta"
          title="Estados, navegação e feedback de IA."
          copy="Estes componentes completam a camada necessária antes de criar patterns de tela."
        />

        <div className={styles.componentDemoGrid}>
          <article className={styles.componentDemoPanel}>
            <p className={styles.panelKicker}>UI / SegmentedTabs</p>
            <h2>Troca de visão sem perder contexto.</h2>
            <SegmentedTabs
              defaultValue="semana"
              items={[
                { value: "semana", label: "Semana" },
                { value: "mes", label: "Mês" },
                { value: "tudo", label: "Tudo" },
              ]}
              label="Período da timeline"
            />
          </article>

          <article className={styles.componentDemoPanel}>
            <p className={styles.panelKicker}>Product / StreamingText</p>
            <h2>Geração de IA com calma.</h2>
            <StreamingText>
              Parece que você volta a esse tema quando está perto de uma decisão importante.
            </StreamingText>
          </article>

          <article className={styles.componentDemoPanel}>
            <p className={styles.panelKicker}>Product / FeedbackMicro</p>
            <h2>Feedback silencioso pós-insight.</h2>
            <FeedbackMicro />
          </article>

          <article className={styles.componentDemoPanel}>
            <p className={styles.panelKicker}>Trust / PrivacyChip</p>
            <h2>Confiança perto da ação.</h2>
            <div className={styles.componentDemoRow}>
              <PrivacyChip>local</PrivacyChip>
              <PrivacyChip>privado</PrivacyChip>
              <PrivacyChip>anônimo</PrivacyChip>
            </div>
          </article>
        </div>

        <div className={styles.productDemoGrid}>
          <EmptyState
            action={<Button variant="secondary">Começar pelo diário</Button>}
            title="Quando quiser falar, o orb está aqui."
          >
            Não precisa se preparar. Seus momentos vão aparecer aqui quando você registrar.
          </EmptyState>

          <article className={styles.componentDemoPanel}>
            <p className={styles.panelKicker}>Product / BottomNav</p>
            <h2>Navegação mobile oficial.</h2>
            <BottomNav activeKey="timeline" items={bottomNavItems} />
          </article>
        </div>
      </section>

      <section className={styles.section} id="lista">
        <SectionHeader
          kicker="Componentes"
          title="Biblioteca operacional."
          copy="Cada linha já antecipa se o componente entra na próxima fase ou se fica para uma etapa posterior."
        />
        <div className={styles.componentList}>
          {components.map(([layer, name, variants, note, phase]) => (
            <article className={styles.componentRow} key={name}>
              <div>
                <span>{layer}</span>
                <h3>{name}</h3>
                <p>{variants}</p>
                <small>{note}</small>
              </div>
              <span>{phase}</span>
            </article>
          ))}
        </div>
      </section>
    </DesignSystemShell>
  );
}
