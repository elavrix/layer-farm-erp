export type UserRole = 'owner' | 'manager' | 'supervisor' | 'accountant' | 'worker'

export interface Farm {
  id: string
  name: string
  address: string
  gps_location?: string
  owner_id: string
  capacity: number
  created_at: string
}

export interface Shed {
  id: string
  farm_id: string
  name: string
  capacity: number
  created_at: string
}

export interface Flock {
  id: string
  shed_id: string
  batch_number: string
  breed: string
  arrival_date: string
  bird_count: number
  supplier?: string
  created_at: string
}

export interface DailyEntry {
  id: string
  shed_id: string
  date: string
  eggs_collected: number
  broken_eggs: number
  dirty_eggs: number
  mortality: number
  feed_used_kg: number
  water_used_l: number
  medicine?: string
  temperature_c?: number
  humidity_pct?: number
  notes?: string
  created_by: string
  created_at: string
}

export interface Sale {
  id: string
  farm_id: string
  customer_name: string
  egg_quantity: number
  price_per_unit: number
  discount: number
  transport_cost: number
  payment_mode: 'cash' | 'credit'
  status: 'paid' | 'pending'
  created_at: string
}

export interface NavItem {
  title: string
  href: string
  icon: string
  roles: UserRole[]
}
