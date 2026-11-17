import { describe, expect, it } from 'vitest'
import { createWorker, type ContributionRecord, type DataStore, type ParticipantRecord, type WorkshopRecord } from './index'

class MemoryStore implements DataStore {
  workshop: WorkshopRecord = { id: 'w1', code: 'HISTORIA', title: 'El Buzón de las Historias', stage: 'contributions' }
  participants: ParticipantRecord[] = []
  contributions: ContributionRecord[] = []
  sessions = new Map<string, { workshopId: string; expiresAt: number }>()
  async workshopByCode(code: string) { return code === this.workshop.code ? this.workshop : null }
  async participantByTokenHash(hash: string) { return this.participants.find(item => item.tokenHash === hash) ?? null }
  async createParticipant(value: ParticipantRecord) { this.participants.push(value) }
  async listParticipantContributions(workshopId: string, participantId: string) { return this.contributions.filter(item => item.workshopId === workshopId && (item.status === 'approved' || item.participantId === participantId)) }
  async createContribution(value: ContributionRecord) { this.contributions.push(value) }
  async createAdminSession(hash: string, workshopId: string, expiresAt: number) { this.sessions.set(hash, { workshopId, expiresAt }) }
  async adminSession(hash: string) { return this.sessions.get(hash) ?? null }
  async listAdminContributions(workshopId: string) { return this.contributions.filter(item => item.workshopId === workshopId) }
  async moderateContribution(id: string, workshopId: string, status: 'approved' | 'rejected') { const item = this.contributions.find(row => row.id === id && row.workshopId === workshopId); if (!item) return false; item.status = status; return true }
  async listApprovedContributions(workshopId: string) { return this.contributions.filter(item => item.workshopId === workshopId && item.status === 'approved') }
  async contributionCounts(workshopId: string) { const rows = this.contributions.filter(item => item.workshopId === workshopId); return { approved: rows.filter(item => item.status === 'approved').length, pending: rows.filter(item => item.status === 'pending').length, rejected: rows.filter(item => item.status === 'rejected').length } }
}

const env = { ALLOWED_ORIGIN: 'https://example.test', ORGANIZER_SECRET: 'organizer-secret-long', PROJECTION_TOKEN: 'projection-secret-long' }
const call = (worker: ReturnType<typeof createWorker>, path: string, init: RequestInit = {}) => worker.fetch(new Request(`https://api.test${path}`, { ...init, headers: { Origin: env.ALLOWED_ORIGIN, 'Content-Type': 'application/json', ...init.headers } }), env)

describe('Worker API privacy and moderation', () => {
  it('authenticates organizer without exposing the secret and rejects invalid credentials', async () => {
    const worker = createWorker(new MemoryStore())
    expect((await call(worker, '/api/admin/login', { method: 'POST', body: JSON.stringify({ workshopCode: 'HISTORIA', secret: 'wrong-secret-long' }) })).status).toBe(401)
    const response = await call(worker, '/api/admin/login', { method: 'POST', body: JSON.stringify({ workshopCode: 'HISTORIA', secret: env.ORGANIZER_SECRET }) })
    expect(response.status).toBe(200)
    const body = await response.json() as { token: string }
    expect(body.token).toHaveLength(64)
    expect(JSON.stringify(body)).not.toContain(env.ORGANIZER_SECRET)
  })

  it('keeps pending contributions private, then exposes approved content after moderation', async () => {
    const store = new MemoryStore()
    const worker = createWorker(store)
    const joined = await (await call(worker, '/api/workshops/HISTORIA/join', { method: 'POST', body: JSON.stringify({ pseudonym: 'Luna' }) })).json() as { token: string }
    await call(worker, '/api/workshops/HISTORIA/contributions', { method: 'POST', headers: { Authorization: `Bearer ${joined.token}` }, body: JSON.stringify({ category: 'hope', content: 'Un futuro accesible' }) })

    const projectionBefore = await call(worker, `/api/projection/HISTORIA?token=${env.PROJECTION_TOKEN}`)
    const privateProjection = await projectionBefore.json() as { counts: Record<string, number> }
    expect(JSON.stringify(privateProjection)).not.toContain('Un futuro accesible')
    expect(privateProjection.counts).toEqual({ approved: 0 })

    const login = await (await call(worker, '/api/admin/login', { method: 'POST', body: JSON.stringify({ workshopCode: 'HISTORIA', secret: env.ORGANIZER_SECRET }) })).json() as { token: string }
    const pending = await (await call(worker, '/api/admin/workshops/HISTORIA/contributions', { headers: { Authorization: `Bearer ${login.token}` } })).json() as { contributions: Array<{ id: string; status: string }> }
    expect(pending.contributions[0].status).toBe('pending')
    await call(worker, `/api/admin/contributions/${pending.contributions[0].id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${login.token}` }, body: JSON.stringify({ status: 'approved' }) })

    const projectionAfter = await (await call(worker, `/api/projection/HISTORIA?token=${env.PROJECTION_TOKEN}`)).json() as { contributions: Array<{ content: string }>; counts: { approved: number } }
    expect(projectionAfter.contributions[0].content).toBe('Un futuro accesible')
    expect(projectionAfter.counts.approved).toBe(1)
  })

  it('requires the projection capability and applies restricted CORS', async () => {
    const worker = createWorker(new MemoryStore())
    expect((await call(worker, '/api/projection/HISTORIA?token=wrong-projection')).status).toBe(401)
    const forbiddenOrigin = await worker.fetch(new Request('https://api.test/api/projection/HISTORIA?token=wrong', { headers: { Origin: 'https://evil.test' } }), env)
    expect(forbiddenOrigin.status).toBe(403)
    expect(forbiddenOrigin.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})
