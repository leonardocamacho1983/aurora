import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
      <h1 className="font-serif" style={{ fontSize: "1.5rem", margin: 0 }}>
        Conta
      </h1>
      <p style={{ color: "var(--ink-soft)", margin: 0 }}>{user.email}</p>

      <form action={signOut}>
        <button
          style={{
            minHeight: 44,
            padding: "var(--space-3) var(--space-5)",
            borderRadius: "var(--r-pill)",
            border: "1px solid var(--hairline)",
            background: "var(--raised)",
            color: "var(--ink)",
            fontSize: "1rem",
            cursor: "pointer",
          }}
          type="submit"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
