export type WorkshopStage = 'lobby' | 'icebreaker' | 'contributions' | 'poll' | 'story' | 'complete'
export type ContributionCategory = 'experience' | 'difficulty' | 'hope' | 'idea'
export type ContributionStatus = 'pending' | 'approved' | 'rejected'
export type WorkshopRecord = { id: string; code: string; title: string; stage: WorkshopStage }
export type ParticipantRecord = { id: string; workshopId: string; pseudonym: string | null; tokenHash: string }
export type ContributionRecord = { id: string; workshopId: string; participantId: string; pseudonym: string | null; category: ContributionCategory; content: string; status: ContributionStatus; createdAt: string }
export type Counts = { approved: number; pending: number; rejected: number }

export interface DataStore {
  workshopByCode(code: string): Promise<WorkshopRecord | null>
  participantByTokenHash(hash: string): Promise<ParticipantRecord | null>
  createParticipant(value: ParticipantRecord): Promise<void>
  listParticipantContributions(workshopId: string, participantId: string): Promise<ContributionRecord[]>
  createContribution(value: ContributionRecord): Promise<void>
  createAdminSession(hash: string, workshopId: string, expiresAt: number): Promise<void>
  adminSession(hash: string): Promise<{ workshopId: string; expiresAt: number } | null>
  listAdminContributions(workshopId: string): Promise<ContributionRecord[]>
  moderateContribution(id: string, workshopId: string, status: 'approved' | 'rejected'): Promise<boolean>
  listApprovedContributions(workshopId: string): Promise<ContributionRecord[]>
  contributionCounts(workshopId: string): Promise<Counts>
}

type D1Result<T> = { results?: T[]; success: boolean }
type D1Statement = { bind(...values: unknown[]): D1Statement; first<T>(): Promise<T | null>; all<T>(): Promise<D1Result<T>>; run(): Promise<{ success: boolean; meta?: { changes?: number } }> }
export type D1Database = { prepare(sql: string): D1Statement }
export type Env = { DB?: D1Database; ALLOWED_ORIGIN: string; ORGANIZER_SECRET: string; PROJECTION_TOKEN: string }

type WorkshopRow = { id: string; join_code: string; title: string; active_stage: WorkshopStage }
type ParticipantRow = { id: string; workshop_id: string; pseudonym: string | null; token_hash: string }
type ContributionRow = { id: string; workshop_id: string; participant_id: string; pseudonym: string | null; category: ContributionCategory; content: string; status: ContributionStatus; created_at: string }
const contribution = (row: ContributionRow): ContributionRecord => ({ id: row.id, workshopId: row.workshop_id, participantId: row.participant_id, pseudonym: row.pseudonym, category: row.category, content: row.content, status: row.status, createdAt: row.created_at })

export class D1Store implements DataStore {
  constructor(private db: D1Database) {}
  async workshopByCode(code: string) { const canonicalCode = code === 'WORKSHOP' ? 'HISTORIA' : code; const row = await this.db.prepare('SELECT id, join_code, title, active_stage FROM workshops WHERE join_code = ? AND is_active = 1').bind(canonicalCode).first<WorkshopRow>(); return row ? { id: row.id, code: row.join_code, title: row.title, stage: row.active_stage } : null }
  async participantByTokenHash(hash: string) { const row = await this.db.prepare('SELECT id, workshop_id, pseudonym, token_hash FROM participants WHERE token_hash = ?').bind(hash).first<ParticipantRow>(); return row ? { id: row.id, workshopId: row.workshop_id, pseudonym: row.pseudonym, tokenHash: row.token_hash } : null }
  async createParticipant(value: ParticipantRecord) { await this.db.prepare('INSERT INTO participants (id, workshop_id, pseudonym, token_hash) VALUES (?, ?, ?, ?)').bind(value.id, value.workshopId, value.pseudonym, value.tokenHash).run() }
  async listParticipantContributions(workshopId: string, participantId: string) { const rows = await this.db.prepare("SELECT c.id, c.workshop_id, c.participant_id, p.pseudonym, c.category, c.content, c.status, c.created_at FROM contributions c JOIN participants p ON p.id = c.participant_id WHERE c.workshop_id = ? AND (c.status = 'approved' OR c.participant_id = ?) ORDER BY c.created_at").bind(workshopId, participantId).all<ContributionRow>(); return (rows.results ?? []).map(contribution) }
  async createContribution(value: ContributionRecord) { await this.db.prepare('INSERT INTO contributions (id, workshop_id, participant_id, category, content, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(value.id, value.workshopId, value.participantId, value.category, value.content, value.status, value.createdAt).run() }
  async createAdminSession(hash: string, workshopId: string, expiresAt: number) { await this.db.prepare('INSERT INTO admin_sessions (token_hash, workshop_id, expires_at) VALUES (?, ?, ?)').bind(hash, workshopId, expiresAt).run() }
  async adminSession(hash: string) { return this.db.prepare('SELECT workshop_id as workshopId, expires_at as expiresAt FROM admin_sessions WHERE token_hash = ?').bind(hash).first<{ workshopId: string; expiresAt: number }>() }
  async listAdminContributions(workshopId: string) { const rows = await this.db.prepare('SELECT c.id, c.workshop_id, c.participant_id, p.pseudonym, c.category, c.content, c.status, c.created_at FROM contributions c JOIN participants p ON p.id = c.participant_id WHERE c.workshop_id = ? ORDER BY c.created_at DESC').bind(workshopId).all<ContributionRow>(); return (rows.results ?? []).map(contribution) }
  async moderateContribution(id: string, workshopId: string, status: 'approved' | 'rejected') { const result = await this.db.prepare('UPDATE contributions SET status = ?, moderated_at = CURRENT_TIMESTAMP WHERE id = ? AND workshop_id = ?').bind(status, id, workshopId).run(); return (result.meta?.changes ?? 0) > 0 }
  async listApprovedContributions(workshopId: string) { const rows = await this.db.prepare("SELECT c.id, c.workshop_id, c.participant_id, p.pseudonym, c.category, c.content, c.status, c.created_at FROM contributions c JOIN participants p ON p.id = c.participant_id WHERE c.workshop_id = ? AND c.status = 'approved' ORDER BY c.created_at").bind(workshopId).all<ContributionRow>(); return (rows.results ?? []).map(contribution) }
  async contributionCounts(workshopId: string) { const rows = await this.db.prepare('SELECT status, COUNT(*) as count FROM contributions WHERE workshop_id = ? GROUP BY status').bind(workshopId).all<{ status: ContributionStatus; count: number }>(); const counts: Counts = { approved: 0, pending: 0, rejected: 0 }; for (const row of rows.results ?? []) counts[row.status] = row.count; return counts }
}

const encoder = new TextEncoder()
const hex = (bytes: Uint8Array) => [...bytes].map(value => value.toString(16).padStart(2, '0')).join('')
const sha256 = async (value: string) => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))))
const randomToken = () => hex(crypto.getRandomValues(new Uint8Array(32)))
const randomId = () => crypto.randomUUID()
async function constantTimeEqual(left: string, right: string) {
  const [a, b] = await Promise.all([sha256(left), sha256(right)])
  let mismatch = 0
  for (let index = 0; index < a.length; index++) mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index)
  return mismatch === 0
}

const categories = new Set<ContributionCategory>(['experience', 'difficulty', 'hope', 'idea'])
const rates = new Map<string, { count: number; reset: number }>()
function rateLimited(request: Request) {
  const key = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  const now = Date.now(); const current = rates.get(key)
  if (!current || current.reset < now) { rates.set(key, { count: 1, reset: now + 60_000 }); return false }
  current.count += 1
  return current.count > 120
}

const publicContribution = (item: ContributionRecord) => ({ id: item.id, pseudonym: item.pseudonym, category: item.category, content: item.content, status: item.status, createdAt: item.createdAt })
const json = (value: unknown, status = 200, extra: HeadersInit = {}) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra } })
async function body(request: Request): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get('Content-Length') ?? 0)
  if (length > 8192) throw new Error('BODY_TOO_LARGE')
  const text = await request.text()
  if (text.length > 8192) throw new Error('BODY_TOO_LARGE')
  try { const value: unknown = JSON.parse(text || '{}'); if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(); return value as Record<string, unknown> } catch { throw new Error('INVALID_JSON') }
}
const bearer = (request: Request) => request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1] ?? null

export function createWorker(fixedStore?: DataStore) {
  return { async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    if (origin && origin !== env.ALLOWED_ORIGIN) return json({ error: 'Origin not allowed' }, 403)
    const cors = origin ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS', 'Access-Control-Allow-Headers': 'Authorization,Content-Type', Vary: 'Origin' } : {}
    const secure = (response: Response) => { const result = new Response(response.body, response); for (const [key, value] of Object.entries(cors)) result.headers.set(key, value); result.headers.set('X-Content-Type-Options', 'nosniff'); result.headers.set('Referrer-Policy', 'no-referrer'); result.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()'); result.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'"); return result }
    if (request.method === 'OPTIONS') return secure(new Response(null, { status: 204 }))
    if (rateLimited(request)) return secure(json({ error: 'Too many requests' }, 429, { 'Retry-After': '60' }))
    if (!fixedStore && !env.DB) return secure(json({ error: 'Database unavailable' }, 503))
    const store = fixedStore ?? new D1Store(env.DB!)
    let url: URL
    try { url = new URL(request.url) } catch { return secure(json({ error: 'URL inválida' }, 400)) }
    const parts = url.pathname.split('/').filter(Boolean)
    try {
      if (request.method === 'POST' && url.pathname === '/api/admin/login') {
        if (!env.ORGANIZER_SECRET || env.ORGANIZER_SECRET.length < 16) return secure(json({ error: 'Organización no configurada' }, 503))
        const input = await body(request); const code = String(input.workshopCode ?? '').trim().toUpperCase(); const secret = String(input.secret ?? '')
        const workshop = await store.workshopByCode(code)
        if (!workshop || !(await constantTimeEqual(secret, env.ORGANIZER_SECRET))) return secure(json({ error: 'Credenciales inválidas' }, 401))
        const token = randomToken(); const expiresAt = Date.now() + 2 * 60 * 60 * 1000
        await store.createAdminSession(await sha256(token), workshop.id, expiresAt)
        return secure(json({ token, expiresAt }))
      }
      if (request.method === 'POST' && parts[0] === 'api' && parts[1] === 'workshops' && parts[3] === 'join') {
        const workshop = await store.workshopByCode(decodeURIComponent(parts[2] ?? '').trim().toUpperCase())
        if (!workshop) return secure(json({ error: 'Taller no encontrado' }, 404))
        const input = await body(request); const rawPseudonym = String(input.pseudonym ?? '').trim()
        if (rawPseudonym.length > 80) return secure(json({ error: 'Seudónimo demasiado largo' }, 400))
        const token = randomToken(); const participant: ParticipantRecord = { id: randomId(), workshopId: workshop.id, pseudonym: rawPseudonym || null, tokenHash: await sha256(token) }
        await store.createParticipant(participant)
        return secure(json({ token, participant: { id: participant.id, workshopId: participant.workshopId, pseudonym: participant.pseudonym }, workshop, contributions: [] }, 201))
      }
      if (parts[0] === 'api' && parts[1] === 'workshops' && (parts[3] === 'participant' || parts[3] === 'contributions')) {
        const token = bearer(request); const participant = token ? await store.participantByTokenHash(await sha256(token)) : null
        const workshop = await store.workshopByCode(decodeURIComponent(parts[2] ?? '').trim().toUpperCase())
        if (!participant || !workshop || participant.workshopId !== workshop.id) return secure(json({ error: 'Sesión inválida' }, 401))
        if (request.method === 'GET' && parts[3] === 'participant') {
          const items = await store.listParticipantContributions(workshop.id, participant.id)
          return secure(json({ participant: { id: participant.id, workshopId: participant.workshopId, pseudonym: participant.pseudonym }, workshop, contributions: items.map(item => ({ ...publicContribution(item), own: item.participantId === participant.id })) }))
        }
        if (request.method === 'POST' && parts[3] === 'contributions') {
          const input = await body(request); const category = String(input.category ?? '') as ContributionCategory; const content = String(input.content ?? '').trim()
          if (!categories.has(category) || !content || content.length > 1000) return secure(json({ error: 'Aporte inválido' }, 400))
          const item: ContributionRecord = { id: randomId(), workshopId: workshop.id, participantId: participant.id, pseudonym: participant.pseudonym, category, content, status: 'pending', createdAt: new Date().toISOString() }
          await store.createContribution(item)
          return secure(json({ ...publicContribution(item), own: true }, 201))
        }
      }
      if (parts[0] === 'api' && parts[1] === 'admin' && request.method === 'GET' && parts[2] === 'workshops' && parts[4] === 'contributions') {
        const token = bearer(request); const session = token ? await store.adminSession(await sha256(token)) : null; const workshop = await store.workshopByCode(decodeURIComponent(parts[3] ?? '').trim().toUpperCase())
        if (!session || session.expiresAt <= Date.now() || !workshop || session.workshopId !== workshop.id) return secure(json({ error: 'Sesión de organización inválida' }, 401))
        return secure(json({ workshop, contributions: (await store.listAdminContributions(workshop.id)).map(publicContribution) }))
      }
      if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'contributions' && request.method === 'PATCH') {
        const token = bearer(request); const session = token ? await store.adminSession(await sha256(token)) : null
        if (!session || session.expiresAt <= Date.now()) return secure(json({ error: 'Sesión de organización inválida' }, 401))
        const input = await body(request); const status = String(input.status ?? '')
        if (status !== 'approved' && status !== 'rejected') return secure(json({ error: 'Estado inválido' }, 400))
        return secure((await store.moderateContribution(parts[3], session.workshopId, status)) ? json({ ok: true }) : json({ error: 'Aporte no encontrado' }, 404))
      }
      if (parts[0] === 'api' && parts[1] === 'projection' && request.method === 'GET') {
        if (!env.PROJECTION_TOKEN || env.PROJECTION_TOKEN.length < 16) return secure(json({ error: 'Proyección no configurada' }, 503))
        if (!(await constantTimeEqual(url.searchParams.get('token') ?? '', env.PROJECTION_TOKEN))) return secure(json({ error: 'Capacidad de proyección inválida' }, 401))
        const workshop = await store.workshopByCode(decodeURIComponent(parts[2] ?? '').trim().toUpperCase())
        if (!workshop) return secure(json({ error: 'Taller no encontrado' }, 404))
        const counts = await store.contributionCounts(workshop.id)
        return secure(json({ workshop, contributions: (await store.listApprovedContributions(workshop.id)).map(publicContribution), counts: { approved: counts.approved } }))
      }
      return secure(json({ error: 'Not found' }, 404))
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : ''
      if (message === 'BODY_TOO_LARGE') return secure(json({ error: 'Cuerpo demasiado grande' }, 413))
      if (message === 'INVALID_JSON') return secure(json({ error: 'JSON inválido' }, 400))
      console.error('Worker request failed', cause)
      return secure(json({ error: 'Error interno' }, 500))
    }
  } }
}

export default { fetch(request: Request, env: Env) { return createWorker().fetch(request, env) } }
