import { JsonLd } from "@/components/seo/JsonLd";
import { Card, FineList, Grid, LaunchPage, LaunchSection, WideCard } from "@/components/launch/LaunchPage";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Diário por voz com IA | Aurora",
  description:
    "Entenda como um diário por voz com IA ajuda a registrar sentimentos, reduzir a pressão da tela em branco e perceber padrões pessoais.",
  path: "/diario-por-voz",
  keywords: [
    "diário por voz",
    "diário por voz com IA",
    "app de diário por voz",
    "registrar sentimentos por voz",
    "diário pessoal com inteligência artificial",
  ],
});

export default function DiarioPorVozPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Diário por voz com IA",
    url: absoluteUrl("/diario-por-voz"),
    description:
      "Guia sobre diário por voz com IA e como a Aurora usa voz para criar registros pessoais com mais clareza.",
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LaunchPage
        page="diario-por-voz"
        eyebrow="Diário por voz"
        title="Falar pode ser mais fácil do que começar a escrever."
        lead="Um diário por voz reduz a pressão de ter a frase certa. Você fala por alguns minutos. A Aurora organiza o registro e ajuda a perceber o que ficou vivo."
      >
        <LaunchSection eyebrow="Para quem" title="Quando um diário por voz faz sentido." lead="A Aurora foi pensada para momentos em que escrever parece pesado, frio ou distante demais do que a pessoa está sentindo.">
          <Grid columns={3}>
            <Card title="Dias cheios">
              <p>Quando muita coisa aconteceu e você só precisa despejar antes de organizar.</p>
            </Card>
            <Card title="Mudanças de fase">
              <p>Quando trabalho, maternidade, carreira, relação ou dinheiro pedem um jeito novo de olhar.</p>
            </Card>
            <Card title="Rotina comum">
              <p>Quando nada parece grande, mas algo do dia merece ser lembrado antes de sumir.</p>
            </Card>
          </Grid>
        </LaunchSection>

        <LaunchSection alt eyebrow="Diferença" title="Não é gravador. Não é bloco de notas." lead="O valor não está apenas em registrar áudio. Está em transformar a fala em um espelho claro, respeitoso e útil.">
          <FineList
            items={[
              {
                title: "Voz",
                body: "Você registra do jeito que consegue naquele momento.",
              },
              {
                title: "Texto",
                body: "A fala vira registro organizado para reler com calma.",
              },
              {
                title: "Reflexão",
                body: "A Aurora devolve uma perspectiva proporcional ao que você trouxe.",
              },
              {
                title: "Linha do tempo",
                body: "Com o tempo, seus registros mostram padrões sem transformar cuidado em planilha.",
              },
            ]}
          />
        </LaunchSection>

        <LaunchSection eyebrow="Privacidade" title="Um diário só funciona se parece seguro." lead="A Aurora não é uma rede social. Não existe para expor sua intimidade, vender dados ou capturar atenção infinita.">
          <WideCard title="O gesto certo é pequeno">
            <p>Falar por alguns minutos, guardar o registro e seguir com o dia. A Aurora deve ajudar a pessoa a voltar para a própria vida com um pouco mais de clareza.</p>
          </WideCard>
        </LaunchSection>
      </LaunchPage>
    </>
  );
}
