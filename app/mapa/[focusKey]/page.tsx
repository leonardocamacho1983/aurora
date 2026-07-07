import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/product/BottomNav";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { getFocusDefinition } from "@/lib/mapa/focus";
import { reopenEntryFocus, resolveEntryFocus } from "../actions";
import { HideFocusButton } from "../HideFocusButton";
import { MapaTrackedLink, MapaViewTracker } from "../MapaAnalytics";
import styles from "../Mapa.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function excerpt(value: string | null | undefined, max = 180) {
  const text = cleanText(value);
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function FocusPage({
  params,
  searchParams,
}: {
  params: Promise<{ focusKey: string }>;
  searchParams?: Promise<{ ajustado?: string; pontoResolvido?: string; pontoReaberto?: string }>;
}) {
  const { focusKey } = await params;
  const query = await searchParams;
  const focus = getFocusDefinition(focusKey);
  if (!focus) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [rows, resolvedRows, statsRows] = await Promise.all([
    db
      .select({
        id: entries.id,
        transcript: entries.transcript,
        reflection: entries.reflection,
        mood: entries.mood,
        focusConfidence: entries.focusConfidence,
        focusReason: entries.focusReason,
        createdAt: entries.createdAt,
      })
      .from(entries)
      .where(
        and(
          eq(entries.userId, user.id),
          eq(entries.focusKey, focus.key),
          isNull(entries.focusHiddenAt),
          isNull(entries.focusResolvedAt),
          or(eq(entries.focusConfidence, "high"), eq(entries.focusConfidence, "medium")),
        ),
      )
      .orderBy(desc(entries.createdAt))
      .limit(40),
    db
      .select({
        id: entries.id,
        transcript: entries.transcript,
        reflection: entries.reflection,
        mood: entries.mood,
        focusConfidence: entries.focusConfidence,
        focusReason: entries.focusReason,
        createdAt: entries.createdAt,
      })
      .from(entries)
      .where(
        and(
          eq(entries.userId, user.id),
          eq(entries.focusKey, focus.key),
          isNull(entries.focusHiddenAt),
          or(eq(entries.focusConfidence, "high"), eq(entries.focusConfidence, "medium")),
          isNotNull(entries.focusResolvedAt),
        ),
      )
      .orderBy(desc(entries.createdAt))
      .limit(20),
    db.execute<{ resolvedCount: number; latestResolvedAt: Date | string | null }>(sql`
      select
        count(*) filter (where focus_resolved_at is not null)::int as "resolvedCount",
        max(focus_resolved_at) as "latestResolvedAt"
      from entries
      where user_id = ${user.id}::uuid
        and focus_key = ${focus.key}
        and focus_confidence in ('high', 'medium')
        and focus_hidden_at is null
    `),
  ]);
  const resolvedCount = Number(statsRows[0]?.resolvedCount ?? 0);

  return (
    <main className={styles.stage}>
      <MapaViewTracker
        eventName="product_mapa_focus_viewed"
        properties={{
          source: "mapa",
          surface: "mapa_focus",
          focus_key: focus.key,
          entry_count: rows.length,
          has_focus: rows.length > 0,
        }}
      />
      <header className={styles.bar}>
        <Link className={styles.brand} href="/mapa">
          <i aria-hidden="true" />
          Mapa
        </Link>
        <span>Foco</span>
      </header>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Foco</p>
          <h1>{focus.label}</h1>
          <p>{focus.description}</p>
          <div className={styles.chips}>
            <span className={styles.chip}>
              <i style={{ background: focus.color }} aria-hidden="true" />
              aparece na Timeline e no Mapa
            </span>
            {resolvedCount ? (
              <span className={styles.chip}>
                {resolvedCount} {resolvedCount === 1 ? "ponto resolvido" : "pontos resolvidos"}
              </span>
            ) : null}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="entradas-do-foco">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle} id="entradas-do-foco">
              Pontos vivos neste foco
            </h2>
            {query?.ajustado === "1" ? <p>Pronto. Esse sinal saiu do Mapa.</p> : null}
            {query?.pontoResolvido === "1" ? <p>Pronto. Esse ponto ficou resolvido por agora.</p> : null}
            {query?.pontoReaberto === "1" ? <p>Pronto. Esse ponto voltou para os pontos vivos.</p> : null}
          </div>
          {rows.length ? (
            <div className={styles.entryList}>
              {rows.map((row) => (
                <article className={styles.entryCard} key={row.id}>
                  <div className={styles.entryMeta}>
                    <span>{dateLabel(row.createdAt)}</span>
                    <span>{row.focusConfidence === "high" ? "sinal claro" : "sinal possível"}</span>
                  </div>
                  <MapaTrackedLink
                    className={styles.entryLink}
                    eventName="product_mapa_entry_opened"
                    eventProperties={{
                      source: "mapa",
                      surface: "mapa_focus",
                      focus_key: focus.key,
                      focus_confidence: row.focusConfidence,
                    }}
                    href={`/fios/${row.id}`}
                  >
                    <p className={styles.entryExcerpt}>
                      {excerpt(row.transcript ?? row.reflection) || "Registro guardado."}
                    </p>
                  </MapaTrackedLink>
                  {row.focusReason ? <p className={styles.entryReason}>{row.focusReason}</p> : null}
                  <div className={styles.entryActions}>
                    <MapaTrackedLink
                      className={styles.button}
                      eventName="product_mapa_entry_opened"
                      eventProperties={{
                        source: "mapa",
                        surface: "mapa_focus_button",
                        focus_key: focus.key,
                        focus_confidence: row.focusConfidence,
                      }}
                      href={`/fios/${row.id}`}
                    >
                      Abrir fio
                    </MapaTrackedLink>
                    <form action={resolveEntryFocus.bind(null, { entryId: row.id, focusKey: focus.key })}>
                      <button className={styles.ghostButton} type="submit">
                        Resolver ponto
                      </button>
                    </form>
                    <HideFocusButton
                      className={styles.ghostButton}
                      entryId={row.id}
                      fallbackFocusKey={focus.key}
                      surface="mapa_focus"
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <article className={styles.card}>
              {resolvedCount ? (
                <p>Não há pontos vivos neste foco agora. Os pontos resolvidos seguem guardados abaixo.</p>
              ) : (
                <>
                  <p>Nenhuma entrada visível neste foco agora. Quando um novo sinal fizer sentido, ele aparece aqui.</p>
                  <Link className={styles.button} href="/timeline">
                    Voltar à Timeline
                  </Link>
                </>
              )}
            </article>
          )}
        </section>

        {resolvedRows.length ? (
          <section className={styles.section} aria-labelledby="pontos-resolvidos">
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle} id="pontos-resolvidos">
                Pontos resolvidos por agora
              </h2>
              <p>Esses pontos não aparecem como vivos, mas continuam no histórico e podem voltar se fizer sentido.</p>
            </div>
            <div className={styles.entryList}>
              {resolvedRows.map((row) => (
                <article className={styles.entryCard} key={row.id}>
                  <div className={styles.entryMeta}>
                    <span>{dateLabel(row.createdAt)}</span>
                    <span>resolvido por agora</span>
                  </div>
                  <MapaTrackedLink
                    className={styles.entryLink}
                    eventName="product_mapa_entry_opened"
                    eventProperties={{
                      source: "mapa",
                      surface: "mapa_focus_resolved",
                      focus_key: focus.key,
                      focus_confidence: row.focusConfidence,
                    }}
                    href={`/fios/${row.id}`}
                  >
                    <p className={styles.entryExcerpt}>
                      {excerpt(row.transcript ?? row.reflection) || "Registro guardado."}
                    </p>
                  </MapaTrackedLink>
                  {row.focusReason ? <p className={styles.entryReason}>{row.focusReason}</p> : null}
                  <div className={styles.entryActions}>
                    <MapaTrackedLink
                      className={styles.button}
                      eventName="product_mapa_entry_opened"
                      eventProperties={{
                        source: "mapa",
                        surface: "mapa_focus_resolved_button",
                        focus_key: focus.key,
                        focus_confidence: row.focusConfidence,
                      }}
                      href={`/fios/${row.id}`}
                    >
                      Abrir fio
                    </MapaTrackedLink>
                    <form action={reopenEntryFocus.bind(null, { entryId: row.id, focusKey: focus.key })}>
                      <button className={styles.ghostButton} type="submit">
                        Reabrir ponto
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <BottomNav active="mapa" />
    </main>
  );
}
