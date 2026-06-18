import { JsonLd } from "@/components/seo/JsonLd";
import { Card, FineList, Grid, LaunchPage, LaunchSection, Quote, WideCard } from "@/components/launch/LaunchPage";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Método Aurora | Voz, reflexão e clareza",
  description:
    "Como a Aurora usa voz, IA e perguntas adaptativas para ajudar pessoas a registrar momentos e perceber padrões sem pressão.",
  path: "/metodo",
  keywords: [
    "método Aurora",
    "diário por voz",
    "reflexão com IA",
    "perguntas adaptativas",
    "autoconhecimento por voz",
  ],
});

export default function MetodoPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Método Aurora",
    description:
      "Uma explicação sobre voz, reflexão pessoal, perguntas adaptativas e limites responsáveis no uso de IA.",
    url: absoluteUrl("/metodo"),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LaunchPage
        page="metodo"
        eyebrow="Método"
        title="A pergunta certa muda o começo da conversa."
        lead="Você fala do jeito que consegue. A Aurora organiza o registro, percebe o que merece atenção e devolve um começo mais claro para a conversa."
      >
        <LaunchSection eyebrow="Entrada" title="A voz reduz a pressão." lead="Escrever exige forma. Falar permite chegada. Por isso, a Aurora começa pelo gesto mais simples: tocar e falar por alguns minutos.">
          <Grid columns={3}>
            <Card title="Menos tela em branco">
              <p>Você não tem que escrever bonito, escolher título ou começar do jeito certo. A fala pode vir como vier.</p>
            </Card>
            <Card title="Mais contexto vivo">
              <p>Pausas, repetições e escolha de palavras ajudam a revelar o que importa naquele momento.</p>
            </Card>
            <Card title="Registro que fica">
              <p>A fala vira um texto claro para reler, guardar e perceber com mais calma depois.</p>
            </Card>
          </Grid>
        </LaunchSection>

        <LaunchSection alt eyebrow="Reflexão" title="Clareza não vem como conselho pronto." lead="A Aurora devolve perspectiva, não autoridade. O retorno fica útil, gentil e na medida do que você trouxe.">
          <FineList
            items={[
              {
                title: "Organizar",
                body: "Separar o essencial do ruído, sem transformar sua fala em um relatório frio.",
              },
              {
                title: "Perceber",
                body: "Identificar sinais recorrentes, mudanças de fase e pontos que pedem atenção.",
              },
              {
                title: "Refletir",
                body: "Oferecer uma devolutiva que ajude a pensar e sentir com mais nitidez.",
              },
            ]}
          />
        </LaunchSection>

        <LaunchSection eyebrow="Inspiração" title="O Oráculo não assumia quem chegava." lead="A Aurora não abre tentando encaixar você em uma categoria. Ela procura o que vale atenção naquele dia.">
          <Grid columns={2}>
            <WideCard title="Sem diagnóstico de entrada">
              <p>Você pode chegar feliz, triste, confuso, empolgado ou apenas comum. A Aurora recebe esses estados sem reduzir sua vida a uma etiqueta.</p>
            </WideCard>
            <WideCard title="Sem excesso">
              <p>Às vezes, uma pergunta basta. Inteligência também é saber não pesar a experiência.</p>
            </WideCard>
          </Grid>
        </LaunchSection>

        <LaunchSection alt eyebrow="Limites" title="Cuidado não é promessa clínica." lead="A Aurora pode apoiar reflexão pessoal, mas não substitui terapia, diagnóstico, tratamento ou atendimento de emergência.">
          <Quote>A pergunta mais importante não é o que está errado. É o que você veio descobrir.</Quote>
        </LaunchSection>
      </LaunchPage>
    </>
  );
}
