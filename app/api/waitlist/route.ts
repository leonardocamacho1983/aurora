import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mesma validação do design (README): email simples.
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// POST /api/waitlist — público. Guarda o email; duplicado é tratado como sucesso.
export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  try {
    await db.insert(waitlist).values({ email }).onConflictDoNothing();
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("/api/waitlist error:", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
