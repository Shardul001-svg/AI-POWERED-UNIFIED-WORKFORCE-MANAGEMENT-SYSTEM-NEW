type SupabaseEnvironmentVariable = "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY";

function getEnvironmentVariable(name: SupabaseEnvironmentVariable) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseUrl() {
  return getEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return getEnvironmentVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}