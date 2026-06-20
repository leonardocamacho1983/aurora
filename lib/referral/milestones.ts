export type ReferralMilestone = {
  count: number;
  title: string;
  shortTitle: string;
  description: string;
};

export const MILESTONES: ReferralMilestone[] = [
  {
    count: 5,
    title: "Acesso antecipado liberado",
    shortTitle: "Acesso antecipado",
    description: "Você entra antes da abertura geral e ajuda a Aurora amanhecer com pessoas de confiança.",
  },
  {
    count: 10,
    title: "Três meses grátis da versão paga",
    shortTitle: "3 meses grátis",
    description: "Quando os planos oficiais chegarem, você começa com três meses por nossa conta.",
  },
  {
    count: 15,
    title: "Seis meses grátis da versão paga",
    shortTitle: "6 meses grátis",
    description: "Mais tempo para viver a Aurora completa quando os planos pagos forem lançados.",
  },
  {
    count: 20,
    title: "Um ano grátis da versão paga",
    shortTitle: "1 ano grátis",
    description: "Um agradecimento maior por trazer tanta gente querida para perto da Aurora.",
  },
];

export function currentMilestone(count: number): ReferralMilestone | null {
  return [...MILESTONES].reverse().find((m) => count >= m.count) ?? null;
}

export function nextMilestone(count: number): ReferralMilestone | null {
  return MILESTONES.find((m) => count < m.count) ?? null;
}

export function progressFor(count: number) {
  const current = currentMilestone(count);
  const next = nextMilestone(count);
  const previousCount = current?.count ?? 0;
  const nextCount = next?.count ?? previousCount;
  const span = Math.max(1, nextCount - previousCount);
  const within = Math.max(0, count - previousCount);

  return {
    count,
    current,
    next,
    previousCount,
    nextCount,
    ratio: next ? Math.min(1, within / span) : 1,
    remaining: next ? Math.max(0, next.count - count) : 0,
  };
}

export function milestoneReached(previous: number, next: number): ReferralMilestone | null {
  return MILESTONES.find((m) => previous < m.count && next >= m.count) ?? null;
}
