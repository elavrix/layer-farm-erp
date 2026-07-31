-- Allow authenticated users to insert/update/delete farms and sheds
-- Also allow flocks writes (was missing)

CREATE POLICY "auth_write_farms"
  ON farms FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_sheds"
  ON sheds FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_flocks"
  ON flocks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also add delete policy for egg_rates (was INSERT only)
CREATE POLICY "auth_delete_egg_rates"
  ON egg_rates FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_update_egg_rates"
  ON egg_rates FOR UPDATE TO authenticated USING (true);
