import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("Home");

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
        {t("title")}
      </h1>
      <p style={{ color: "var(--ink-soft)", maxWidth: "32ch", margin: 0 }}>
        {t("subtitle")}
      </p>
    </main>
  );
}
