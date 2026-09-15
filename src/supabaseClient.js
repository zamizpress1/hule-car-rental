import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mxruhvpilfehqxdhvbqk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14cnVodnBpbGZlaHF4ZGh2YnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NDU0ODAsImV4cCI6MjEwMjQyMTQ4MH0.yd8vZiiBe99HNOSYm1I2Wrl4CV3Zgj1utbHbmfGn6k8';

// Dedicated single Supabase client instance (createClient called exactly once)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = supabase;
