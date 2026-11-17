export type PublicEnvironmentSource = {
  readonly VITE_API_URL?: string
  readonly VITE_PROJECTION_TOKEN?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly [key: string]: unknown
}

type PublicEnvironment = { supabaseUrl: string; supabaseAnonKey: string }
type EnvironmentResult = { configuration: PublicEnvironment | null; issues: string[] }
export type ApiEnvironment = { apiUrl: string; projectionToken: string }

export function readPublicEnvironment(source: PublicEnvironmentSource): EnvironmentResult {
  const issues = [
    !source.VITE_SUPABASE_URL && 'VITE_SUPABASE_URL is not configured',
    !source.VITE_SUPABASE_ANON_KEY && 'VITE_SUPABASE_ANON_KEY is not configured',
  ].filter((issue): issue is string => Boolean(issue))

  return {
    configuration: issues.length ? null : {
      supabaseUrl: source.VITE_SUPABASE_URL!,
      supabaseAnonKey: source.VITE_SUPABASE_ANON_KEY!,
    },
    issues,
  }
}

export function readApiEnvironment(source: PublicEnvironmentSource): ApiEnvironment {
  return {
    apiUrl: String(source.VITE_API_URL ?? '').replace(/\/$/, ''),
    projectionToken: String(source.VITE_PROJECTION_TOKEN ?? ''),
  }
}

// Supabase parsing remains for the documented historical alternative only.
export const environment = readPublicEnvironment(import.meta.env)
export const environmentIssues = environment.issues
export const apiEnvironment = readApiEnvironment(import.meta.env)
