import { JsonLd } from "@/components/seo/JsonLd";
import { Card, FineList, Grid, LaunchPage, LaunchSection, WideCard } from "@/components/launch/LaunchPage";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Segurança | Aurora",
  description:
    "Princípios de segurança da Aurora para acesso antecipado, dados pessoais, futuro diário por voz e uso responsável de IA.",
  path: "/seguranca",
  keywords: ["segurança Aurora", "segurança diário por voz", "privacidade IA", "dados sensíveis IA"],
});

export default function SegurancaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Segurança da Aurora",
    url: absoluteUrl("/seguranca"),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LaunchPage
        page="seguranca"
        eyebrow="Segurança"
        title="A beleza não serve se a pessoa não se sente segura."
        lead="A Aurora é íntima sem ser invasiva. Segurança aqui significa reduzir risco técnico, respeitar limites humanos e explicar escolhas sem linguagem opaca."
      >
        <LaunchSection eyebrow="Princípios" title="Segurança também se sente." lead="Você não tem que entender arquitetura para perceber respeito. Por trás da calma, existe trabalho técnico.">
          <Grid columns={3}>
            <Card title="Coleta mínima">
              <p>Guardar apenas o que ajuda a entregar acesso, reflexão e contexto útil.</p>
            </Card>
            <Card title="Separação de sinais">
              <p>Conteúdo íntimo fica fora de analytics de marketing. Eventos de uso carregam apenas metadados seguros.</p>
            </Card>
            <Card title="Controle progressivo">
              <p>Com o amadurecimento da Aurora, a pessoa terá caminhos para rever, corrigir, exportar e apagar dados.</p>
            </Card>
          </Grid>
        </LaunchSection>

        <LaunchSection alt eyebrow="Operação" title="O que protegemos no lançamento." lead="Nesta fase, a prioridade é proteger acesso antecipado, confirmação por email, códigos de indicação e respostas opcionais do Ritual de Chegada.">
          <FineList
            items={[
              {
                title: "Double opt-in",
                body: "O email é confirmado antes de a indicação contar.",
              },
              {
                title: "Links pessoais",
                body: "Cada pessoa recebe uma sala própria para acompanhar convites sem expor email na URL.",
              },
              {
                title: "Analytics limitado",
                body: "Eventos enviados ao PostHog são filtrados para não incluir nome, email, respostas abertas ou conteúdo íntimo.",
              },
              {
                title: "Banco e operadores",
                body: "A infraestrutura usa provedores especializados. A política de privacidade explica finalidade, operadores e direitos.",
              },
            ]}
          />
        </LaunchSection>

        <LaunchSection eyebrow="No app" title="O diário por voz exigirá cuidado ainda maior." lead="Quando a Aurora estiver aberta, áudio, transcrição e reflexão terão uma camada de sensibilidade diferente do acesso antecipado.">
          <WideCard title="Próxima camada de proteção">
            <p>A abertura do app pede autenticação, políticas de acesso, registros apagáveis, controles de retenção e escolhas claras sobre modelos de IA.</p>
            <p>Esses pontos serão descritos com clareza antes do uso amplo.</p>
          </WideCard>
        </LaunchSection>
      </LaunchPage>
    </>
  );
}
