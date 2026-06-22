import { JsonLd } from "@/components/seo/JsonLd";
import { Card, FineList, Grid, LaunchPage, LaunchSection, Quote, WideCard } from "@/components/launch/LaunchPage";
import { TrustSignupCard } from "@/components/landing/TrustSignupCard";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Política de e-mail, comunicação e sem spam | Aurora",
  description:
    "Como a Aurora usa email, convites e comunicações com cuidado, sem spam, sem pressão e sem transformar intimidade em campanha.",
  path: "/privacidade/email",
  keywords: [
    "Aurora email sem spam",
    "política de email Aurora",
    "comunicação sem spam",
    "privacidade Aurora",
    "convites Aurora",
  ],
});

export default function EmailPolicyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Política de e-mail, comunicação e sem spam da Aurora",
    url: absoluteUrl("/privacidade/email"),
    isPartOf: absoluteUrl("/privacidade"),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LaunchPage
        page="privacidade-email"
        heroMode="compact"
        eyebrow="Email sem spam"
        title="Seu tempo e sua intimidade não são uma lista."
        lead="A Aurora só deve chegar até você quando houver permissão, motivo claro e cuidado. O vínculo começa antes do diário: começa no jeito como pedimos seu email, enviamos mensagens e recebemos pessoas convidadas."
      >
        <LaunchSection
          eyebrow="O pacto"
          title="Comunicação também é cuidado."
          lead="A Aurora é um diário por voz para organizar o que você sente, pensa e quer colocar em prática. Por isso, até uma mensagem de email precisa respeitar o mesmo princípio: presença sem pressão."
        >
          <Grid columns={3}>
            <Card title="Seu tempo não é canal de campanha.">
              <p>Aurora evita urgência artificial, excesso de mensagens e contato sem propósito claro.</p>
            </Card>
            <Card title="Sua intimidade não vira segmentação.">
              <p>O que você fala, escreve, registra ou elabora dentro da Aurora não é usado para campanhas de email.</p>
            </Card>
            <Card title="Seu silêncio também é respeitado.">
              <p>Não abrir, não clicar ou sair da lista é tratado como sinal suficiente para reduzir ou encerrar contato.</p>
            </Card>
          </Grid>
        </LaunchSection>

        <LaunchSection alt bare>
          <TrustSignupCard source="privacy_email_page" fullBleed />
        </LaunchSection>

        <LaunchSection
          eyebrow="Quando escrevemos"
          title="Toda mensagem precisa ter um motivo simples."
          lead="A Aurora não quer disputar sua caixa de entrada. Estas são as situações em que uma mensagem pode fazer sentido."
        >
          <FineList
            items={[
              {
                title: "Confirmação",
                body: "Quando você pede seu convite, enviamos um link para confirmar que aquele email é seu.",
              },
              {
                title: "Convite e acesso",
                body: "Quando houver uma nova onda de acesso, próximos passos ou uma atualização importante sobre sua entrada.",
              },
              {
                title: "Segurança e conta",
                body: "Quando algo for necessário para proteger sua conta, seu acesso ou seus direitos.",
              },
              {
                title: "Evolução da Aurora",
                body: "Raramente, quando houver algo relevante para quem pediu para acompanhar a Aurora.",
              },
            ]}
          />
        </LaunchSection>

        <LaunchSection
          alt
          eyebrow="Limites"
          title="O que a Aurora não faz."
          lead="A confiança também aparece no que a Aurora escolhe não transformar em estratégia de crescimento."
        >
          <Grid columns={2}>
            <WideCard title="Sem spam e sem lista comprada">
              <p>Aurora não compra listas, não envia campanhas para pessoas que não pediram contato e não trata email como volume.</p>
              <p>Se uma mensagem não tem motivo claro para existir, ela não deveria ser enviada.</p>
            </WideCard>
            <WideCard title="Sem usar conteúdo íntimo como gatilho">
              <p>Diário, áudio, transcrição, reflexão, resposta aberta e temas pessoais não entram como critério de campanha.</p>
              <p>A Aurora pode aprender sobre a experiência de forma agregada e segura, mas não transforma sua intimidade em régua de email.</p>
            </WideCard>
          </Grid>
        </LaunchSection>

        <LaunchSection
          id="convites-com-cuidado"
          eyebrow="Pessoas queridas"
          title="Quando você convida alguém, a relação entre vocês também merece cuidado."
          lead="Convite não é viralização. É uma porta discreta para alguém chegar, entender e decidir no próprio tempo."
        >
          <WideCard title="A Aurora recebe essa pessoa com cuidado.">
            <p>
              Seu convite não autoriza insistência, exposição ou pressão. A pessoa convidada decide se quer chegar,
              confirma o próprio email e pode sair das comunicações quando quiser.
            </p>
            <p>A Aurora não manda mensagens por você e não expõe a relação entre vocês.</p>
          </WideCard>
          <Quote>
            Um convite bom não empurra. Ele abre uma porta e deixa a pessoa escolher se quer atravessar.
          </Quote>
        </LaunchSection>

        <LaunchSection
          alt
          eyebrow="Saída"
          title="Você pode sair sem precisar explicar."
          lead="Descadastro, reclamação, bounce ou silêncio prolongado são sinais suficientes para reduzir ou encerrar comunicação."
        >
          <FineList
            items={[
              {
                title: "Descadastro",
                body: "Comunicações não essenciais devem trazer um caminho claro para sair.",
              },
              {
                title: "Entregabilidade",
                body: "Bounces, reclamações e sinais de rejeição devem virar supressão, não insistência.",
              },
              {
                title: "Manutenção da base",
                body: "Emails não confirmados devem ser arquivados com cuidado antes de qualquer exclusão definitiva.",
              },
            ]}
          />
        </LaunchSection>
      </LaunchPage>
    </>
  );
}
