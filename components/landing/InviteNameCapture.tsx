"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Landing.module.css";

type InviteNameCaptureProps = {
  confirmedCount: number;
  confirmed: boolean;
};

const NAME_KEY = "aurora_guest_name";
const CONTEXT_KEY = "aurora_invite_context";

function cleanName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);
}

export function InviteNameCapture({ confirmedCount, confirmed }: InviteNameCaptureProps) {
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

  const statusText = useMemo(() => {
    if (!confirmed) return "Quando seu email for confirmado, seus convites começam a contar.";
    if (confirmedCount === 0) return "Seu acesso está confirmado. Você já pode guardar seu convite.";
    if (confirmedCount === 1) return "Seu acesso está confirmado e 1 pessoa já entrou pela sua indicação.";
    return `Seu acesso está confirmado e ${confirmedCount} pessoas já entraram pela sua indicação.`;
  }, [confirmed, confirmedCount]);

  function save() {
    const nextName = cleanName(name);
    if (!nextName) return;
    try {
      localStorage.setItem(NAME_KEY, nextName);
      localStorage.setItem(
        CONTEXT_KEY,
        JSON.stringify({
          name: nextName,
          confirmedCount,
          confirmed,
          savedAt: Date.now(),
        }),
      );
    } catch {
      /* ignore */
    }
    setSavedName(nextName);
  }

  return (
    <div className={styles.inviteNameCard}>
      <div>
        <span>Para ficar mais pessoal</span>
        <strong>{savedName ? `${savedName}, a Aurora já sabe como te chamar.` : "Como a Aurora pode te chamar?"}</strong>
        <p>{statusText}</p>
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
