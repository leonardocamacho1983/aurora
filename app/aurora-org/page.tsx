import { JsonLd } from "@/components/seo/JsonLd";
import { Card, Grid, LaunchPage, LaunchSection, WideCard } from "@/components/launch/LaunchPage";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Aurora.org | Uma ideia em gestação",
  description:
    "Aurora.org é a iniciativa em gestação ligada ao compromisso regenerativo da Aurora com educação, pesquisa e prevenção.",
  path: "/aurora-org",
  keywords: ["Aurora.org", "empresa regenerativa", "prevenção suicídio", "tecnologia para bem-estar"],
});

export default function AuroraOrgPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Aurora.org",
    url: absoluteUrl("/aurora-org"),
    description: "Uma iniciativa em gestação ligada ao compromisso regenerativo da Aurora.",
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LaunchPage
        page="aurora-org"
        eyebrow="Aurora.org"
        title="Uma parte da Aurora vai nascer para servir além do produto."
        lead="Aurora.org será uma iniciativa separada, em gestação, dedicada a educação, pesquisa, prevenção e acesso a recursos de cuidado. Ainda não é um serviço ativo."
      >
        <LaunchSection eyebrow="Por que existe" title="Uma empresa regenerativa precisa devolver luz." lead="A Aurora não é regenerativa apenas por doar ou apoiar uma causa. Ela precisa ser regenerativa no produto, nos dados, no crescimento e na forma como trata pessoas.">
          <Grid columns={3}>
            <Card title="Produto">
              <p>A experiência deve ajudar pessoas a se entenderem melhor, sem criar dependência artificial.</p>
            </Card>
            <Card title="Crescimento">
              <p>A indicação só faz sentido quando nasce de confiança e desejo de trazer pessoas queridas para perto.</p>
            </Card>
            <Card title="Causa">
              <p>Aurora.org será um caminho para transformar parte do valor criado em apoio, pesquisa e educação.</p>
            </Card>
          </Grid>
        </LaunchSection>

        <LaunchSection alt eyebrow="Cuidado" title="Prevenção exige seriedade." lead="Falar de sofrimento humano pede responsabilidade. Aurora.org não substitui serviços de emergência, linhas de crise, atendimento médico ou psicoterapia.">
          <WideCard title="Em construção">
            <p>O primeiro papel público de Aurora.org é declarar uma direção. Antes de prometer impacto, será preciso construir governança, parcerias, protocolos e linguagem com especialistas.</p>
          </WideCard>
        </LaunchSection>
      </LaunchPage>
    </>
  );
}
