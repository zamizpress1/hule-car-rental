export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://mxruhvpilfehqxdhvbqk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14cnVodnBpbGZlaHF4ZGh2YnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NDU0ODAsImV4cCI6MjEwMjQyMTQ4MH0.yd8vZiiBe99HNOSYm1I2Wrl4CV3Zgj1utbHbmfGn6k8';

export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      fetch: (url: any, options: any = {}) => {
        const headers = new Headers(options.headers || {});
        headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        headers.set('Pragma', 'no-cache');
        headers.set('X-Cache-Buster', String(Date.now()));
        return fetch(url, {
          ...options,
          headers,
          cache: 'no-store'
        });
      }
    }
  });
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
  is_premium: Boolean(row.is_premium || (row as any).is_featured || (row as any).featured),
  requires_check: Boolean(row.requires_check),
  deposit_amount: Number(row.deposit_amount || 0),
  advanced_payment_days: Number(row.advanced_payment_days || 0),
  supplier: typeof row.supplier === 'object' && row.supplier !== null 
    ? { ...row.supplier, phone: '0930175564' } 
    : { name: 'Verified Partner', phone: '0930175564' },
  collateral: row.collateral || ['Kebele ID', 'Deposit'],
  description: row.description || 'Well-maintained vehicle in excellent condition. Ideal for city driving or long-distance rentals across Ethiopia.',
  image: row.image_url || row.image || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=800&auto=format&fit=crop',
  images: row.image_url ? [row.image_url] : [],
  created_at: row.created_at || new Date().toISOString()
});

import { parseUrlFilters } from '../utils/urlFilters';

/**
 * Fetch initial batch of cars directly on the server for instant Next.js streaming.
 * Strictly applies only valid filter keys and ignores all marketing tracking parameters.
 */
export async function getInitialCars(limit: number = 12, customFilters?: any) {
  try {
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from('vehicles')
      .select('*')
      .or('status.eq.active,status.is.null')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (customFilters) {
      const safeFilters = parseUrlFilters(customFilters);
      if (safeFilters.hasActiveFilters) {
        if (safeFilters.category && safeFilters.category !== 'all') {
          query = query.eq('category', safeFilters.category);
        }
        if (safeFilters.zone && safeFilters.zone !== 'all') {
          query = query.eq('zone', safeFilters.zone);
        }
        if (safeFilters.make) {
          query = query.ilike('make', `%${safeFilters.make}%`);
        }
        if (safeFilters.model) {
          query = query.ilike('model', `%${safeFilters.model}%`);
        }
        if (safeFilters.year) {
          query = query.eq('year', Number(safeFilters.year));
        }
        if (safeFilters.minPrice) {
          query = query.gte('daily_rate', Number(safeFilters.minPrice));
        }
        if (safeFilters.maxPrice) {
          query = query.lte('daily_rate', Number(safeFilters.maxPrice));
        }
      }
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Server Supabase fetch error:', error.message);
      return [];
    }

    return (data || [])
      .filter((row: any) => !row.status || String(row.status).toLowerCase() === 'active')
      .map(normalizeServerVehicle);
  } catch (err) {
    console.error('Failed to stream initial cars on server:', err);
    return [];
  }
}
