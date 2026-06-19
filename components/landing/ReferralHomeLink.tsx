"use client";

import Link from "next/link";
import styles from "./Landing.module.css";
import { trackAurora } from "@/lib/analytics/client";

type ReferralHomeLinkProps = {
  confirmed: boolean;
  confirmedCount: number;
  referralCode: string;
  statusToken: string;
};

const NAME_KEY = "aurora_guest_name";
const CONTEXT_KEY = "aurora_invite_context";

export function ReferralHomeLink({ confirmed, confirmedCount, referralCode, statusToken }: ReferralHomeLinkProps) {
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
          referralCode,
          statusToken,
          savedAt: Date.now(),
        }),
      );
    } catch {
      /* ignore */
    }
    trackAurora("referral_home_return_clicked", {
      source: "referral_room",
      confirmed,
      confirmed_count: confirmedCount,
      referral_code: referralCode,
    });
  }

  return (
    <Link href="/?sala=convite" onClick={prepareHome} className={styles.referralSecondary}>
      {confirmed ? "Depois, preparar minha Aurora" : "Voltar para a página da Aurora"}
    </Link>
  );
}
