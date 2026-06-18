import { Resend } from "resend";
import { confirmUrl, referralUrl, statusUrl } from "@/lib/referral/urls";
import type { ReferralMilestone } from "@/lib/referral/milestones";

type WaitlistEmailRow = {
  email: string;
  referralCode: string;
  statusToken: string;
  confirmToken: string;
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

export async function sendConfirmEmail(row: WaitlistEmailRow, baseUrl: string) {
  const url = confirmUrl(row.confirmToken, baseUrl);
  const share = referralUrl(row.referralCode, baseUrl);

  return sendEmail({
    to: row.email,
    subject: "Confirme seu acesso à Aurora",
    html: shell(`
      <p style="font-size:16px;line-height:1.6;color:#d8d3e6">Você está quase na lista. Confirme seu email para ativar seu acesso e seu convite pessoal.</p>
      ${button("Confirmar meu acesso", url)}
      <p style="font-size:14px;line-height:1.6;color:#948fa8">Depois de confirmar, você pode acompanhar seus marcos por este convite:</p>
      <p style="font-size:14px;line-height:1.6;color:#c9c4d8">${share}</p>
    `),
    text: `Confirme seu acesso à Aurora: ${url}\n\nSeu convite: ${share}`,
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
