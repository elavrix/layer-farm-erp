-- Al Rehman Poultry Farm ERP — Full Schema

-- Farms
CREATE TABLE IF NOT EXISTS farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  owner text,
  created_at timestamptz DEFAULT now()
);

-- Sheds
CREATE TABLE IF NOT EXISTS sheds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Flocks
CREATE TABLE IF NOT EXISTS flocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shed_id uuid REFERENCES sheds(id) ON DELETE CASCADE,
  batch_code text NOT NULL,
  breed text,
  birds_count int NOT NULL DEFAULT 0,
  placement_date date NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Egg Rates history
CREATE TABLE IF NOT EXISTS egg_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate numeric(10,2) NOT NULL,
  note text,
  updated_by text DEFAULT 'Manager',
  created_at timestamptz DEFAULT now()
);

-- Daily Entries (one row per shed per day)
CREATE TABLE IF NOT EXISTS daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shed_id uuid REFERENCES sheds(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  eggs_collected int DEFAULT 0,
  eggs_broken int DEFAULT 0,
  eggs_dirty int DEFAULT 0,
  mortality int DEFAULT 0,
  feed_used numeric(8,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(shed_id, entry_date)
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  trays int NOT NULL DEFAULT 0,
  rate_per_tray numeric(10,2) NOT NULL,
  discount numeric(10,2) DEFAULT 0,
  transport numeric(10,2) DEFAULT 0,
  gross_amount numeric(12,2) NOT NULL,
  net_amount numeric(12,2) NOT NULL,
  payment_status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  category text DEFAULT 'feed',
  quantity numeric(10,2) NOT NULL,
  unit text NOT NULL,
  price_per_unit numeric(10,2) NOT NULL,
  total_amount numeric(12,2) NOT NULL,
  supplier text,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Inventory: Feed
CREATE TABLE IF NOT EXISTS inventory_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL,
  stock numeric(10,2) NOT NULL DEFAULT 0,
  reorder_level numeric(10,2) DEFAULT 0,
  price_per_unit numeric(10,2) DEFAULT 0,
  supplier text,
  created_at timestamptz DEFAULT now()
);

-- Inventory: Medicine & Vaccines
CREATE TABLE IF NOT EXISTS inventory_medicine (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity text NOT NULL,
  expiry_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Seed: Al Rehman Poultry Farm
INSERT INTO farms (id, name, location, owner)
VALUES ('00000000-0000-0000-0000-000000000001', 'Al Rehman Poultry Farm', 'Pakistan', 'Manager')
ON CONFLICT DO NOTHING;

-- Seed: Shed 1 and Shed 2
INSERT INTO sheds (id, farm_id, name, capacity)
VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Shed 1', 20000),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Shed 2', 10000)
ON CONFLICT DO NOTHING;

-- Seed: initial egg rate
INSERT INTO egg_rates (rate, note, updated_by)
VALUES (1050, 'Initial rate', 'Manager')
ON CONFLICT DO NOTHING;
