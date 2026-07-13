"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <section style={{ maxWidth: 520 }}>
            <p style={{ margin: "0 0 8px", font: "600 12px/1.4 system-ui", letterSpacing: 1, textTransform: "uppercase" }}>
              Aurora
            </p>
            <h1 style={{ margin: "0 0 12px", font: "600 28px/1.15 system-ui" }}>Algo saiu do lugar.</h1>
            <p style={{ margin: 0, font: "400 16px/1.6 system-ui" }}>
              A falha foi registrada para investigacao. Recarregue a pagina em alguns instantes.
            </p>
          </section>
        </main>
      </body>
    </html>
  );
}
