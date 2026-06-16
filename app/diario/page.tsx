import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Diario } from "./Diario";

export const dynamic = "force-dynamic";

export default async function DiarioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return <Diario />;
}
