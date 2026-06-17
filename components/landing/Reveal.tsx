"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import styles from "./Landing.module.css";

// Fade-up suave quando entra na viewport (1 observer por instância, leve).
export function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${shown ? styles.revealIn : ""}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

// Blob de aurora desfocado, decorativo (atmosfera). Posicionar via style.
export function AuroraGlow({ style }: { style: CSSProperties }) {
  return <div aria-hidden="true" className={styles.auroraGlow} style={style} />;
}
