-- User profiles linked to Supabase Auth
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'manager', 'worker', 'viewer')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE farms              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheds              ENABLE ROW LEVEL SECURITY;
ALTER TABLE flocks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE egg_rates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales              ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases          ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_feed     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_medicine ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_farms"           ON farms              FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_sheds"           ON sheds              FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_egg_rates"       ON egg_rates          FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_daily_entries"   ON daily_entries      FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_sales"           ON sales              FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_purchases"       ON purchases          FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_inv_feed"        ON inventory_feed     FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_inv_medicine"    ON inventory_medicine FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_user_profiles"   ON user_profiles      FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_write_egg_rates"      ON egg_rates          FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_write_daily_entries"  ON daily_entries      FOR ALL    TO authenticated USING (true);
CREATE POLICY "auth_write_sales"          ON sales              FOR ALL    TO authenticated USING (true);
CREATE POLICY "auth_write_purchases"      ON purchases          FOR ALL    TO authenticated USING (true);
CREATE POLICY "auth_write_inv_feed"       ON inventory_feed     FOR ALL    TO authenticated USING (true);
CREATE POLICY "auth_write_inv_medicine"   ON inventory_medicine FOR ALL    TO authenticated USING (true);
CREATE POLICY "auth_write_user_profiles"  ON user_profiles      FOR ALL    TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
