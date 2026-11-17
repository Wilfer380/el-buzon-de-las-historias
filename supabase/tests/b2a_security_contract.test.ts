import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
const sql = readFileSync('supabase/migrations/20260311150000_b2a_foundation.sql', 'utf8').replace(/\s+/g, ' ')

describe('B2a migration security contract', () => {
  it('scopes base-table reads to a workshop identity', () => {
    expect(sql).not.toMatch(/using \(true\)|using \(is_active\b/i)
    expect(sql).toMatch(/workshops_read.+is_workshop_participant\(id\)/i)
    expect(sql).toMatch(/projection_read.+is_workshop_participant\(workshop_id\)/i)
    expect(sql).toMatch(/contributions_read.+status = 'approved'.+is_workshop_participant\(workshop_id\)/i)
    expect(sql).toMatch(/versions_read.+is_workshop_participant\(workshop_id\).+story_publications/i)
  })
  it('allows one workshop-consistent vote per participant and poll', () => {
    expect(sql).toContain('unique (poll_id,participant_session_id)')
    expect(sql).toContain('foreign key (participant_session_id,workshop_id)')
    expect(sql).toContain('foreign key (poll_id,workshop_id)')
  })
  it('enrolls only through an authenticated join-code function', () => {
    expect(sql).not.toContain('sessions_self_create')
    expect(sql).toMatch(/create function public\.enroll_participant.+security definer.+auth\.uid\(\).+join_code.+is_active/is)
    expect(sql).toMatch(/revoke insert on table public\.participant_sessions from [^;]*authenticated/i)
  })
  it('separates owner membership authority from organizer access', () => {
    expect(sql).not.toContain('memberships_organize')
    expect(sql).toMatch(/is_workshop_owner.+revoke insert, update, delete on table public\.workshop_memberships/is)
    expect(sql).toMatch(/memberships_read.+is_workshop_owner\(workshop_id\)/i)
    expect(sql).toMatch(/workshops_delete.+is_workshop_owner\(id\)/i)
  })
  it('keeps story and projection references inside their workshop', () => {
    for (const column of ['draft_id', 'story_version_id', 'featured_contribution_id'])
      expect(sql).toContain(`foreign key (${column},workshop_id)`)
    expect(sql).toContain('create table public.story_publications')
  })
})
