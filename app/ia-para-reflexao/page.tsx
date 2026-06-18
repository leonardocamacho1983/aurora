import { JsonLd } from "@/components/seo/JsonLd";
import { Card, FineList, Grid, LaunchPage, LaunchSection, Quote } from "@/components/launch/LaunchPage";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "IA para reflexão pessoal | Aurora",
  description:
    "Como a Aurora usa IA para apoiar reflexão pessoal sem substituir terapia, diagnóstico ou cuidado profissional.",
  path: "/ia-para-reflexao",
  keywords: [
    "IA para reflexão pessoal",
    "inteligência artificial para autoconhecimento",
    "diário com IA",
    "IA para organizar sentimentos",
    "IA que não é terapia",
  ],
});

export default function IaParaReflexaoPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "IA para reflexão pessoal",
    url: absoluteUrl("/ia-para-reflexao"),
    description:
      "Como a Aurora usa IA de forma responsável para reflexão pessoal, organização de fala e clareza.",
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LaunchPage
        page="ia-para-reflexao"
        eyebrow="IA para reflexão"
        title="A boa IA não finge saber mais sobre você do que você."
        lead="A Aurora usa IA como espelho, não como juiz. Ela organiza a fala, percebe sinais e oferece uma devolutiva que ajuda a pensar e sentir com mais nitidez."
      >
        <LaunchSection eyebrow="Uso responsável" title="Como a IA aparece para você." lead="A tecnologia reduz atrito e amplia clareza sem ocupar o lugar da pessoa, da terapia ou do cuidado profissional.">
          <Grid columns={3}>
            <Card title="Transcreve">
              <p>Transforma fala em texto para você reler com calma.</p>
            </Card>
            <Card title="Organiza">
              <p>Encontra tema, sinal e começo dentro do que foi dito.</p>
            </Card>
            <Card title="Reflete">
              <p>Propõe uma perspectiva feita para aquele momento, sem conselho pronto.</p>
            </Card>
          </Grid>
        </LaunchSection>

        <LaunchSection alt eyebrow="Limites" title="Onde a Aurora coloca limite." lead="Um espaço íntimo fica mais seguro quando é claro sobre o que não promete. Sem fantasia de autoridade, sem promessa clínica e sem captura desnecessária de dados.">
          <FineList
            items={[
              {
                title: "Não diagnostica",
                body: "A Aurora não identifica transtornos, não prescreve condutas e não substitui profissionais.",
              },
              {
                title: "Não dá ordem",
                body: "A devolutiva abre espaço de reflexão, sem empurrar uma decisão.",
              },
              {
                title: "Não transforma sua vida em métrica de marketing",
                body: "Dados íntimos voltam para a pessoa como clareza, não como ferramenta de anúncio.",
              },
            ]}
          />
        </LaunchSection>

        <LaunchSection eyebrow="Tese" title="A boa IA fica menor quando a pessoa fica maior." lead="Na Aurora, tecnologia boa é aquela que desaparece o suficiente para você se escutar melhor.">
          <Quote>A IA não fala por você. Ela ajuda você a reconhecer melhor a própria voz.</Quote>
        </LaunchSection>
      </LaunchPage>
    </>
  );
}
