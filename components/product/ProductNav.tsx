import type { ReactNode } from "react";
import Link from "next/link";
import { PRODUCT_NAV_ITEMS, type ProductNavKey } from "./navigation";
import styles from "./ProductNav.module.css";

type ProductNavProps = {
  active: ProductNavKey;
  contextLabel?: ReactNode;
  showNewEntry?: boolean;
};

const PRIMARY_NAV_ITEMS = PRODUCT_NAV_ITEMS.filter((item) => item.key !== "perfil");
const PROFILE_NAV_ITEM = PRODUCT_NAV_ITEMS.find((item) => item.key === "perfil");

export function ProductNav({ active, contextLabel, showNewEntry }: ProductNavProps) {
  const shouldShowNewEntry = showNewEntry ?? active !== "diario";

  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/diario" aria-label="Aurora, ir para o Diário">
        <span className={styles.brandOrb} aria-hidden="true" />
        <span>Aurora</span>
      </Link>

      <nav className={styles.links} aria-label="Navegação principal">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <Link
            href={item.href}
            aria-current={item.key === active ? "page" : undefined}
            key={item.key}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={styles.actions}>
        {contextLabel ? <span className={styles.context}>{contextLabel}</span> : null}
        {shouldShowNewEntry ? (
          <Link className={styles.newEntry} href="/diario">
            Nova entrada
          </Link>
        ) : null}
        {PROFILE_NAV_ITEM ? (
          <Link
            className={styles.profile}
            href={PROFILE_NAV_ITEM.href}
            aria-current={PROFILE_NAV_ITEM.key === active ? "page" : undefined}
          >
            {PROFILE_NAV_ITEM.label}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
