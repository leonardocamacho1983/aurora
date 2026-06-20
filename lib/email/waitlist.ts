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

async function sendEmail(input: { to: string; subject: string; html: string; text: string }) {
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

function inboxInstruction(): string {
  return `
    <div style="margin:22px 0;padding:16px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:#151225">
      <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#d8d3e6"><strong>Para a Aurora não se perder:</strong></p>
      <div style="display:flex;gap:10px;align-items:center;margin:10px 0">
        <span style="display:inline-block;width:34px;height:34px;border-radius:10px;background:#211b35;text-align:center;line-height:34px;color:#f4d98b;font-size:20px">★</span>
        <span style="font-size:13px;line-height:1.5;color:#b8b1ca">No Gmail ou Outlook, marque este email com estrela ou adicione a Aurora aos favoritos. Se não aparecer, procure por Aurora, Promoções ou Spam.</span>
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
    subject: "Confirme seu acesso à Aurora",
    html: shell(`
      <p style="font-size:16px;line-height:1.6;color:#d8d3e6">Você está quase na lista. Confirme seu email para guardar seu lugar e ativar sua sala de convite.</p>
      ${button("Confirmar meu acesso", url)}
      ${inboxInstruction()}
      <p style="font-size:14px;line-height:1.6;color:#948fa8">Depois de confirmar, você pode acompanhar seus marcos por este convite:</p>
      <p style="font-size:14px;line-height:1.6;color:#c9c4d8">${share}</p>
    `),
    text: `Confirme seu acesso à Aurora: ${url}\n\nPara a Aurora não se perder, marque este email com estrela ou adicione aos favoritos. Se não aparecer, procure por Aurora, Promoções ou Spam.\n\nSeu convite: ${share}`,
  });
}

export async function sendStatusEmail(row: WaitlistEmailRow, baseUrl: string) {
  const url = statusUrl(row.statusToken, baseUrl);
  return sendEmail({
    to: row.email,
    subject: "Seu link da lista Aurora",
    html: shell(`
      <p style="font-size:16px;line-height:1.6;color:#d8d3e6">Este email já está na lista Aurora. Aqui está seu link pessoal para acompanhar convites e próximos passos.</p>
      ${button("Abrir minha sala de convite", url)}
    `),
    text: `Seu link pessoal da Aurora: ${url}`,
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
      ${button("Celebrar na minha sala", url)}
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
      subject: "Falta só confirmar seu lugar na Aurora",
      html: shell(`
        <p style="font-size:16px;line-height:1.6;color:#d8d3e6">${greeting(input.row.name)}seu cadastro chegou, mas seu email ainda não foi confirmado.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">A confirmação guarda seu lugar na lista e libera sua sala de convite.</p>
        ${button("Confirmar meu email", confirm)}
        ${inboxInstruction()}
      `),
      text: `${greeting(input.row.name)}falta confirmar seu lugar na Aurora: ${confirm}\n\nA confirmação guarda seu lugar na lista e libera sua sala de convite.`,
    },
    unconfirmed_24h: {
      subject: "Seu lugar na Aurora ainda está esperando confirmação",
      html: shell(`
        <p style="font-size:16px;line-height:1.6;color:#d8d3e6">${greeting(input.row.name)}se você ainda quiser entrar na lista, este é o gesto que falta.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">Sem confirmação, a Aurora não consegue ativar sua sala nem avisar quando seu acesso estiver pronto.</p>
        ${button("Confirmar agora", confirm)}
        <p style="font-size:14px;line-height:1.6;color:#948fa8">Enquanto isso, você pode ler ${quietLink("o manifesto", manifesto)} ou entender ${quietLink("o método", metodo)}.</p>
      `),
      text: `${greeting(input.row.name)}se ainda quiser entrar na lista, confirme aqui: ${confirm}\n\nManifesto: ${manifesto}\nMétodo: ${metodo}`,
    },
    invited_unconfirmed_1h: {
      subject: "Alguém abriu uma porta para você na Aurora",
      html: shell(`
        <p style="font-size:16px;line-height:1.6;color:#d8d3e6">${greeting(input.row.name)}você entrou por um convite. Falta confirmar o email para aceitar.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">Depois disso, sua própria sala abre e você também pode chamar pessoas queridas.</p>
        ${button("Aceitar convite", confirm)}
        ${inboxInstruction()}
      `),
      text: `${greeting(input.row.name)}você entrou por um convite da Aurora. Aceite confirmando seu email: ${confirm}`,
    },
    confirmed_no_invite_24h: {
      subject: "Sua sala de convite já está aberta",
      html: shell(`
        <p style="font-size:16px;line-height:1.6;color:#d8d3e6">${greeting(input.row.name)}seu lugar está confirmado. Agora vem o gesto principal: convidar pessoas queridas.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">A Aurora cresce melhor quando chega por uma indicação íntima, não por barulho.</p>
        ${button("Abrir minha sala", status)}
        <p style="font-size:14px;line-height:1.6;color:#948fa8">Seu link direto: ${share}</p>
      `),
      text: `${greeting(input.row.name)}sua sala de convite já está aberta: ${status}\n\nSeu link direto: ${share}`,
    },
    share_no_confirmed_invite_24h: {
      subject: "Seu convite só conta quando a pessoa confirma",
      html: shell(`
        <p style="font-size:16px;line-height:1.6;color:#d8d3e6">${greeting(input.row.name)}vi que você já mexeu no convite. Um detalhe importante: ele só vira indicação quando a pessoa confirma o email.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">Vale mandar para uma ou duas pessoas com uma frase simples, pessoal, sem cara de divulgação.</p>
        ${button("Ver meu convite", status)}
        <p style="font-size:14px;line-height:1.6;color:#948fa8">Sugestão: “pensei em você quando vi isso. Acho que a Aurora pode fazer sentido para os seus dias.”</p>
      `),
      text: `${greeting(input.row.name)}seu convite só conta quando a pessoa confirma o email.\n\nVeja sua sala: ${status}\n\nSugestão: pensei em você quando vi isso. Acho que a Aurora pode fazer sentido para os seus dias.`,
    },
    confirmed_no_ritual_24h: {
      subject: "Prepare sua Aurora em poucos minutos",
      html: shell(`
        <p style="font-size:16px;line-height:1.6;color:#d8d3e6">${greeting(input.row.name)}antes da primeira experiência, você pode deixar a Aurora um pouco mais sua.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">Na sua sala, o Ritual de Chegada ajuda a Aurora a entender seu momento, seu ritmo e o tipo de presença que você espera.</p>
        ${button("Abrir minha sala", status)}
        <p style="font-size:14px;line-height:1.6;color:#948fa8">Se preferir entender melhor antes: ${quietLink("segurança e privacidade", seguranca)}.</p>
      `),
      text: `${greeting(input.row.name)}prepare sua Aurora pela sua sala pessoal: ${status}\n\nSegurança e privacidade: ${seguranca}`,
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
