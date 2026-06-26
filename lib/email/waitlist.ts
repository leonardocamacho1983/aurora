import { Resend } from "resend";
import { confirmUrl, referralUrl, statusUrl } from "@/lib/referral/urls";
import type { ReferralMilestone } from "@/lib/referral/milestones";

type WaitlistEmailRow = {
  email: string;
  referralCode: string;
  statusToken: string;
  confirmToken: string;
};

export type LifecycleEmailKind =
  | "unconfirmed_1h"
  | "unconfirmed_24h"
  | "invited_unconfirmed_1h"
  | "confirmed_no_invite_24h"
  | "share_no_confirmed_invite_24h"
  | "confirmed_no_ritual_24h";

type LifecycleEmailInput = {
  row: WaitlistEmailRow & { name?: string | null };
  kind: LifecycleEmailKind;
  baseUrl: string;
  confirmedInvites?: number;
};

let resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend ??= new Resend(key);
  return resend;
}

function fromAddress(): string | null {
  return process.env.EMAIL_FROM?.trim() || null;
}

async function sendEmail(input: { to: string; subject: string; html: string; text: string; scheduledAt?: string }) {
  const client = getResend();
  const from = fromAddress();
  if (!client || !from) {
    console.warn("waitlist email skipped: missing RESEND_API_KEY or EMAIL_FROM");
    return false;
  }

  try {
    await client.emails.send({ from, ...input });
    return true;
  } catch (error) {
    console.error("waitlist email failed:", error);
    return false;
  }
}

function shell(content: string): string {
  return `
    <div style="margin:0;padding:32px;background:#070512;color:#f0ecf7;font-family:Inter,Arial,sans-serif">
      <div style="max-width:560px;margin:0 auto;padding:28px;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:#0e0c1a">
        <div style="font-family:Georgia,serif;font-size:28px;color:#f8f6fc;margin-bottom:18px">Aurora</div>
        ${content}
      </div>
    </div>
  `;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin:18px 0 10px;padding:14px 20px;border-radius:999px;background:#a99bd9;color:#1b1730;text-decoration:none;font-weight:700">${label}</a>`;
}

function quietLink(label: string, href: string): string {
  return `<a href="${href}" style="color:#cfc6f6;text-decoration:underline;text-underline-offset:3px">${label}</a>`;
}

function leoSignatureHtml() {
  return `<p style="font-size:14px;line-height:1.6;color:#948fa8">Com carinho,<br>Leo<br>Criador da Aurora · ${quietLink("@camacho__leo", "https://instagram.com/camacho__leo")}</p>`;
}

function leoSignatureText() {
  return `Com carinho,
Leo
Criador da Aurora
@camacho__leo: https://instagram.com/camacho__leo`;
}

function inboxInstruction(): string {
  return `
    <div style="margin:22px 0;padding:16px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:#151225">
      <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#d8d3e6"><strong>Para acompanhar a abertura da Aurora:</strong></p>
      <div style="display:flex;gap:10px;align-items:center;margin:10px 0">
        <span style="display:inline-block;width:34px;height:34px;border-radius:10px;background:#211b35;text-align:center;line-height:34px;color:#f4d98b;font-size:20px">★</span>
        <span style="font-size:13px;line-height:1.5;color:#b8b1ca">A Aurora vai avisar por email quando novas entradas forem liberadas. Marque este email como favorito. Se ele tiver caído em Spam ou Promoções, mova para a caixa principal.</span>
      </div>
    </div>
  `;
}

function greeting(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed ? `${trimmed}, ` : "";
}

export async function sendConfirmEmail(row: WaitlistEmailRow, baseUrl: string) {
  const url = confirmUrl(row.confirmToken, baseUrl);
  const share = referralUrl(row.referralCode, baseUrl);

  return sendEmail({
    to: row.email,
    subject: "Confirme seu acesso antecipado à Aurora",
    html: shell(`
      <p style="font-size:16px;line-height:1.6;color:#d8d3e6">Você está a um passo de registrar seu acesso antecipado. Confirme seu email para receber os próximos passos da abertura da Aurora antes da abertura geral.</p>
      ${button("Confirmar meu acesso antecipado", url)}
      ${inboxInstruction()}
      <p style="font-size:14px;line-height:1.6;color:#948fa8">Depois de confirmar, você pode acompanhar convites e próximos passos pelo seu link pessoal:</p>
      <p style="font-size:14px;line-height:1.6;color:#c9c4d8">${share}</p>
    `),
    text: `Confirme seu acesso antecipado à Aurora: ${url}\n\nA Aurora vai avisar por email quando novas entradas forem liberadas. Marque este email como favorito. Se ele tiver caído em Spam ou Promoções, mova para a caixa principal.\n\nSeu link pessoal: ${share}`,
  });
}

export async function sendStatusEmail(row: WaitlistEmailRow, baseUrl: string) {
  const url = statusUrl(row.statusToken, baseUrl);
  return sendEmail({
    to: row.email,
    subject: "Seu acesso antecipado à Aurora",
    html: shell(`
      <p style="font-size:16px;line-height:1.6;color:#d8d3e6">Seu acesso antecipado está registrado. Abra seu link pessoal para acompanhar convites, próximos passos e novidades da abertura.</p>
      ${button("Ver meu acesso antecipado", url)}
    `),
    text: `Seu acesso antecipado à Aurora: ${url}`,
  });
}

export async function sendFriendJoinedEmail(input: {
  row: WaitlistEmailRow;
  confirmedCount: number;
  baseUrl: string;
}) {
  const url = statusUrl(input.row.statusToken, input.baseUrl);
  const plural = input.confirmedCount === 1 ? "pessoa confirmou" : "pessoas confirmaram";
  return sendEmail({
    to: input.row.email,
    subject: "Alguém entrou pelo seu convite Aurora",
    html: shell(`
      <p style="font-size:16px;line-height:1.6;color:#d8d3e6">${input.confirmedCount} ${plural} pelo seu convite. Sua indicação está trazendo pessoas para perto.</p>
      ${button("Ver meu progresso", url)}
    `),
    text: `${input.confirmedCount} ${plural} pelo seu convite Aurora.\n\nVer progresso: ${url}`,
  });
}

export async function sendMilestoneEmail(input: {
  row: WaitlistEmailRow;
  milestone: ReferralMilestone;
  confirmedCount: number;
  baseUrl: string;
}) {
  const url = statusUrl(input.row.statusToken, input.baseUrl);
  return sendEmail({
    to: input.row.email,
    subject: `Marco Aurora desbloqueado: ${input.milestone.shortTitle}`,
    html: shell(`
      <p style="font-size:16px;line-height:1.6;color:#d8d3e6">Você chegou a ${input.confirmedCount} convites confirmados e desbloqueou:</p>
      <h1 style="font-family:Georgia,serif;font-weight:400;font-size:30px;line-height:1.15;color:#f8f6fc">${input.milestone.title}</h1>
      <p style="font-size:15px;line-height:1.6;color:#b3adc4">${input.milestone.description}</p>
      ${button("Celebrar meu acesso", url)}
    `),
    text: `Marco desbloqueado: ${input.milestone.title}\n\n${input.milestone.description}\n\nVer na Aurora: ${url}`,
  });
}

export async function sendLifecycleEmail(input: LifecycleEmailInput) {
  const status = statusUrl(input.row.statusToken, input.baseUrl);
  const confirm = confirmUrl(input.row.confirmToken, input.baseUrl);
  const share = referralUrl(input.row.referralCode, input.baseUrl);
  const manifesto = `${input.baseUrl}/manifesto`;
  const metodo = `${input.baseUrl}/metodo`;
  const seguranca = `${input.baseUrl}/seguranca`;

  const variants: Record<LifecycleEmailKind, { subject: string; html: string; text: string }> = {
    unconfirmed_1h: {
      subject: "Falta só confirmar seu acesso antecipado",
      html: shell(`
        <p style="font-size:16px;line-height:1.6;color:#d8d3e6">${greeting(input.row.name)}seu cadastro chegou, mas seu email ainda não foi confirmado.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">A confirmação registra seu acesso antecipado e garante que você receba os próximos passos da abertura da Aurora.</p>
        ${button("Confirmar meu acesso antecipado", confirm)}
        ${inboxInstruction()}
      `),
      text: `${greeting(input.row.name)}falta confirmar seu acesso antecipado à Aurora: ${confirm}\n\nAs próximas liberações chegam por email. Mantenha a Aurora na sua caixa principal.`,
    },
    unconfirmed_24h: {
      subject: "Seu acesso antecipado ainda precisa de confirmação",
      html: shell(`
        <p style="font-size:16px;line-height:1.6;color:#d8d3e6">${greeting(input.row.name)}se você ainda quiser receber acesso antecipado, este é o passo que falta.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">As próximas liberações chegam por email. Sem a confirmação, a Aurora não consegue avisar quando novas entradas forem abertas.</p>
        ${button("Confirmar meu acesso antecipado", confirm)}
        <p style="font-size:14px;line-height:1.6;color:#948fa8">Enquanto isso, você pode ler ${quietLink("o manifesto", manifesto)} ou entender ${quietLink("o método", metodo)}.</p>
      `),
      text: `${greeting(input.row.name)}se ainda quiser receber acesso antecipado, confirme aqui: ${confirm}\n\nAs próximas liberações chegam por email. Mantenha a Aurora na sua caixa principal.\n\nManifesto: ${manifesto}\nMétodo: ${metodo}`,
    },
    invited_unconfirmed_1h: {
      subject: "Alguém abriu uma porta para você na Aurora",
      html: shell(`
        <p style="font-size:16px;line-height:1.6;color:#d8d3e6">${greeting(input.row.name)}você entrou por um convite. Falta confirmar o email para registrar seu acesso antecipado.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">Depois disso, você recebe os próximos passos da Aurora e também pode chamar pessoas queridas.</p>
        ${button("Confirmar meu acesso antecipado", confirm)}
        ${inboxInstruction()}
      `),
      text: `${greeting(input.row.name)}você entrou por um convite da Aurora. Confirme seu acesso antecipado: ${confirm}`,
    },
    confirmed_no_invite_24h: {
      subject: "Seu acesso antecipado à Aurora está registrado",
      html: shell(`
        <p style="font-size:16px;line-height:1.6;color:#d8d3e6">${greeting(input.row.name)}seu acesso antecipado está registrado. Agora você pode abrir essa porta para uma ou duas pessoas queridas.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">A Aurora cresce melhor quando chega como um gesto de cuidado, de alguém que pensou: isso pode fazer bem para você.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">Convide quem talvez precise de um lugar simples para falar, respirar e se escutar com mais clareza. Faz bem para a pessoa, fortalece uma rede mais íntima ao redor dela e ajuda a Aurora a nascer pelas mãos certas.</p>
        ${button("Ver meu acesso antecipado", status)}
        <p style="font-size:14px;line-height:1.6;color:#948fa8">Sugestão: “pensei em você quando vi isso. Acho que a Aurora pode fazer sentido para os seus dias.”</p>
        <p style="font-size:14px;line-height:1.6;color:#948fa8">Seu link direto: ${share}</p>
      `),
      text: `${greeting(input.row.name)}seu acesso antecipado está registrado.\n\nAgora você pode abrir essa porta para uma ou duas pessoas queridas. A Aurora cresce melhor quando chega como um gesto de cuidado, de alguém que pensou: isso pode fazer bem para você.\n\nConvide quem talvez precise de um lugar simples para falar, respirar e se escutar com mais clareza. Faz bem para a pessoa, fortalece uma rede mais íntima ao redor dela e ajuda a Aurora a nascer pelas mãos certas.\n\nVer seu acesso antecipado: ${status}\n\nSugestão: pensei em você quando vi isso. Acho que a Aurora pode fazer sentido para os seus dias.\n\nSeu link direto: ${share}`,
    },
    share_no_confirmed_invite_24h: {
      subject: "Seu convite só conta quando a pessoa confirma",
      html: shell(`
        <p style="font-size:16px;line-height:1.6;color:#d8d3e6">${greeting(input.row.name)}vi que você já mexeu no convite. Um detalhe importante: ele só vira indicação quando a pessoa confirma o email.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">Vale mandar para uma ou duas pessoas com uma frase simples, pessoal, sem cara de divulgação. O convite funciona melhor quando parece cuidado, não campanha.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">Pense em alguém para quem a Aurora possa ser uma pausa boa nos dias: uma forma de falar com mais liberdade, organizar o que sente e chegar com mais clareza no que importa.</p>
        ${button("Ver meu acesso antecipado", status)}
        <p style="font-size:14px;line-height:1.6;color:#948fa8">Sugestão: “pensei em você quando vi isso. Acho que a Aurora pode fazer sentido para os seus dias.”</p>
      `),
      text: `${greeting(input.row.name)}seu convite só conta quando a pessoa confirma o email.\n\nVale mandar para uma ou duas pessoas com uma frase simples, pessoal, sem cara de divulgação. O convite funciona melhor quando parece cuidado, não campanha.\n\nPense em alguém para quem a Aurora possa ser uma pausa boa nos dias: uma forma de falar com mais liberdade, organizar o que sente e chegar com mais clareza no que importa.\n\nVeja seu acesso antecipado: ${status}\n\nSugestão: pensei em você quando vi isso. Acho que a Aurora pode fazer sentido para os seus dias.`,
    },
    confirmed_no_ritual_24h: {
      subject: "Prepare sua Aurora em poucos minutos",
      html: shell(`
        <p style="font-size:16px;line-height:1.6;color:#d8d3e6">${greeting(input.row.name)}antes da primeira experiência, você pode deixar a Aurora um pouco mais sua.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">Na sua sala, o Ritual de Chegada ajuda a Aurora a entender seu momento, seu ritmo e o tipo de presença que você espera.</p>
        ${button("Preparar minha Aurora", status)}
        <p style="font-size:14px;line-height:1.6;color:#948fa8">Se preferir entender melhor antes: ${quietLink("segurança e privacidade", seguranca)}.</p>
      `),
      text: `${greeting(input.row.name)}prepare sua Aurora pelo seu link pessoal: ${status}\n\nAs próximas liberações chegam por email. Mantenha a Aurora na sua caixa principal.\n\nSegurança e privacidade: ${seguranca}`,
    },
  };

  const variant = variants[input.kind];
  return sendEmail({
    to: input.row.email,
    subject: variant.subject,
    html: variant.html,
    text: variant.text,
  });
}

export async function sendAlphaTesterRitualEmail(
  row: WaitlistEmailRow & { name?: string | null },
  baseUrl: string,
  scheduledAt?: string,
) {
  const status = statusUrl(row.statusToken, baseUrl);
  const ritual = `${baseUrl.replace(/\/+$/, "")}/chegada?token=${encodeURIComponent(row.statusToken)}`;
  return sendEmail({
    to: row.email,
    subject: "Ainda dá tempo de preparar sua Aurora",
    html: shell(`
      <p style="font-size:16px;line-height:1.6;color:#d8d3e6">Oi, aqui é o Leo, criador da Aurora.</p>
      <p style="font-size:16px;line-height:1.6;color:#d8d3e6">Estou organizando a próxima leva do Alpha da Aurora hoje.</p>
      <p style="font-size:15px;line-height:1.6;color:#b8b1ca">Ainda dá tempo de entrar na seleção. O próximo passo é completar o Ritual de Chegada: algumas perguntas rápidas para a Aurora entender seu momento, seu ritmo e o tipo de presença que você espera encontrar ali.</p>
      <p style="font-size:15px;line-height:1.6;color:#b8b1ca">Não precisa escrever muito. A ideia é só preparar a Aurora para te receber com mais cuidado antes do diário abrir.</p>
      <p style="font-size:15px;line-height:1.6;color:#d8d3e6">Se a Aurora ainda faz sentido para este momento da sua vida, complete o Ritual hoje.</p>
      ${button("Completar meu Ritual", ritual)}
      <p style="font-size:13px;line-height:1.6;color:#948fa8">Se o botão não abrir, acesse sua sala Aurora por este link: ${quietLink(status, status)}. Lá, clique em “Preparar minha Aurora”.</p>
      ${leoSignatureHtml()}
    `),
    text: `Oi, aqui é o Leo, criador da Aurora.

Estou organizando a próxima leva do Alpha da Aurora hoje.

Ainda dá tempo de entrar na seleção. O próximo passo é completar o Ritual de Chegada: algumas perguntas rápidas para a Aurora entender seu momento, seu ritmo e o tipo de presença que você espera encontrar ali.

Não precisa escrever muito. A ideia é só preparar a Aurora para te receber com mais cuidado antes do diário abrir.

Se a Aurora ainda faz sentido para este momento da sua vida, complete o Ritual hoje.

Completar meu Ritual: ${ritual}

Se o botão não abrir, acesse sua sala Aurora por este link:
${status}

Lá, clique em "Preparar minha Aurora".

${leoSignatureText()}`,
    scheduledAt,
  });
}

export async function sendAlphaTesterCompleteEmail(
  row: WaitlistEmailRow & { name?: string | null },
  baseUrl: string,
  scheduledAt?: string,
) {
  const status = statusUrl(row.statusToken, baseUrl);
  return sendEmail({
    to: row.email,
    subject: "Ainda dá tempo de entrar no Alpha",
    html: shell(`
      <p style="font-size:16px;line-height:1.6;color:#d8d3e6">Oi, aqui é o Leo, criador da Aurora.</p>
      <p style="font-size:15px;line-height:1.6;color:#d8d3e6">Você já completou o Ritual de Chegada. Esse era o passo mais importante para a Aurora entender melhor como te receber.</p>
      <p style="font-size:15px;line-height:1.6;color:#b8b1ca">Estou organizando a próxima leva do Alpha hoje, e ainda dá tempo de entrar nesse grupo.</p>
      <p style="font-size:15px;line-height:1.6;color:#b8b1ca">Você não precisa repetir o Ritual. Só mantenha este email por perto: os próximos passos chegam por aqui.</p>
      <p style="font-size:15px;line-height:1.6;color:#d8d3e6">Se quiser fortalecer sua entrada, ainda pode convidar uma pessoa para conhecer a Aurora pela sua sala.</p>
      ${button("Abrir minha sala Aurora", status)}
      ${leoSignatureHtml()}
    `),
    text: `Oi, aqui é o Leo, criador da Aurora.

Você já completou o Ritual de Chegada. Esse era o passo mais importante para a Aurora entender melhor como te receber.

Estou organizando a próxima leva do Alpha hoje, e ainda dá tempo de entrar nesse grupo.

Você não precisa repetir o Ritual. Só mantenha este email por perto: os próximos passos chegam por aqui.

Se quiser fortalecer sua entrada, ainda pode convidar uma pessoa para conhecer a Aurora pela sua sala.

Abrir minha sala Aurora: ${status}

${leoSignatureText()}`,
    scheduledAt,
  });
}
