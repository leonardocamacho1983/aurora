"use client";

export interface CrisisResourcesData {
  locale: string;
  message: string;
  lines: { name: string; contact: string; note?: string }[];
  disclaimer: string;
}

/**
 * Sheet de crise (§8) — acolhimento + linha de apoio local. NÃO mostra reflexão.
 * Aparece quando /api/reflect responde status:"crisis".
 */
export function CrisisResources({
  data,
  onClose,
}: {
  data: CrisisResourcesData;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crisis-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "var(--space-4)",
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "var(--surface)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--r-lg)",
          padding: "var(--space-5)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        <h2 id="crisis-title" className="font-serif" style={{ margin: 0, fontSize: "clamp(1.1rem, 1rem + 0.5vw, 1.25rem)" }}>
          Você não está sozinho(a)
        </h2>
        <p style={{ margin: 0, color: "var(--ink)" }}>{data.message}</p>

        {data.lines.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {data.lines.map((l) => (
              <li
                key={l.name}
                style={{
                  background: "var(--raised)",
                  borderRadius: "var(--r-md)",
                  padding: "var(--space-3) var(--space-4)",
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {l.name}: <a href={`tel:${l.contact}`} style={{ color: "var(--accent)" }}>{l.contact}</a>
                </div>
                {l.note && (
                  <div style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>{l.note}</div>
                )}
              </li>
            ))}
          </ul>
        )}

        <p style={{ margin: 0, color: "var(--ink-faint)", fontSize: "0.9rem" }}>
          {data.disclaimer}
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{
            minHeight: 44,
            padding: "var(--space-3) var(--space-5)",
            borderRadius: "var(--r-pill)",
            border: "1px solid var(--hairline)",
            background: "var(--raised)",
            color: "var(--ink)",
            fontSize: "1rem",
            cursor: "pointer",
            alignSelf: "center",
          }}
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
