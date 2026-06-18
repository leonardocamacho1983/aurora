import { JsonLd } from "@/components/seo/JsonLd";
import { Card, FineList, Grid, LaunchPage, LaunchSection, WideCard } from "@/components/launch/LaunchPage";
import { absoluteUrl, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Privacidade | Aurora",
  description:
    "Como a Aurora trata dados pessoais na lista de espera e no futuro diário por voz com IA, com referências a LGPD, GDPR e leis da Califórnia.",
  path: "/privacidade",
  keywords: [
    "privacidade Aurora",
    "LGPD diário por voz",
    "GDPR aplicativo de bem-estar",
    "CCPA CPRA privacidade",
    "dados pessoais IA",
  ],
});

export default function PrivacidadePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PrivacyPolicy",
    name: "Política de Privacidade da Aurora",
    url: absoluteUrl("/privacidade"),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LaunchPage
        page="privacidade"
        eyebrow="Privacidade"
        title="Feita para ser lida por gente."
        lead="A Aurora lida com intimidade. Por isso, privacidade não é uma página escondida no rodapé. É uma parte central da experiência."
      >
        <LaunchSection
          eyebrow="Resumo humano"
          title="Seu registro não é matéria-prima de anúncio."
          lead="Na lista de espera, guardamos o mínimo necessário para convite, confirmação e contexto inicial. No app, o objetivo é que seus dados trabalhem para você, não contra você."
        >
          <Grid columns={3}>
            <Card title="Sem venda de dados">
              <p>A Aurora não vende dados pessoais e não compartilha dados para publicidade comportamental cruzada.</p>
            </Card>
            <Card title="Sem truque escondido">
              <p>Se algum uso mudar, a política explica com clareza. A pessoa tem direito de entender o que está aceitando.</p>
            </Card>
            <Card title="Controle real">
              <p>Você poderá pedir acesso, correção, exportação e exclusão dos dados, de acordo com a lei aplicável.</p>
            </Card>
          </Grid>
        </LaunchSection>

        <LaunchSection alt eyebrow="Dados" title="O que existe na lista de espera." lead="A lista de espera é simples, mas já pede cuidado. Estes são os dados atuais do fluxo de lançamento.">
          <FineList
            items={[
              {
                title: "Email",
                body: "Usado para confirmar a entrada, enviar o link pessoal e avisar quando houver acesso.",
              },
              {
                title: "Indicações",
                body: "Código de convite, origem do convite, confirmações e marcos desbloqueados.",
              },
              {
                title: "Ritual de Chegada",
                body: "Nome, momento, ritmo, preferência e valor esperado, quando você decide responder.",
              },
              {
                title: "Dados técnicos",
                body: "Eventos de página, cliques essenciais e informações de dispositivo em nível limitado para melhorar a experiência.",
              },
            ]}
          />
        </LaunchSection>

        <LaunchSection eyebrow="Leis e direitos" title="A Aurora se prepara para múltiplas regiões." lead="LGPD, GDPR e leis da Califórnia têm diferenças importantes. O caminho é o mesmo: explicar, limitar, proteger e respeitar direitos.">
          <Grid columns={2}>
            <WideCard title="Brasil e Europa">
              <p>Usuários podem solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação, informação sobre compartilhamento e revisão quando aplicável.</p>
              <p>As bases legais podem incluir consentimento, execução de contrato, legítimo interesse limitado e cumprimento de obrigação legal.</p>
            </WideCard>
            <WideCard title="Califórnia">
              <p>Usuários da Califórnia podem ter direito de saber, acessar, corrigir, excluir, limitar certos usos de dados sensíveis e não sofrer discriminação por exercer direitos.</p>
              <p>A Aurora não vende dados pessoais e não compartilha dados para publicidade comportamental cruzada na lista de espera.</p>
            </WideCard>
          </Grid>
        </LaunchSection>

        <LaunchSection alt eyebrow="IA" title="Quem ajuda a Aurora a funcionar." lead="Alguns provedores técnicos ajudam com infraestrutura, email, banco de dados, analytics e processamento de IA. Eles existem para entregar a experiência, não para explorar sua intimidade.">
          <FineList
            items={[
              {
                title: "Finalidade",
                body: "Enviar confirmações, manter a lista, processar registros quando o app abrir e melhorar estabilidade.",
              },
              {
                title: "Transferência internacional",
                body: "Alguns operadores podem estar fora do Brasil. Quando isso ocorrer, a Aurora usará salvaguardas contratuais e técnicas apropriadas.",
              },
              {
                title: "Contato",
                body: "Para exercer direitos ou tirar dúvidas: hello@leonardocamacho.com.",
              },
            ]}
          />
        </LaunchSection>

        <LaunchSection eyebrow="Importante" title="A Aurora não é atendimento de emergência." lead="Se você estiver em risco imediato ou pensando em se machucar, procure ajuda local de emergência agora. No Brasil, ligue 188 para o CVV ou 192 para o SAMU. Em outros países, procure a linha de crise local." />
      </LaunchPage>
    </>
  );
}
