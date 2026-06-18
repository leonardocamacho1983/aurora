import Link from "next/link";
import type { ReactNode } from "react";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import styles from "./Launch.module.css";

type LaunchPageProps = {
  page: string;
  eyebrow: string;
  title: ReactNode;
  lead: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  children: ReactNode;
};

type SectionProps = {
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  center?: boolean;
  alt?: boolean;
  children?: ReactNode;
};

export function LaunchPage({
  page,
  eyebrow,
  title,
  lead,
  primary = { href: "/#lista", label: "Entrar na lista" },
  secondary,
  children,
}: LaunchPageProps) {
  return (
    <div className={styles.page}>
      <TrackPageView page={page} />
      <LaunchHeader page={page} />
      <main>
        <section className={styles.hero}>
          <div className={styles.stars} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.orb} aria-hidden="true" />
            <p className={styles.kicker}>{eyebrow}</p>
            <h1 className={styles.heroTitle}>{title}</h1>
            <p className={styles.heroLead}>{lead}</p>
            <div className={styles.heroActions}>
              <TrackedLink
                href={primary.href}
                className={styles.primary}
                eventProperties={{ page, source: "launch_hero", label: primary.label }}
              >
                {primary.label}
              </TrackedLink>
              {secondary ? (
                <TrackedLink
                  href={secondary.href}
                  className={styles.secondary}
                  eventProperties={{ page, source: "launch_hero", label: secondary.label }}
                >
                  {secondary.label}
                </TrackedLink>
              ) : null}
            </div>
          </div>
        </section>
        {children}
      </main>
      <LaunchFooter />
    </div>
  );
}

export function LaunchHeader({ page }: { page: string }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandOrb} aria-hidden="true" />
          Aurora
        </Link>
        <nav className={styles.nav} aria-label="Navegação principal">
          <Link href="/manifesto">Manifesto</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/para-terapeutas">Profissionais</Link>
          <TrackedLink
            href="/#lista"
            className={styles.pill}
            eventProperties={{ page, source: "launch_header", label: "Entrar na lista" }}
          >
            Entrar na lista
          </TrackedLink>
        </nav>
      </div>
    </header>
  );
}

export function LaunchFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandOrb} aria-hidden="true" />
          Aurora
        </Link>
        <nav className={styles.footerLinks} aria-label="Rodapé">
          <Link href="/manifesto">Manifesto</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
          <Link href="/seguranca">Segurança</Link>
          <Link href="/faq">FAQ</Link>
        </nav>
        <span>© 2026 Aurora</span>
      </div>
    </footer>
  );
}

export function LaunchSection({ eyebrow, title, lead, center = false, alt = false, children }: SectionProps) {
  return (
    <section className={`${styles.section} ${alt ? styles.sectionAlt : ""}`}>
      <div className={styles.sectionInner}>
        <div className={`${styles.sectionIntro} ${center ? styles.center : ""}`}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h2 className={styles.sectionTitle}>{title}</h2>
          {lead ? <p className={styles.sectionLead}>{lead}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function Grid({ columns = 3, children }: { columns?: 2 | 3; children: ReactNode }) {
  return (
    <div className={`${styles.grid} ${columns === 2 ? styles.gridTwo : styles.gridThree}`}>
      {children}
    </div>
  );
}

export function Card({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <article className={styles.card}>
      <h3>{title}</h3>
      {children}
    </article>
  );
}

export function WideCard({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <article className={styles.wideCard}>
      <h3>{title}</h3>
      {children}
    </article>
  );
}

export function FineList({ items }: { items: Array<{ title: string; body: string }> }) {
  return (
    <div className={styles.fineList}>
      {items.map((item) => (
        <div className={styles.fineItem} key={item.title}>
          <strong>{item.title}</strong>
          <span>{item.body}</span>
        </div>
      ))}
    </div>
  );
}

export function Quote({ children }: { children: ReactNode }) {
  return <blockquote className={styles.quote}>{children}</blockquote>;
}

export function SmallOrb() {
  return <span className={styles.smallOrb} aria-hidden="true" />;
}
