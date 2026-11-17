import { describe, expect, it } from 'vitest'
import { readPublicEnvironment } from '../env'
import { createSupabaseBrowserClient } from './supabase'

describe('Supabase browser configuration', () => {
  it('keeps the static shell usable without backend credentials', () => {
    expect(readPublicEnvironment({})).toEqual({
      configuration: null,
      issues: [
        'VITE_SUPABASE_URL is not configured',
        'VITE_SUPABASE_ANON_KEY is not configured',
      ],
    })
  })

  it('fails clearly only when a backend client is requested', () => {
    expect(() => createSupabaseBrowserClient({})).toThrowError(
      /Supabase is unavailable.*VITE_SUPABASE_URL.*VITE_SUPABASE_ANON_KEY/,
    )
  })

  it('creates a client from public browser credentials', () => {
    const client = createSupabaseBrowserClient({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'public-anon-key',
    })
    expect(client.auth).toBeDefined()
  })
})
