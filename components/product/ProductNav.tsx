import Link from "next/link";
import styles from "./ProductNav.module.css";

type ProductSection = "diario" | "timeline" | "account";

const primaryItems: Array<{ key: ProductSection; href: string; label: string }> = [
  { key: "diario", href: "/diario", label: "Diário" },
  { key: "timeline", href: "/timeline", label: "Timeline" },
];

const mobileItems: Array<{ key: ProductSection; href: string; label: string; icon: string }> = [
  { key: "diario", href: "/diario", label: "Diário", icon: "○" },
  { key: "timeline", href: "/timeline", label: "Timeline", icon: "◔" },
  { key: "account", href: "/account", label: "Perfil", icon: "♙" },
];

export function ProductNav({
  active,
  context,
}: {
  active: ProductSection;
  context?: string;
}) {
  return (
    <>
      <header className={styles.topbar}>
        <Link href="/diario" className={styles.brand} aria-label="Ir para o diário">
          <span className={styles.brandOrb} aria-hidden="true" />
          <span>Aurora</span>
        </Link>

        <nav className={styles.segmented} aria-label="Navegação principal do produto">
          {primaryItems.map((item) => (
            <Link
              href={item.href}
              key={item.key}
              aria-current={active === item.key ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.context}>
          {context ? <span>{context}</span> : <Link href="/account">Perfil</Link>}
        </div>
      </header>

      <nav className={styles.bottomNav} aria-label="Navegação principal">
        {mobileItems.map((item) => (
          <Link
            href={item.href}
            key={item.key}
            aria-current={active === item.key ? "page" : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
