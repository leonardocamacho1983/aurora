export default function Home() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-4)",
        padding: "var(--space-5)",
        textAlign: "center",
      }}
    >
      <h1
        className="font-serif"
        style={{ fontSize: "1.75rem", color: "var(--ink)", margin: 0 }}
      >
        Aurora
      </h1>
      <p style={{ color: "var(--ink-soft)", maxWidth: "32ch", margin: 0 }}>
        Fundação (Fase 1) pronta. O orb e o loop de fala chegam na Fase 2.
      </p>
    </main>
  );
}
