import { JsonLd } from "@/components/seo/JsonLd";
import { FineList, LaunchPage, LaunchSection, WideCard } from "@/components/launch/LaunchPage";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Termos de Uso | Aurora",
  description:
    "Termos de uso da Aurora para lista de espera, convites, beta e futuro diário por voz com IA.",
  path: "/termos",
  keywords: ["termos Aurora", "termos diário por voz", "lista de espera Aurora"],
});

export default function TermosPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Termos de Uso da Aurora",
    url: absoluteUrl("/termos"),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LaunchPage
        page="termos"
        eyebrow="Termos"
        title="Um acordo simples para uma experiência delicada."
        lead="A Aurora é um diário por voz com IA para reflexão pessoal. Estes termos explicam a lista de espera, os convites e os limites da experiência."
      >
        <LaunchSection eyebrow="Uso" title="O que você pode esperar." lead="A lista de espera dá acesso a convites, páginas pessoais e comunicações sobre lançamento. O app ainda pode mudar durante testes.">
          <FineList
            items={[
              {
                title: "Lista de espera",
                body: "Ao cadastrar seu email, você aceita receber mensagens transacionais sobre confirmação, status, convites e acesso.",
              },
              {
                title: "Convites",
                body: "Marcos e cortesias podem antecipar acesso ou liberar benefícios. Eles podem mudar antes do lançamento comercial.",
              },
              {
                title: "Beta",
                body: "Recursos em teste podem falhar, mudar de forma ou ser removidos conforme aprendemos com segurança.",
              },
            ]}
          />
        </LaunchSection>

        <LaunchSection alt eyebrow="Limites" title="A Aurora não substitui cuidado profissional." lead="A Aurora não é terapia, diagnóstico, tratamento, aconselhamento médico, serviço de emergência ou promessa de resultado psicológico.">
          <WideCard title="Quando procurar ajuda agora">
            <p>Se houver risco imediato, ideação suicida, violência, urgência médica ou sofrimento intenso, procure um serviço local de emergência ou um profissional qualificado.</p>
            <p>No Brasil, o CVV atende pelo 188. Em outros países, procure a linha de crise local.</p>
          </WideCard>
        </LaunchSection>

        <LaunchSection eyebrow="Responsabilidades" title="Use com cuidado e boa fé." lead="A experiência existe para reflexão pessoal. Não use a Aurora para prejudicar outras pessoas, violar leis, enviar dados de terceiros sem autorização ou tentar explorar a plataforma.">
          <FineList
            items={[
              {
                title: "Conta e email",
                body: "Você é responsável por usar um email válido e por proteger o acesso aos seus links pessoais.",
              },
              {
                title: "Conteúdo",
                body: "Você mantém direitos sobre o que registra. A Aurora precisa processar esse conteúdo para entregar a experiência.",
              },
              {
                title: "Mudanças",
                body: "Termos, recursos e benefícios podem ser atualizados. Mudanças importantes devem ser comunicadas com clareza.",
              },
              {
                title: "Contato",
                body: "Dúvidas, pedidos e avisos podem ser enviados para hello@leonardocamacho.com.",
              },
            ]}
          />
        </LaunchSection>
      </LaunchPage>
    </>
  );
}
