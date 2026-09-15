import { supabase } from '../supabaseClient';

export const createServerSupabaseClient = () => {
  return supabase;
};

export interface RawVehicle {
  id: string | number;
  owner_id?: string;
  make?: string;
  brand?: string;
  model?: string;
  year?: number;
  category?: string;
  zone?: string;
  location?: string;
  daily_rate?: number;
  dailyRate?: number;
  price?: number;
  driver_mode?: string;
  driverMode?: string;
  transmission?: string;
  fuel?: string;
  fuel_type?: string;
  body?: string;
  body_type?: string;
  color?: string;
  cc?: string;
  engine?: string;
  mileage?: string;
  condition?: string;
  seats?: number;
  usage_type?: string;
  poster_role?: string;
  owner_phone?: string;
  status?: string;
  is_premium?: boolean;
  requires_check?: boolean;
  deposit_amount?: number;
  advanced_payment_days?: number;
  supplier?: any;
  collateral?: string[];
  description?: string;
  image?: string;
  image_url?: string;
  images?: string[];
  created_at?: string;
}

export const normalizeServerVehicle = (row: RawVehicle) => ({
  id: String(row.id),
  owner_id: row.owner_id || null,
  make: row.make || row.brand || '',
  model: row.model || '',
  year: row.year || new Date().getFullYear(),
  category: row.category || 'Economy',
  zone: row.zone || row.location || 'Bole',
  dailyRate: Number(row.daily_rate || row.dailyRate || row.price || 0),
  driverMode: row.driver_mode || row.driverMode || 'Self-Drive',
  transmission: row.transmission || 'Auto',
  fuel: row.fuel || row.fuel_type || 'Petrol',
  body: row.body || row.body_type || 'Hatchback',
  color: row.color || 'Silver',
  cc: row.cc || row.engine || '1.3L',
  mileage: row.mileage || '45,000 km',
  condition: row.condition || 'Used in Ethiopia',
  seats: row.seats || 5,
  usage_type: row.usage_type || 'Personal Use',
  poster_role: row.poster_role || 'Private Owner',
  owner_phone: row.owner_phone || '',
  status: row.status || 'active',
  is_premium: Boolean(row.is_premium),
  requires_check: Boolean(row.requires_check),
  deposit_amount: Number(row.deposit_amount || 0),
  advanced_payment_days: Number(row.advanced_payment_days || 0),
  supplier: typeof row.supplier === 'object' && row.supplier !== null 
    ? { ...row.supplier, phone: '0930175564' } 
    : { name: 'Verified Partner', phone: '0930175564' },
  collateral: row.collateral || ['Kebele ID', 'Deposit'],
  description: row.description || 'Well-maintained vehicle in excellent condition. Ideal for city driving or long-distance rentals across Ethiopia.',
  image: row.image || row.image_url || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=800&auto=format&fit=crop',
  images: Array.isArray(row.images) && row.images.length > 0 ? row.images : [row.image_url || row.image || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=800&auto=format&fit=crop'],
  created_at: row.created_at || new Date().toISOString()
});

/**
 * Fetch initial batch of cars directly on the server for instant Next.js streaming
 */
export async function getInitialCars(limit: number = 100) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, owner_id, make, model, year, category, zone, daily_rate, driver_mode, usage_type, poster_role, status, is_premium, description, image_url, images, created_at, advanced_payment_days, deposit_amount, requires_check')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Server Supabase fetch error:', error.message);
      return [];
    }

    return (data || []).map(normalizeServerVehicle);
  } catch (err) {
    console.error('Failed to stream initial cars on server:', err);
    return [];
  }
}
