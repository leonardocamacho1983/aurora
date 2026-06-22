"use client";

import { useEffect, useState } from "react";
import styles from "./Landing.module.css";
import { writeInviteContext } from "./invite-context";

type InviteNameCaptureProps = {
  confirmedCount: number;
  confirmed: boolean;
  referralCode: string;
  statusToken: string;
};

const NAME_KEY = "aurora_guest_name";

function cleanName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);
}

async function saveProfile(statusToken: string, name: string) {
  try {
    await fetch("/api/waitlist/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ statusToken, name, source: "invite_room" }),
    });
  } catch {
    /* local save is enough for the UI */
  }
}

export function InviteNameCapture({ confirmedCount, confirmed, referralCode, statusToken }: InviteNameCaptureProps) {
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");

  useEffect(() => {
    try {
      const stored = cleanName(localStorage.getItem(NAME_KEY) ?? "");
      setSavedName(stored);
      setName(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const signedByText = savedName
    ? `As mensagens que você compartilhar podem aparecer assinadas como ${savedName}.`
    : "Diga o nome que você prefere usar. A Aurora usa isso para te receber melhor e deixar seus convites mais humanos.";

  function save() {
    const nextName = cleanName(name);
    if (!nextName) return;
    try {
      localStorage.setItem(NAME_KEY, nextName);
      writeInviteContext({ name: nextName, confirmedCount, confirmed, referralCode, statusToken });
    } catch {
      /* ignore */
    }
    void saveProfile(statusToken, nextName);
    setSavedName(nextName);
  }

  return (
    <div className={styles.inviteNameCard}>
      <div>
        <span>Para ficar mais pessoal</span>
        <strong>{savedName ? "Sua indicação agora tem mais presença." : "Quer assinar seus convites com seu nome?"}</strong>
        <p>{signedByText}</p>
      </div>
      <div className={styles.inviteNameForm}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              save();
            }
          }}
          type="text"
          name="name"
          autoComplete="given-name"
          placeholder="seu nome"
          aria-label="Seu nome"
        />
        <button type="button" onClick={save}>
          {savedName ? "Atualizar" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
