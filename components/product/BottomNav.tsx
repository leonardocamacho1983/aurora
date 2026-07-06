import Link from "next/link";
import styles from "./BottomNav.module.css";

type NavItem = {
  key: "diario" | "timeline" | "mapa" | "perfil";
  label: string;
  href: string;
};

const ITEMS: NavItem[] = [
  { key: "diario", label: "Diário", href: "/diario" },
  { key: "timeline", label: "Timeline", href: "/timeline" },
  { key: "mapa", label: "Mapa", href: "/mapa" },
  { key: "perfil", label: "Perfil", href: "/account" },
];

export function BottomNav({ active }: { active: NavItem["key"] }) {
  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      {ITEMS.map((item) => (
        <Link href={item.href} aria-current={item.key === active ? "page" : undefined} key={item.key}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
