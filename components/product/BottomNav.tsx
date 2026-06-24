import Link from "next/link";
import type { CSSProperties } from "react";
import styles from "./StateComponents.module.css";

export type BottomNavItem = {
  key: string;
  href: string;
  label: string;
  icon: string;
};

type BottomNavProps = {
  items: BottomNavItem[];
  activeKey: string;
  label?: string;
};

export function BottomNav({ items, activeKey, label = "Navegação principal" }: BottomNavProps) {
  return (
    <nav
      aria-label={label}
      className={styles.bottomNav}
      style={{ "--bottom-nav-count": items.length } as CSSProperties}
    >
      {items.map((item) => (
        <Link href={item.href} key={item.key} aria-current={item.key === activeKey ? "page" : undefined}>
          <span aria-hidden="true">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
