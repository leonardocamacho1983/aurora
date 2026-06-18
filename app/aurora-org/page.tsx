import { JsonLd } from "@/components/seo/JsonLd";
import { Card, Grid, LaunchPage, LaunchSection, WideCard } from "@/components/launch/LaunchPage";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Aurora.org | O próximo passo da Aurora",
  description:
    "Aurora.org é o próximo passo do compromisso regenerativo da Aurora com educação, pesquisa e prevenção.",
  path: "/aurora-org",
  keywords: ["Aurora.org", "empresa regenerativa", "prevenção suicídio", "tecnologia para bem-estar"],
});

export default function AuroraOrgPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Aurora.org",
    url: absoluteUrl("/aurora-org"),
    description: "O próximo passo do compromisso regenerativo da Aurora.",
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LaunchPage
        page="aurora-org"
        eyebrow="Aurora.org"
        title="O próximo passo da Aurora nasce para servir além do app."
        lead="Aurora.org será uma iniciativa separada da experiência comercial, preparada com responsabilidade para educação, pesquisa, prevenção e acesso a recursos de cuidado."
      >
        <LaunchSection eyebrow="Compromisso" title="Regenerar começa no jeito de crescer." lead="A Aurora só faz sentido se a confiança que recebe voltar para pessoas como clareza, cuidado e acesso.">
          <Grid columns={3}>
            <Card title="Experiência">
              <p>O app ajuda pessoas a se entenderem melhor sem transformar cuidado em dependência.</p>
            </Card>
            <Card title="Crescimento">
              <p>Indicação só vale quando nasce de confiança e da vontade de trazer pessoas queridas para perto.</p>
            </Card>
            <Card title="Causa">
              <p>Aurora.org transforma parte do valor criado em educação, pesquisa e prevenção, com cuidado e governança.</p>
            </Card>
          </Grid>
        </LaunchSection>

        <LaunchSection alt eyebrow="Responsabilidade" title="Prevenção pede método, parceria e linguagem cuidadosa." lead="Falar de sofrimento humano exige seriedade. Aurora.org não substitui serviços de emergência, linhas de crise, atendimento médico ou psicoterapia.">
          <WideCard title="Próximo passo, com calma">
            <p>Antes de prometer impacto, a iniciativa será construída com especialistas, protocolos, governança e parcerias. O compromisso é real. A pressa não pode ser maior que o cuidado.</p>
          </WideCard>
        </LaunchSection>
      </LaunchPage>
    </>
  );
}
