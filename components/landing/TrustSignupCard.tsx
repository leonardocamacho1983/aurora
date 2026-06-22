"use client";

import Link from "next/link";
import { WaitlistForm } from "./WaitlistForm";
import { useInviteContext } from "./useInviteContext";
import styles from "./TrustSignupCard.module.css";

type TrustSignupCardProps = {
  source?: string;
  fullBleed?: boolean;
};

export function TrustSignupCard({ source = "trust_signup_card", fullBleed = false }: TrustSignupCardProps) {
  const inviteContext = useInviteContext();
  const cardClassName = fullBleed ? `${styles.card} ${styles.fullBleed}` : styles.card;

  if (inviteContext?.statusToken) {
    return (
      <article className={cardClassName}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Você já chegou</p>
          <h3>Se lembrar de alguém querido, a Aurora recebe essa pessoa com cuidado.</h3>
          <p>
            Seu convite é só uma porta discreta. A pessoa decide se quer chegar, no tempo dela,
            e a Aurora cuida para que essa comunicação seja leve, respeitosa e sem pressão.
          </p>
          <div className={styles.chips} aria-label="Compromissos da Aurora">
            <span>Convite sem pressão</span>
            <span>Relação preservada</span>
            <span>Sem spam</span>
          </div>
        </div>

        <div className={styles.arrivalArea}>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/?sala=convite">
              Ver meu convite
            </Link>
            <Link className={styles.secondary} href="/privacidade/email#convites-com-cuidado">
              Conhecer nosso compromisso
            </Link>
          </div>
          <p className={styles.note}>
            A Aurora não manda mensagens por você e não expõe a relação entre vocês.
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className={cardClassName}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Acesso antecipado</p>
        <h3>Fale com a Aurora. Entre no primeiro grupo.</h3>
        <p>
          Ela transforma sua própria voz em clareza, padrões e próximos passos. Ainda não está
          aberta para todo mundo. Se você precisa dar forma ao que está solto, receba acesso
          antecipado agora.
        </p>
        <div className={styles.chips} aria-label="Como a Aurora usa seu email">
          <span>Diário por voz</span>
          <span>Primeiro grupo</span>
          <span>Sem spam</span>
        </div>
      </div>

      <div className={styles.formArea}>
        <WaitlistForm
          source={source}
          variant="wide"
          buttonLabel="Receber acesso antecipado"
          microcopy="Apenas email. Confirmação por mensagem. Sem spam."
        />
      </div>
    </article>
  );
}
