type PublicEnvironment = { supabaseUrl?: string; supabaseAnonKey?: string }

export const environment: PublicEnvironment = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
}

export const environmentIssues = [
  !environment.supabaseUrl && 'VITE_SUPABASE_URL is not configured',
  !environment.supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY is not configured',
].filter((issue): issue is string => Boolean(issue))
