import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { captureAuroraServer } from "@/lib/analytics/server";
import { getOnboardingContext, needsOnboarding, type OnboardingProfile } from "@/lib/onboarding/context";
import { hasAuroraAccess } from "@/lib/waitlist/open-spots-campaign";
import { completeOnboarding } from "./actions";
import styles from "./BoasVindas.module.css";

export const dynamic = "force-dynamic";

const PRESENCE_OPTIONS = ["Mais calma", "Mais direta", "Mais prática", "Mais acolhedora"];

type Field = keyof OnboardingProfile;

function fieldLabel(field: Field) {
  const labels: Record<Field, string> = {
    name: "Nome",
    moment: "Primeiro tema",
    rhythm: "Ritmo",
    presence: "Presença",
    value: "Valor",
  };
  return labels[field];
}

function fieldText(field: Field, value: string | null) {
  if (!value) return null;
  return (
    <span key={field}>
      <small>{fieldLabel(field)}</small>
      {value}
    </span>
  );
}

function fieldsFor(context: Awaited<ReturnType<typeof getOnboardingContext>>): Field[] {
  if (context.completion === "empty") return ["name", "presence"];
  return context.nextField ? [context.nextField] : [];
}

function questionFor(field: Field) {
  const questions: Record<Field, { title: string; help: string; placeholder?: string }> = {
    name: {
      title: "Como posso te chamar?",
      help: "Um nome simples já deixa a primeira conversa mais próxima.",
      placeholder: "seu nome",
    },
    presence: {
      title: "Que tipo de presença combina com você hoje?",
      help: "Isso ajuda a Aurora a ajustar o tom sem virar um chat genérico.",
    },
    moment: {
      title: "O que você quer trazer primeiro?",
      help: "Pode ser uma fase, uma pergunta, uma mudança ou um desabafo.",
      placeholder: "ex: entender melhor uma mudança",
    },
    rhythm: {
      title: "Quando você imagina usar a Aurora?",
      help: "Se preferir, dá para ajustar isso depois.",
      placeholder: "ex: antes de dormir",
    },
    value: {
      title: "O que faria a Aurora valer a pena?",
      help: "Uma frase basta.",
      placeholder: "ex: perceber padrões antes que virem ansiedade",
    },
  };
  return questions[field];
}

export default async function BoasVindasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/login");
  }
  if (!(await hasAuroraAccess(user.email))) {
    await supabase.auth.signOut();
    redirect("/login?message=limited-access");
  }

  const context = await getOnboardingContext(user.id, user.email);
  if (!needsOnboarding(context)) {
    redirect("/diario");
  }

  await captureAuroraServer("product_onboarding_viewed", `user_${user.id}`, {
    source: "product_onboarding",
    completion: context.completion,
    completed_fields: context.completedFields,
  });

  const firstName = context.profile.name?.split(" ")[0] ?? "";
  const fields = fieldsFor(context);
  const summary = (["name", "moment", "presence", "value"] as Field[])
    .map((field) => fieldText(field, context.profile[field]))
    .filter(Boolean);
  const title =
    context.completion === "complete"
      ? `${firstName || "Você"} já deixou alguns sinais.`
      : context.completion === "partial"
        ? `${firstName || "Você"}, já tenho alguns sinais.`
        : "Vamos preparar sua primeira conversa.";
  const body =
    context.completion === "complete"
      ? "Trouxe o que você contou no Ritual de Chegada para começar com mais cuidado."
      : "Responda só o mínimo para a primeira fala ficar mais próxima de você. Também dá para pular e começar direto.";

  return (
    <main className={styles.stage}>
      <section className={styles.shell}>
        <a className={styles.brand} href="/">
          <span aria-hidden="true" />
          Aurora
        </a>

        <div className={styles.copy}>
          <p className={styles.kicker}>Boas-vindas</p>
          <h1 className="font-serif">{title}</h1>
          <p>{body}</p>
        </div>

        {summary.length > 0 && (
          <div className={styles.signals} aria-label="Sinais do Ritual de Chegada">
            {summary}
          </div>
        )}

        <form action={completeOnboarding} className={styles.form}>
          {fields.map((field) => {
            const question = questionFor(field);
            return (
              <label key={field} className={styles.field}>
                <span>{question.title}</span>
                <small>{question.help}</small>
                {field === "presence" ? (
                  <select name={field} defaultValue={context.profile[field] ?? ""} required>
                    <option value="" disabled>
                      Escolha uma presença
                    </option>
                    {PRESENCE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={field}
                    defaultValue={context.profile[field] ?? ""}
                    placeholder={question.placeholder}
                    maxLength={field === "value" ? 160 : field === "moment" ? 140 : 40}
                    required
                  />
                )}
              </label>
            );
          })}

          <button type="submit" name="intent" value="complete" className={styles.primary}>
            Começar meu primeiro registro
          </button>
          <button type="submit" name="intent" value="skip" className={styles.secondary} formNoValidate>
            Pular e começar a falar
          </button>
        </form>
      </section>
    </main>
  );
}
