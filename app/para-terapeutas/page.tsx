import { JsonLd } from "@/components/seo/JsonLd";
import { Card, FineList, Grid, LaunchPage, LaunchSection, WideCard } from "@/components/launch/LaunchPage";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Aurora para terapeutas e psicólogos",
  description:
    "Como terapeutas, psicólogos e profissionais de saúde mental podem acompanhar a Aurora como prática de reflexão entre sessões.",
  path: "/para-terapeutas",
  keywords: [
    "Aurora para terapeutas",
    "diário por voz para psicólogos",
    "reflexão entre sessões",
    "IA para psicoterapia",
  ],
});

export default function ParaTerapeutasPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Aurora para terapeutas e psicólogos",
    url: absoluteUrl("/para-terapeutas"),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LaunchPage
        page="para-terapeutas"
        eyebrow="Profissionais"
        title="Uma prática de reflexão entre encontros."
        lead="A Aurora pode ser usada por pessoas que fazem terapia, por profissionais que querem refletir sobre si e, no futuro, como apoio integrado ao acompanhamento."
      >
        <LaunchSection eyebrow="Posicionamento" title="A Aurora não substitui vínculo clínico." lead="Ela não diagnostica, não prescreve e não promete tratamento. O valor está em ajudar a pessoa a chegar com mais registro, clareza e linguagem sobre o próprio momento.">
          <Grid columns={3}>
            <Card title="Usar">
              <p>Profissionais também podem usar a Aurora como diário de reflexão pessoal.</p>
            </Card>
            <Card title="Recomendar">
              <p>Uma prática gentil para pacientes que querem registrar entre sessões, quando fizer sentido para o processo.</p>
            </Card>
            <Card title="Integrar">
              <p>No horizonte, uma experiência pensada para consultórios, com consentimento e privacidade desde a origem.</p>
            </Card>
          </Grid>
        </LaunchSection>

        <LaunchSection alt eyebrow="Bom uso" title="Quando pode ajudar." lead="A Aurora tende a fazer mais sentido como espaço de registro e preparação, não como intervenção clínica.">
          <FineList
            items={[
              {
                title: "Entre sessões",
                body: "A pessoa registra acontecimentos, sentimentos e perguntas que talvez esquecesse até o próximo encontro.",
              },
              {
                title: "Antes da sessão",
                body: "O registro ajuda a chegar com menos ruído e mais material vivo para conversar.",
              },
              {
                title: "Depois da sessão",
                body: "A pessoa pode guardar o que ficou reverberando, sem transformar a experiência em tarefa pesada.",
              },
            ]}
          />
        </LaunchSection>

        <LaunchSection eyebrow="Limites profissionais" title="Consentimento precisa vir antes de qualquer integração." lead="Se a Aurora criar recursos para profissionais, eles devem respeitar consentimento explícito, minimização de dados e separação clara entre diário pessoal e acompanhamento.">
          <WideCard title="Convite aos profissionais">
            <p>Terapeutas, psicólogos e pesquisadores são bem-vindos na construção. O objetivo é ouvir cedo, errar pouco e criar uma ferramenta que respeite a complexidade do cuidado.</p>
          </WideCard>
        </LaunchSection>
      </LaunchPage>
    </>
  );
}
