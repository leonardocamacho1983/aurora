"use client";

import { useEffect } from "react";

/** Registra o service worker (apenas em produção/HTTPS; localhost também é permitido). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {
            // Falha silenciosa: o dev não deve depender de service worker.
          });
        });
      });
      return;
    }
    if (!window.isSecureContext && window.location.hostname !== "localhost") return;

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
