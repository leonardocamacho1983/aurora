import { BottomNav } from "./BottomNav";
import { ProductNav } from "./ProductNav";
import type { ProductNavKey } from "./navigation";
import styles from "./ProductRouteLoading.module.css";

type ProductRouteLoadingProps = {
  active: ProductNavKey;
  title: string;
  contextLabel?: string;
};

const SKELETON_CARDS = ["feature", "side", "wide"];

export function ProductRouteLoading({ active, title, contextLabel = "Abrindo" }: ProductRouteLoadingProps) {
  return (
    <main className={styles.stage} aria-busy="true" aria-live="polite">
      <ProductNav active={active} contextLabel={contextLabel} />

      <section className={styles.shell} aria-label={title}>
        <div className={styles.head}>
          <p className={styles.kicker}>Abrindo</p>
          <h1>{title}</h1>
          <span className={styles.line} />
        </div>

        <div className={styles.grid} aria-hidden="true">
          {SKELETON_CARDS.map((card) => (
            <div className={`${styles.card} ${styles[card]}`} key={card}>
              <span className={styles.shortLine} />
              <span className={styles.longLine} />
              <span className={styles.midLine} />
            </div>
          ))}
        </div>
      </section>

      <BottomNav active={active} />
    </main>
  );
}
