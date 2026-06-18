import { JsonLd } from "@/components/seo/JsonLd";
import { Card, FineList, Grid, LaunchPage, LaunchSection, Quote, WideCard } from "@/components/launch/LaunchPage";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Manifesto Aurora | A jornada da luz",
  description:
    "O manifesto da Aurora, um diário por voz com IA inspirado no amanhecer, no Oráculo de Delfos e na ideia de tecnologia regenerativa.",
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
      "A história da luz, do nome Aurora e da decisão de criar um diário por voz com IA para reflexão pessoal.",
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
        title="A história da luz que virou um produto."
        lead="Aurora nasce da ideia de que falar em voz alta pode abrir espaço. Não para consertar uma pessoa, mas para revelar o que ela veio descobrir naquele momento."
        secondary={{ href: "/metodo", label: "Conhecer o método" }}
      >
        <LaunchSection
          eyebrow="Por que Aurora"
          title="O nome vem do amanhecer."
          lead="Na mitologia romana, Aurora anuncia a chegada do sol. O nome carrega renovação, esperança e a passagem delicada entre escuridão e luz."
        >
          <Grid columns={3}>
            <Card title="A deusa do amanhecer">
              <p>Ela cruza o céu para acordar o mundo. A Aurora do produto nasce dessa imagem: um começo que chega com leveza.</p>
            </Card>
            <Card title="Luz e visão">
              <p>Na família mítica de Aurora estão luz, visão, sol e lua. Isso conversa com o que o app tenta fazer: iluminar sem invadir.</p>
            </Card>
            <Card title="A hora favorita">
              <p>O amanhecer não promete que tudo ficou simples. Ele só mostra que há uma nova possibilidade de olhar.</p>
            </Card>
          </Grid>
        </LaunchSection>

        <LaunchSection
          alt
          eyebrow="O oráculo"
          title="A Aurora não pergunta o que está errado."
          lead="Ela não parte do diagnóstico. Ela parte da pessoa que chegou, do dia que ela viveu e do que precisa aparecer com mais clareza."
        >
          <Grid columns={2}>
            <WideCard title="Conhece-te a ti mesmo">
              <p>O Oráculo de Delfos recebia reis, navegadores, atletas, enlutados, apaixonados e pessoas comuns. A pergunta certa dependia de quem chegava.</p>
              <p>A Aurora segue essa inspiração: não reduzir a pessoa a um estado emocional, mas descobrir o que vale ser perguntado hoje.</p>
            </WideCard>
            <WideCard title="Nada em excesso">
              <p>O produto precisa ser bonito, mas não pode ser ruidoso. Precisa ser inteligente, mas não pode fingir autoridade sobre a vida de alguém.</p>
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

        <LaunchSection alt eyebrow="Empresa regenerativa" title="Crescer só faz sentido se fizer bem." lead="A Aurora quer crescer a partir de confiança, indicação e valor real. Não por vício, ruído ou exploração da intimidade.">
          <Grid columns={2}>
            <WideCard title="Dados a serviço da pessoa">
              <p>O dado mais importante é aquele que volta para o usuário como cuidado, contexto e clareza. A Aurora não existe para metrificar humor ou vender fragilidade.</p>
            </WideCard>
            <WideCard title="Aurora.org no horizonte">
              <p>Aurora.org será uma iniciativa separada, em gestação, dedicada a educação, pesquisa e apoio em prevenção. A ideia é simples: a empresa nutre uma causa maior que ela.</p>
            </WideCard>
          </Grid>
        </LaunchSection>

        <LaunchSection eyebrow="O filme" title="A trilha do teaser é só o começo." lead="O filme do manifesto vai contar a jornada da luz. A música completa expande os dezoito segundos do teaser para uma narrativa maior, feita para ser sentida antes de ser explicada.">
          <Quote>O que a gente diz em voz alta deixa de morar só na cabeça e começa a fazer sentido.</Quote>
        </LaunchSection>
      </LaunchPage>
    </>
  );
}
