import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value ? value : undefined;
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || readEnv('SUPABASE_URL');
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (typeof window === 'undefined'
      ? readEnv('SUPABASE_ANON_KEY') || readEnv('SUPABASE_SERVICE_ROLE_KEY')
      : undefined);
  return { url, key };
}

let client: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (client) {
    return client;
  }

  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('supabaseKey is required.');
  }

  client = createClient(url, key);
  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const instance = getSupabase();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
