import { JsonLd } from "@/components/seo/JsonLd";
import { Card, FineList, Grid, LaunchPage, LaunchSection, WideCard } from "@/components/launch/LaunchPage";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Segurança | Aurora",
  description:
    "Princípios de segurança da Aurora para lista de espera, dados pessoais, futuro diário por voz e uso responsável de IA.",
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
        lead="A Aurora precisa ser íntima sem ser invasiva. Segurança aqui significa reduzir risco técnico, respeitar limites humanos e explicar escolhas sem linguagem opaca."
        secondary={{ href: "/privacidade", label: "Ver privacidade" }}
      >
        <LaunchSection eyebrow="Princípios" title="Segurança como experiência de produto." lead="O usuário não deveria precisar entender arquitetura para se sentir respeitado. Ainda assim, a arquitetura precisa sustentar essa confiança.">
          <Grid columns={3}>
            <Card title="Coleta mínima">
              <p>Guardar apenas o que ajuda a entregar acesso, reflexão e contexto útil.</p>
            </Card>
            <Card title="Separação de sinais">
              <p>Conteúdo íntimo fica fora de analytics de marketing. Eventos de produto devem carregar apenas metadados seguros.</p>
            </Card>
            <Card title="Controle progressivo">
              <p>A pessoa deve poder rever, corrigir, exportar e apagar dados conforme o produto amadurece.</p>
            </Card>
          </Grid>
        </LaunchSection>

        <LaunchSection alt eyebrow="Operação" title="O que protegemos no lançamento." lead="Nesta fase, a prioridade é proteger lista de espera, confirmação por email, códigos de indicação e respostas opcionais do Ritual de Chegada.">
          <FineList
            items={[
              {
                title: "Double opt-in",
                body: "O email precisa ser confirmado para que a indicação conte.",
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

        <LaunchSection eyebrow="No app" title="O diário por voz exigirá cuidado ainda maior." lead="Quando a Aurora estiver aberta, áudio, transcrição e reflexão terão uma camada de sensibilidade diferente da lista de espera.">
          <WideCard title="Direção técnica">
            <p>O caminho esperado inclui autenticação, políticas de acesso, registros apagáveis, controles de retenção e decisões claras sobre o que pode ou não treinar modelos.</p>
            <p>Esses detalhes precisam estar escritos antes de abrir o produto para uso amplo.</p>
          </WideCard>
        </LaunchSection>
      </LaunchPage>
    </>
  );
}
