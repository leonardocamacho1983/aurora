"use client";

import { useEffect } from "react";

/** Registra o service worker (apenas em produção/HTTPS; localhost também é permitido). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Falha silenciosa: SW é progressivo, não bloqueia o app.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
