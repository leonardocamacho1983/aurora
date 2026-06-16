import { signIn, signUp } from "./actions";

export const dynamic = "force-dynamic";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "var(--space-3)",
  borderRadius: "var(--r-sm)",
  border: "1px solid var(--hairline)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: "1rem",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  padding: "var(--space-3) var(--space-4)",
  borderRadius: "var(--r-pill)",
  border: "1px solid var(--hairline)",
  background: "var(--raised)",
  color: "var(--ink)",
  fontSize: "1rem",
  cursor: "pointer",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-5)",
      }}
    >
      <form
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
          width: "100%",
          maxWidth: 360,
        }}
      >
        <h1
          className="font-serif"
          style={{ fontSize: "1.5rem", margin: 0, textAlign: "center" }}
        >
          Aurora
        </h1>

        {message === "check-email" && (
          <p style={{ color: "var(--success)", margin: 0, fontSize: "0.9rem" }}>
            Verifique seu email para confirmar a conta.
          </p>
        )}
        {error && (
          <p style={{ color: "var(--alert)", margin: 0, fontSize: "0.9rem" }}>
            {error}
          </p>
        )}

        <input
          style={fieldStyle}
          type="email"
          name="email"
          placeholder="Email"
          autoComplete="email"
          required
        />
        <input
          style={fieldStyle}
          type="password"
          name="password"
          placeholder="Senha"
          autoComplete="current-password"
          required
        />

        <button style={buttonStyle} formAction={signIn}>
          Entrar
        </button>
        <button style={buttonStyle} formAction={signUp}>
          Criar conta
        </button>
      </form>
    </main>
  );
}
