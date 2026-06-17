"use client";

import Link from "next/link";
import styles from "./Landing.module.css";

type ReferralHomeLinkProps = {
  confirmed: boolean;
  confirmedCount: number;
};

const NAME_KEY = "aurora_guest_name";
const CONTEXT_KEY = "aurora_invite_context";

export function ReferralHomeLink({ confirmed, confirmedCount }: ReferralHomeLinkProps) {
  function prepareHome() {
    try {
      const name = localStorage.getItem(NAME_KEY)?.trim() ?? "";
      sessionStorage.setItem("aurora_hero_seen", "1");
      localStorage.setItem(
        CONTEXT_KEY,
        JSON.stringify({
          name,
          confirmed,
          confirmedCount,
          savedAt: Date.now(),
        }),
      );
    } catch {
      /* ignore */
    }
  }

  return (
    <Link href="/?sala=convite" onClick={prepareHome} className={styles.referralSecondary}>
      Voltar para a página da Aurora
    </Link>
  );
}
