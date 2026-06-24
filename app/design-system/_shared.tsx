import type { ReactNode } from "react";
import styles from "./DesignSystem.module.css";

export type DesignSystemSearchParams = Promise<{ token?: string }>;

type NavItem = {
  href: string;
  label: string;
};

export const designSystemNav: NavItem[] = [
  { href: "/design-system", label: "Hub" },
  { href: "/design-system/posicionamento", label: "Posicionamento" },
  { href: "/design-system/fundamentos", label: "Fundamentos" },
  { href: "/design-system/biblioteca", label: "Biblioteca de Componentes" },
  { href: "/design-system/patterns", label: "Patterns de Tela" },
  { href: "/design-system/referencia#orb", label: "Orb" },
  { href: "/design-system/referencia#padroes", label: "Padrões" },
  { href: "/design-system/referencia#exemplos", label: "Exemplos" },
  { href: "/design-system/roadmap", label: "Roadmap" },
  { href: "/design-system/referencia#qa", label: "QA" },
];

export async function getDesignSystemAccess(searchParams: DesignSystemSearchParams) {
  const { token } = await searchParams;
  const configuredToken = process.env.DESIGN_SYSTEM_ADMIN_TOKEN?.trim();

  return {
    token,
    configured: Boolean(configuredToken),
    allowed: Boolean(configuredToken && token === configuredToken),
  };
}

export function withToken(href: string, token?: string) {
  const [path, hash] = href.split("#");
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${path}${query}${hash ? `#${hash}` : ""}`;
}

export function PrivateScreen({ configured }: { configured: boolean }) {
  return (
    <main className={styles.private}>
      <div className={styles.privateStars} aria-hidden="true" />
      <div className={styles.privateAurora} aria-hidden="true" />
      <div className={styles.privateHorizon} aria-hidden="true" />

      <section className={styles.privateShell}>
        <div className={styles.privateBrand}>
          <img src="/brand/aurora-logo-horizontal.svg" alt="Aurora" />
        </div>

        <div className={styles.privateStory}>
          <p className={styles.privateKicker}>Design System Aurora</p>
          <h1>Entre no universo visual da Aurora.</h1>
          <p>
            Consulte tokens, componentes, padrões e guardrails para criar novas telas sem sair da identidade da marca.
          </p>
        </div>

        <div className={styles.privateCard}>
          <span className={styles.accessSignal} aria-hidden="true" />
          <p className={styles.privateCardLabel}>Acesso reservado</p>
          <h2>Guardrail visual</h2>
          <p>
            {configured
              ? "Use o token do Design System para abrir a biblioteca viva da Aurora."
              : "Configure DESIGN_SYSTEM_ADMIN_TOKEN para liberar esta rota."}
          </p>
          {configured ? (
            <form className={styles.form} action="/design-system">
              <label className={styles.privateField}>
                <span>Token</span>
                <input className={styles.input} name="token" type="password" placeholder="design-system-token" autoComplete="off" />
              </label>
              <button className={styles.primaryButton} type="submit">
                Entrar no Design System
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export function Header({ token }: { token?: string }) {
  return (
    <header className={styles.header}>
      <a className={styles.brand} href={withToken("/design-system", token)} aria-label="Aurora Design System">
        <img src="/brand/aurora-logo-horizontal.svg" alt="" />
      </a>
      <nav className={styles.nav} aria-label="Design system">
        {designSystemNav.map((item) => (
          <a key={item.href} href={withToken(item.href, token)}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export function SectionHeader({ kicker, title, copy }: { kicker: string; title: string; copy: string }) {
  return (
    <div className={styles.sectionHeader}>
      <div>
        <p className={styles.kicker}>{kicker}</p>
        <h2>{title}</h2>
      </div>
      <p>{copy}</p>
    </div>
  );
}

export function DesignSystemShell({ token, children }: { token?: string; children: ReactNode }) {
  return (
    <main className={styles.page} id="top">
      <div className={styles.shell}>
        <Header token={token} />
        {children}
      </div>
    </main>
  );
}
