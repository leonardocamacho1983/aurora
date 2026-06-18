import { JsonLd } from "@/components/seo/JsonLd";
import { Card, FineList, Grid, LaunchPage, LaunchSection, Quote, WideCard } from "@/components/launch/LaunchPage";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Manifesto Aurora | Luz, voz e autoconhecimento",
  description:
    "O manifesto da Aurora, um diário por voz com IA inspirado no amanhecer, no Oráculo de Delfos e em uma tecnologia feita para revelar sem invadir.",
  path: "/manifesto",
  keywords: [
    "manifesto Aurora",
    "diário por voz com IA",
    "Oráculo de Delfos",
    "tecnologia regenerativa",
    "autoconhecimento",
  ],
});

export default function ManifestoPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Manifesto Aurora",
    description:
      "A história da luz, da voz e da decisão de criar um diário por voz com IA para reflexão pessoal.",
    url: absoluteUrl("/manifesto"),
    publisher: {
      "@type": "Organization",
      name: "Aurora",
      logo: absoluteUrl("/icon.svg"),
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LaunchPage
        page="manifesto"
        eyebrow="Manifesto"
        title="A luz que aparece quando a voz encontra espaço."
        lead="Amanhecer não conserta o mundo. Ele revela contornos. A Aurora nasce dessa mesma imagem: quando você fala em voz alta, algo que estava confuso começa a ganhar forma."
      >
        <LaunchSection
          eyebrow="Por que Aurora"
          title="Aurora é o nome de quando a luz começa a voltar."
          lead="Na mitologia romana, Aurora anuncia o sol. O nome guarda essa imagem simples: a passagem entre o escuro e o primeiro contorno do dia."
        >
          <Grid columns={3}>
            <Card title="A deusa do amanhecer">
              <p>Ela atravessa o céu antes do sol e espalha orvalho sobre o mundo. É uma imagem de chegada, não de pressa.</p>
            </Card>
            <Card title="Luz e visão">
              <p>Na família mítica de Aurora estão luz, visão, sol e lua. A experiência carrega essa promessa: iluminar sem invadir.</p>
            </Card>
            <Card title="O próximo gesto">
              <p>Nem todo amanhecer resolve o dia. Às vezes, ele só mostra melhor onde pisar. Para a Aurora, isso já importa.</p>
            </Card>
          </Grid>
        </LaunchSection>

        <LaunchSection
          alt
          eyebrow="O oráculo"
          title="A Aurora não pergunta o que está errado."
          lead="Ela não parte do diagnóstico. Ela parte da pessoa que chegou, do dia que ela viveu e do que pede mais clareza."
        >
          <Grid columns={2}>
            <WideCard title="Conhece-te a ti mesmo">
              <p>O Oráculo de Delfos recebia reis, navegadores, atletas, enlutados, apaixonados e pessoas comuns. A pergunta certa dependia de quem chegava.</p>
              <p>A Aurora segue essa inspiração: não reduzir a pessoa a um estado emocional, mas descobrir o que vale ser perguntado hoje.</p>
            </WideCard>
            <WideCard title="Nada em excesso">
              <p>A experiência pode ser bonita sem ficar ruidosa. Pode ser inteligente sem fingir autoridade sobre a vida de alguém.</p>
              <p>O papel da Aurora é criar um espelho cuidadoso. A decisão continua sendo da pessoa.</p>
            </WideCard>
          </Grid>
        </LaunchSection>

        <LaunchSection
          eyebrow="O que a Aurora é"
          title="Um diário por voz com IA para reflexão pessoal."
          lead="Não é terapia, diagnóstico, tratamento, coaching ou serviço de emergência. É um espaço íntimo para registrar, organizar e perceber padrões com mais nitidez."
        >
          <FineList
            items={[
              {
                title: "Você fala",
                body: "A entrada começa pela voz, porque falar reduz a pressão de escrever bonito ou organizar tudo antes.",
              },
              {
                title: "A Aurora organiza",
                body: "A tecnologia transforma o registro em texto, percebe sinais e cria uma devolutiva pensada para aquele momento.",
              },
              {
                title: "Você decide",
                body: "A Aurora não manda na sua vida. Ela oferece clareza suficiente para você escolher o próximo gesto com mais presença.",
              },
            ]}
          />
        </LaunchSection>

        <LaunchSection alt eyebrow="Empresa regenerativa" title="Crescer só faz sentido se fizer bem." lead="A Aurora quer crescer quando gera confiança suficiente para ser indicada. Não por vício, ruído ou exploração da intimidade.">
          <Grid columns={2}>
            <WideCard title="Dados a serviço da pessoa">
              <p>Quando a Aurora aprende algo, esse aprendizado volta para quem falou como cuidado, contexto e clareza. Não como publicidade.</p>
            </WideCard>
            <WideCard title="Aurora.org como próximo passo">
              <p>Aurora.org é o próximo passo da companhia: uma iniciativa separada, preparada com responsabilidade, para educação, pesquisa e prevenção. A Aurora nasce comercial, mas não termina em si mesma.</p>
            </WideCard>
          </Grid>
        </LaunchSection>

        <LaunchSection eyebrow="O filme" title="O filme está nascendo." lead="A música que abre a experiência é um fragmento de uma composição maior. Ela vai acompanhar um filme-manifesto sobre luz, voz e travessia.">
          <WideCard title="Aguarde. O filme-manifesto está em produção.">
            <p>Por enquanto, fica o recorte do amanhecer. A versão completa virá como uma peça para ser sentida antes de ser explicada.</p>
          </WideCard>
          <Quote>O que a gente diz em voz alta deixa de morar só na cabeça e começa a fazer sentido.</Quote>
        </LaunchSection>
      </LaunchPage>
    </>
  );
}
