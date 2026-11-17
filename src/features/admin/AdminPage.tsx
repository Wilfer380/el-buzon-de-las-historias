import { useCallback, useEffect, useState } from 'react'
import { apiEnvironment } from '../../env'
import type { ContributionCategory, ContributionStatus } from '../../domain/workshop'

export type AdminContribution = { id: string; pseudonym: string | null; category: ContributionCategory; content: string; status: ContributionStatus; createdAt: string }
export interface AdminApi {
  login(code: string, secret: string): Promise<{ token: string; expiresAt: number }>
  list(code: string, token: string): Promise<AdminContribution[]>
  moderate(token: string, id: string, status: 'approved' | 'rejected'): Promise<void>
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!apiEnvironment.apiUrl) throw new Error('La URL pública de la API no está configurada.')
  const response = await fetch(`${apiEnvironment.apiUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } })
  const value = await response.json() as T & { error?: string }
  if (!response.ok) throw new Error(value.error ?? 'La API no respondió correctamente.')
  return value
}

export const workerAdminApi: AdminApi = {
  login: (code, secret) => request('/api/admin/login', { method: 'POST', body: JSON.stringify({ workshopCode: code, secret }) }),
  async list(code, token) { const value = await request<{ contributions: AdminContribution[] }>(`/api/admin/workshops/${encodeURIComponent(code)}/contributions`, { headers: { Authorization: `Bearer ${token}` } }); return value.contributions },
  moderate: (token, id, status) => request(`/api/admin/contributions/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) }),
}

const labels: Record<ContributionCategory, string> = { experience: 'Experiencia', difficulty: 'Dificultad', hope: 'Esperanza', idea: 'Idea' }
export function AdminPage({ workshopCode, api = workerAdminApi }: { workshopCode: string; api?: AdminApi }) {
  const [secret, setSecret] = useState('')
  const [token, setToken] = useState('')
  const [items, setItems] = useState<AdminContribution[]>([])
  const [error, setError] = useState('')
  const [connection, setConnection] = useState<'connecting' | 'active' | 'error'>('connecting')
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async (activeToken: string) => {
    try { setItems(await api.list(workshopCode, activeToken)); setConnection('active'); setError('') }
    catch (cause) { setConnection('error'); setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la moderación.') }
  }, [api, workshopCode])

  useEffect(() => {
    if (!token) return
    const interval = window.setInterval(() => { void reload(token) }, 3000)
    return () => window.clearInterval(interval)
  }, [reload, token])

  async function login() {
    if (!secret || busy) return
    setBusy(true); setError('')
    try { const session = await api.login(workshopCode, secret); setSecret(''); setToken(session.token); await reload(session.token) }
    catch (cause) { setConnection('error'); setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.') }
    finally { setBusy(false) }
  }
  async function moderate(id: string, status: 'approved' | 'rejected') {
    if (!token || busy) return
    setBusy(true); setError('')
    try { await api.moderate(token, id, status); await reload(token) }
    catch (cause) { setConnection('error'); setError(cause instanceof Error ? cause.message : 'No se pudo moderar el aporte.') }
    finally { setBusy(false) }
  }

  if (!token) return <main className="participant-shell"><section className="participant-card admin-login"><p className="eyebrow">Organización · <span>{workshopCode}</span></p><h1>Moderación</h1><p>Ingresá el secreto de organización. Nunca se guarda en el navegador ni se incluye en la aplicación.</p><label>Secreto de organización<input type="password" autoComplete="current-password" value={secret} onChange={event => setSecret(event.target.value)} /></label>{error && <p className="error" role="alert">{error}</p>}<button className="action" disabled={!secret || busy} onClick={login}>{busy ? 'Ingresando…' : 'Iniciar sesión'}</button></section></main>

  return <main className="participant-shell admin-shell"><header><span className="brand">El Buzón de las Historias</span><strong>Moderación · {workshopCode}</strong></header><p className={`connection ${connection}`} role="status">{connection === 'active' ? 'Conexión activa · actualización cada 3 segundos' : connection === 'error' ? 'Error de conexión' : 'Conectando…'}</p>{error && <p className="error" role="alert">{error}</p>}<section className="participant-card"><h1>Moderación</h1><p>{items.filter(item => item.status === 'pending').length} pendientes · {items.filter(item => item.status === 'approved').length} aprobados</p><div className="moderation-list">{items.length === 0 ? <p>No hay aportes todavía.</p> : items.map(item => <article key={item.id} className={`moderation-item ${item.status}`}><p className="eyebrow">{labels[item.category]} · {item.status === 'pending' ? 'Pendiente' : item.status === 'approved' ? 'Aprobado' : 'Rechazado'}</p><p>{item.content}</p>{item.pseudonym && <small>Seudónimo: {item.pseudonym}</small>}{item.status === 'pending' && <div className="moderation-actions"><button className="action approve" disabled={busy} onClick={() => void moderate(item.id, 'approved')}>Aprobar</button><button className="action reject" disabled={busy} onClick={() => void moderate(item.id, 'rejected')}>Rechazar</button></div>}</article>)}</div></section></main>
}
