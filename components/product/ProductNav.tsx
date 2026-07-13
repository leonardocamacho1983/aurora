import type { ReactNode } from "react";
import { PRODUCT_NAV_ITEMS, type ProductNavKey } from "./navigation";
import { ProductNavLink } from "./ProductNavLink";
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
      <ProductNavLink className={styles.brand} href="/diario" aria-label="Aurora, ir para o Diário">
        <span className={styles.brandOrb} aria-hidden="true" />
        <span>Aurora</span>
      </ProductNavLink>

      <nav className={styles.links} aria-label="Navegação principal">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <ProductNavLink
            href={item.href}
            aria-current={item.key === active ? "page" : undefined}
            key={item.key}
          >
            {item.label}
          </ProductNavLink>
        ))}
      </nav>

      <div className={styles.actions}>
        {contextLabel ? <span className={styles.context}>{contextLabel}</span> : null}
        {shouldShowNewEntry ? (
          <ProductNavLink className={styles.newEntry} href="/diario">
            Nova entrada
          </ProductNavLink>
        ) : null}
        {PROFILE_NAV_ITEM ? (
          <ProductNavLink
            className={styles.profile}
            href={PROFILE_NAV_ITEM.href}
            aria-current={PROFILE_NAV_ITEM.key === active ? "page" : undefined}
          >
            {PROFILE_NAV_ITEM.label}
          </ProductNavLink>
        ) : null}
      </div>
    </header>
  );
}
