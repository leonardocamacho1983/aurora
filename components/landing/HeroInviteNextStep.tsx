"use client";

import { useEffect, useState } from "react";
import styles from "./Landing.module.css";

type HeroInviteNextStepProps = {
  initialName?: string;
};

const NAME_KEY = "aurora_guest_name";
const MOMENT_KEY = "aurora_guest_moment";
const CONTEXT_KEY = "aurora_invite_context";

function clean(value: string, max = 140): string {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

export function HeroInviteNextStep({ initialName = "" }: HeroInviteNextStepProps) {
  const [name, setName] = useState(clean(initialName, 40));
  const [moment, setMoment] = useState("");
  const [saved, setSaved] = useState<"name" | "moment" | null>(null);

  useEffect(() => {
    try {
      const storedName = clean(localStorage.getItem(NAME_KEY) ?? initialName, 40);
      const storedMoment = clean(localStorage.getItem(MOMENT_KEY) ?? "", 140);
      setName(storedName);
      setMoment(storedMoment);
    } catch {
      /* ignore */
    }
  }, [initialName]);

  const asksName = !name;

  function saveName() {
    const nextName = clean(name, 40);
    if (!nextName) return;
    try {
      localStorage.setItem(NAME_KEY, nextName);
      const raw = localStorage.getItem(CONTEXT_KEY);
      const context = raw ? JSON.parse(raw) : {};
      localStorage.setItem(CONTEXT_KEY, JSON.stringify({ ...context, name: nextName, savedAt: Date.now() }));
    } catch {
      /* ignore */
    }
    setName(nextName);
    setSaved("name");
  }

  function saveMoment() {
    const nextMoment = clean(moment, 140);
    if (!nextMoment) return;
    try {
      localStorage.setItem(MOMENT_KEY, nextMoment);
    } catch {
      /* ignore */
    }
    setMoment(nextMoment);
    setSaved("moment");
  }

  return (
    <div className={styles.heroInviteNextStep}>
      <div>
        <span>{asksName ? "Um detalhe para deixar mais seu" : "Para começar com mais contexto"}</span>
        <strong>
          {asksName
            ? "Como podemos te chamar?"
            : `${name}, qual momento você quer levar para a Aurora primeiro?`}
        </strong>
        <p>
          {asksName
            ? "Seu email já está na lista. Seu nome ajuda a deixar sua experiência e seus convites mais pessoais."
            : "Pode ser uma fase, um projeto, uma ambição ou uma frase sobre o que você quer entender melhor."}
        </p>
      </div>

      <div className={styles.heroInviteField}>
        <input
          value={asksName ? name : moment}
          onChange={(event) => asksName ? setName(event.target.value) : setMoment(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              asksName ? saveName() : saveMoment();
            }
          }}
          type="text"
          autoComplete={asksName ? "given-name" : "off"}
          placeholder={asksName ? "seu nome" : "ex: quero entender melhor meus dias"}
          aria-label={asksName ? "Seu nome" : "Seu momento de vida ou intenção de uso"}
        />
        <button type="button" onClick={asksName ? saveName : saveMoment}>
          {asksName ? "Guardar nome" : "Guardar frase"}
        </button>
      </div>

      {saved ? (
        <div className={styles.heroInviteSaved}>
          {saved === "name"
            ? "Pronto. Agora a Aurora sabe como te chamar."
            : "Guardado. Essa pista fica aqui para deixar o começo mais próximo de você."}
        </div>
      ) : null}
    </div>
  );
}
