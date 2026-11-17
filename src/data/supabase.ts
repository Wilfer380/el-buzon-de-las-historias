import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readPublicEnvironment, type PublicEnvironmentSource } from '../env'
import type { Database } from './database'

export function createSupabaseBrowserClient(
  source: PublicEnvironmentSource = import.meta.env,
): SupabaseClient<Database> {
  const { configuration, issues } = readPublicEnvironment(source)
  if (!configuration) {
    throw new Error(`Supabase is unavailable: ${issues.join('; ')}`)
  }
  return createClient<Database>(configuration.supabaseUrl, configuration.supabaseAnonKey)
}
