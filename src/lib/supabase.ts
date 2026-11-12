import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = 'wae_supabase_url_v2';
const SUPABASE_KEY_KEY = 'wae_supabase_anon_key_v2';

export function getStoredSupabaseConfig(): { url: string; key: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(SUPABASE_URL_KEY) || envUrl;
  const storedKey = localStorage.getItem(SUPABASE_KEY_KEY) || envKey;

  return {
    url: storedUrl.trim(),
    key: storedKey.trim(),
  };
}

export function saveSupabaseConfig(url: string, key: string): void {
  localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_KEY_KEY, key.trim());
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getStoredSupabaseConfig();
  if (!url || !key || url.startsWith('YOUR_') || !url.startsWith('https://')) {
    return null;
  }

  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key);
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Test live Supabase connection
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  hasDeviceRpc?: boolean;
  profileCount?: number;
  error?: string;
}> {
  const sb = getSupabaseClient();
  if (!sb) {
    return { connected: false, error: 'Supabase URL and Anon Key are not configured.' };
  }

  try {
    // 1. Check profiles count
    const { count, error: countErr } = await sb
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countErr) {
      return { connected: false, error: countErr.message };
    }

    // 2. Check device_taken RPC from fix.sql
    const { data: deviceRpcData, error: rpcErr } = await sb.rpc('device_taken', {
      p_device: 'test_device_probe',
    });

    return {
      connected: true,
      hasDeviceRpc: !rpcErr,
      profileCount: count ?? 0,
      error: rpcErr ? `Profiles connected, but device_taken RPC missing: ${rpcErr.message}` : undefined,
    };
  } catch (e: any) {
    return { connected: false, error: e.message || 'Connection failed' };
  }
}
