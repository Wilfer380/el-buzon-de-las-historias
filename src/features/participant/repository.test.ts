import { describe, expect, it, vi } from 'vitest'
import { WorkerParticipantRepository } from './repository'

describe('Worker participant repository', () => {
  it('keeps the issued bearer token in memory and sends it on reload', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'a'.repeat(64), participant: { id: 'p1', workshopId: 'w1', pseudonym: null }, workshop: { id: 'w1', title: 'Taller', stage: 'contributions' }, contributions: [] }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ participant: { id: 'p1', workshopId: 'w1', pseudonym: null }, workshop: { id: 'w1', title: 'Taller', stage: 'contributions' }, contributions: [] }), { headers: { 'Content-Type': 'application/json' } }))
    const repository = new WorkerParticipantRepository('https://api.test', fetcher)
    const joined = await repository.join('historia', '')
    expect(joined.participant.token).toBe('a'.repeat(64))
    await repository.reload(joined.participant)
    expect(fetcher).toHaveBeenLastCalledWith('https://api.test/api/workshops/HISTORIA/participant', expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${'a'.repeat(64)}` }) }))
  })
})
