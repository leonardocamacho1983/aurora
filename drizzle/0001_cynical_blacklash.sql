ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint

-- users.id == auth.users.id (Supabase Auth). FK + cascade no delete da conta.
ALTER TABLE "users"
  ADD CONSTRAINT "users_id_auth_users_fk"
  FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade;--> statement-breakpoint

-- Provisiona a linha em public.users a cada signup no Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();--> statement-breakpoint

-- Row Level Security
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "embeddings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "crisis_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- users: cada um enxerga/edita apenas a própria linha.
CREATE POLICY "users_select_own" ON "users"
  FOR SELECT TO authenticated USING (id = auth.uid());--> statement-breakpoint
CREATE POLICY "users_update_own" ON "users"
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());--> statement-breakpoint

-- Tabelas com user_id: isolamento total por dono (auth.uid()).
CREATE POLICY "entries_all_own" ON "entries"
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "embeddings_all_own" ON "embeddings"
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "consents_all_own" ON "consents"
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "subscriptions_all_own" ON "subscriptions"
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "crisis_events_all_own" ON "crisis_events"
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
