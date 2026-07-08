import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/product/BottomNav";
import { ProductNav } from "@/components/product/ProductNav";
import { db } from "@/lib/db";
import { focusDefinitions } from "@/lib/mapa/focus";
import { MapaTrackedLink, MapaViewTracker } from "./MapaAnalytics";
import styles from "./Mapa.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function countLabel(count: number, resolvedCount: number) {
  if (count === 0 && resolvedCount > 0) return "encerrado por agora";
  if (count === 0) return "sem entradas";
  if (count === 1) return "1 entrada";
  return `${count} entradas`;
}

export default async function MapaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const focuses = focusDefinitions();
  const rows = await db.execute<{ focusKey: string; count: number; resolvedCount: number }>(sql`
    select
      focus_key as "focusKey",
      count(*) filter (where focus_resolved_at is null)::int as count,
      count(*) filter (where focus_resolved_at is not null)::int as "resolvedCount"
    from entries
    where user_id = ${user.id}::uuid
      and focus_key is not null
      and focus_confidence in ('high', 'medium')
      and focus_hidden_at is null
    group by focus_key
  `);
  const counts = new Map(rows.map((row) => [row.focusKey, Number(row.count)]));
  const resolvedCounts = new Map(rows.map((row) => [row.focusKey, Number(row.resolvedCount)]));
  const focusCount = focuses.filter((focus) => (counts.get(focus.key) ?? 0) > 0).length;
  const entryCount = [...counts.values()].reduce((total, count) => total + count, 0);

  return (
    <main className={styles.stage}>
      <MapaViewTracker
        eventName="product_mapa_viewed"
        properties={{
          source: "mapa",
          surface: "mapa_index",
          focus_count: focusCount,
          entry_count: entryCount,
          has_focus: entryCount > 0,
        }}
      />
      <ProductNav active="mapa" contextLabel="Fase atual" />
      <header className={`${styles.bar} ${styles.mobileBar}`}>
        <Link className={styles.brand} href="/diario">
          <i aria-hidden="true" />
          Aurora
        </Link>
        <span>Fase atual</span>
      </header>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Mapa</p>
          <h1>O que voltou a aparecer</h1>
          <p>
            Temas que apareceram com força nas suas entradas recentes. Quando um sinal não fizer sentido, você pode tirar do
            Mapa.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="focos-recentes">
          <h2 className={styles.sectionTitle} id="focos-recentes">
            Focos recentes
          </h2>
          <div className={styles.grid}>
            {focuses.map((focus) => {
              const count = counts.get(focus.key) ?? 0;
              const resolvedCount = resolvedCounts.get(focus.key) ?? 0;

              return (
                <MapaTrackedLink
                  className={styles.card}
                  eventName="product_mapa_focus_card_clicked"
                  eventProperties={{
                    source: "mapa",
                    surface: "mapa_index",
                    focus_key: focus.key,
                    entry_count: count,
                    has_focus: count > 0,
                  }}
                  href={`/mapa/${focus.key}`}
                  key={focus.key}
                >
                  <div className={styles.focusHead}>
                    <h3 className={styles.focusTitle}>{focus.label}</h3>
                    <span className={styles.meta}>{countLabel(count, resolvedCount)}</span>
                  </div>
                  <p>{focus.description}</p>
                  <span className={styles.chip}>
                    <i style={{ background: focus.color }} aria-hidden="true" />
                    ver foco
                  </span>
                </MapaTrackedLink>
              );
            })}
          </div>
        </section>
      </div>

      <BottomNav active="mapa" />
    </main>
  );
}
