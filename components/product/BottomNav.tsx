import { PRODUCT_NAV_ITEMS, type ProductNavKey } from "./navigation";
import { ProductNavLink } from "./ProductNavLink";
import styles from "./BottomNav.module.css";

export function BottomNav({ active }: { active: ProductNavKey }) {
  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      {PRODUCT_NAV_ITEMS.map((item) => (
        <ProductNavLink href={item.href} aria-current={item.key === active ? "page" : undefined} key={item.key}>
          {item.label}
        </ProductNavLink>
      ))}
    </nav>
  );
}
