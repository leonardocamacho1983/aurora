import { JsonLd } from "@/components/seo/JsonLd";
import { FineList, LaunchPage, LaunchSection } from "@/components/launch/LaunchPage";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Perguntas frequentes | Aurora",
  description: "Perguntas frequentes sobre a Aurora, lista de espera, privacidade, convites e uso responsável do diário por voz com IA.",
  path: "/faq",
  keywords: ["FAQ Aurora", "perguntas Aurora", "diário por voz com IA", "lista de espera Aurora"],
});

const questions = [
  {
    title: "A Aurora é terapia?",
    body: "Não. A Aurora é um diário por voz com IA para reflexão pessoal. Ela não faz diagnóstico, tratamento ou atendimento de emergência.",
  },
  {
    title: "Como funciona a lista de espera?",
    body: "Você cadastra o email, confirma a entrada e recebe uma sala pessoal para acompanhar convites e marcos.",
  },
  {
    title: "Preciso indicar pessoas?",
    body: "Não. Indicar é opcional. Os convites existem para quem quer trazer pessoas queridas e antecipar acesso.",
  },
  {
    title: "A Aurora vende meus dados?",
    body: "Não. A Aurora não vende dados pessoais e não usa sua intimidade como produto de anúncio.",
  },
  {
    title: "O que é o Ritual de Chegada?",
    body: "São perguntas leves e opcionais para a Aurora entender melhor como te receber quando seu acesso chegar.",
  },
  {
    title: "Quando o app abre?",
    body: "A Aurora abre por convites. Quem entra na lista recebe notícias quando houver novas vagas.",
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
        lead="As respostas mais importantes sobre Aurora, convites, privacidade e limites do produto."
      >
        <LaunchSection eyebrow="Respostas" title="O essencial, sem letra miúda." lead="Se algo ainda não estiver claro, escreva para hello@leonardocamacho.com.">
          <FineList items={questions} />
        </LaunchSection>
      </LaunchPage>
    </>
  );
}
