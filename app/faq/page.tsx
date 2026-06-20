import { JsonLd } from "@/components/seo/JsonLd";
import { FineList, LaunchPage, LaunchSection } from "@/components/launch/LaunchPage";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Perguntas frequentes | Aurora",
  description: "Perguntas frequentes sobre a Aurora, acesso antecipado, privacidade, convites e uso responsável do diário por voz com IA.",
  path: "/faq",
  keywords: ["FAQ Aurora", "perguntas Aurora", "diário por voz com IA", "acesso antecipado Aurora"],
});

const questions = [
  {
    title: "A Aurora é terapia?",
    body: "Não. A Aurora é um diário por voz com IA para reflexão pessoal. Ela não faz diagnóstico, tratamento ou atendimento de emergência.",
  },
  {
    title: "Como funciona o acesso antecipado?",
    body: "Você cadastra o email, confirma a entrada e recebe acesso antecipado antes da abertura geral. Depois disso, acompanha os próximos passos pelo seu link pessoal e por email.",
  },
  {
    title: "Quando vou acessar o app?",
    body: "A Aurora será liberada em etapas. Quem está no acesso antecipado recebe os próximos passos por email antes da abertura geral. Convites confirmados podem antecipar benefícios e condições especiais.",
  },
  {
    title: "O que ganho ao entrar agora?",
    body: "Você entra no acesso antecipado, acompanha a abertura da Aurora, pode convidar pessoas queridas e recebe condições de estreia quando elas forem definidas.",
  },
  {
    title: "Como não perder meu acesso?",
    body: "Depois de se cadastrar, confirme seu email. As atualizações da abertura e a liberação do acesso antecipado chegam por email. Se a mensagem da Aurora cair em Spam ou Promoções, mova para a caixa principal e marque como favorita.",
  },
  {
    title: "Preciso indicar pessoas?",
    body: "Não. Indicar é opcional. Os convites existem para quem quer trazer pessoas queridas e antecipar acesso.",
  },
  {
    title: "A Aurora vende meus dados?",
    body: "Não. A Aurora não vende dados pessoais e não usa sua intimidade para anúncio.",
  },
  {
    title: "O que é o Ritual de Chegada?",
    body: "São perguntas leves e opcionais para a Aurora entender melhor como te receber quando seu acesso chegar.",
  },
  {
    title: "Quando o app abre?",
    body: "A abertura acontece em etapas. Quem registrou acesso antecipado recebe as novidades e liberações por email.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((question) => ({
      "@type": "Question",
      name: question.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: question.body,
      },
    })),
    url: absoluteUrl("/faq"),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LaunchPage
        page="faq"
        eyebrow="FAQ"
        title="Perguntas para chegar com calma."
        lead="As respostas mais importantes sobre Aurora, convites, privacidade e limites da experiência."
      >
        <LaunchSection eyebrow="Respostas" title="O essencial, sem letra miúda." lead="Se algo ainda não estiver claro, escreva para hello@leonardocamacho.com.">
          <FineList items={questions} />
        </LaunchSection>
      </LaunchPage>
    </>
  );
}
