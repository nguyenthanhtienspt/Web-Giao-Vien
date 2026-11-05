import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite env or localStorage override
const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const localUrl = typeof window !== 'undefined' ? localStorage.getItem('tro_ly_supabase_url') : null;
const localKey = typeof window !== 'undefined' ? localStorage.getItem('tro_ly_supabase_anon_key') : null;

export const supabaseUrl = localUrl || envUrl || '';
export const supabaseAnonKey = localKey || envAnonKey || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co') &&
    supabaseAnonKey.length > 20
  );
};

export const saveSupabaseCustomCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tro_ly_supabase_url', url.trim());
    localStorage.setItem('tro_ly_supabase_anon_key', key.trim());
  }
};

export const clearSupabaseCustomCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tro_ly_supabase_url');
    localStorage.removeItem('tro_ly_supabase_anon_key');
  }
};

// Create the singleton client if configured, otherwise null
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
