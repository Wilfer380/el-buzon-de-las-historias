import { apiEnvironment } from '../../env'
import type { ContributionCategory, ContributionStatus, WorkshopStage } from '../../domain/workshop'

export type Participant = { id: string; workshopId: string; pseudonym: string | null; token: string; code: string }
export type Contribution = { id: string; category: ContributionCategory; content: string; status: ContributionStatus; own: boolean }
export type ParticipantSnapshot = {
  participant: Participant
  workshop: { id: string; title: string; stage: WorkshopStage }
  contributions: Contribution[]
}
export interface ParticipantRepository {
  join(code: string, pseudonym: string): Promise<ParticipantSnapshot>
  reload(participant: Participant): Promise<ParticipantSnapshot>
  submit(participant: Participant, category: ContributionCategory, content: string): Promise<Contribution>
  subscribe(participant: Participant, changed: () => void): () => void
}

type ApiParticipant = Omit<Participant, 'token' | 'code'>
type ApiSnapshot = { participant: ApiParticipant; workshop: ParticipantSnapshot['workshop']; contributions: Contribution[]; token?: string }

export class WorkerParticipantRepository implements ParticipantRepository {
  constructor(private baseUrl: string = apiEnvironment.apiUrl, private fetcher: typeof fetch = fetch) {}
  private async request<T>(path: string, init: RequestInit = {}) {
    if (!this.baseUrl) throw new Error('Worker API is unavailable: VITE_API_URL is not configured')
    const fetcher = this.fetcher
    const response = await fetcher(`${this.baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } })
    const value = await response.json() as T & { error?: string }
    if (!response.ok) throw new Error(value.error ?? 'Worker API request failed')
    return value
  }
  async join(code: string, pseudonym: string) {
    const normalizedCode = code.trim().toUpperCase()
    const value = await this.request<ApiSnapshot>(`/api/workshops/${encodeURIComponent(normalizedCode)}/join`, { method: 'POST', body: JSON.stringify({ pseudonym: pseudonym.trim() || null }) })
    if (!value.token) throw new Error('Worker API did not issue a participant session')
    return { ...value, participant: { ...value.participant, token: value.token, code: normalizedCode } }
  }
  async reload(participant: Participant) {
    const value = await this.request<ApiSnapshot>(`/api/workshops/${encodeURIComponent(participant.code)}/participant`, { headers: { Authorization: `Bearer ${participant.token}` } })
    return { ...value, participant }
  }
  async submit(participant: Participant, category: ContributionCategory, content: string) {
    return this.request<Contribution>(`/api/workshops/${encodeURIComponent(participant.code)}/contributions`, { method: 'POST', headers: { Authorization: `Bearer ${participant.token}` }, body: JSON.stringify({ category, content: content.trim() }) })
  }
  subscribe(_participant: Participant, changed: () => void) {
    const interval = window.setInterval(changed, 3000)
    return () => window.clearInterval(interval)
  }
}

export const createParticipantRepository = () => new WorkerParticipantRepository()
