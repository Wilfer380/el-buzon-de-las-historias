import { useCallback, useEffect, useState } from 'react'
import { apiEnvironment } from '../../env'
import type { ContributionCategory, WorkshopStage } from '../../domain/workshop'

type ProjectionContribution = { id: string; pseudonym: string | null; category: ContributionCategory; content: string; status: 'approved'; createdAt: string }
type ProjectionSnapshot = { workshop: { title: string; stage: WorkshopStage }; contributions: ProjectionContribution[]; counts: { approved: number } }
export interface ProjectionApi { load(code: string, token: string): Promise<ProjectionSnapshot> }
export const workerProjectionApi: ProjectionApi = {
  async load(code, token) {
    if (!apiEnvironment.apiUrl) throw new Error('La URL pública de la API no está configurada.')
    if (!token) throw new Error('Falta la capacidad de proyección.')
    const response = await fetch(`${apiEnvironment.apiUrl}/api/projection/${encodeURIComponent(code)}?token=${encodeURIComponent(token)}`)
    const value = await response.json() as ProjectionSnapshot & { error?: string }
    if (!response.ok) throw new Error(value.error ?? 'No se pudo cargar la proyección.')
    return value
  },
}
const labels: Record<ContributionCategory, string> = { experience: 'Experiencia', difficulty: 'Dificultad', hope: 'Esperanza', idea: 'Idea' }
export function ProjectionPage({ workshopCode, token, api = workerProjectionApi }: { workshopCode: string; token: string; api?: ProjectionApi }) {
  const [snapshot, setSnapshot] = useState<ProjectionSnapshot>()
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  const reload = useCallback(async () => {
    try { setSnapshot(await api.load(workshopCode, token)); setConnected(true); setError('') }
    catch (cause) { setConnected(false); setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la proyección.') }
  }, [api, token, workshopCode])
  useEffect(() => { void reload(); const interval = window.setInterval(() => { void reload() }, 3000); return () => window.clearInterval(interval) }, [reload])

  return <main className="projection-shell"><header><div><p className="eyebrow">El Buzón de las Historias · <span>{workshopCode}</span></p><h1>{snapshot?.workshop.title ?? 'Proyección del taller'}</h1></div><div className={`connection ${connected ? 'active' : 'error'}`} role="status">{connected ? 'Conexión activa · en vivo cada 3 segundos' : 'Conectando…'}</div></header>{error && <p role="alert" className="error">{error}</p>}<section className="projection-summary"><strong>{snapshot?.counts.approved ?? 0} {(snapshot?.counts.approved ?? 0) === 1 ? 'aporte aprobado' : 'aportes aprobados'}</strong><span>Solo se muestran voces moderadas.</span></section><section className="projection-grid" aria-label="Mural aprobado">{snapshot?.contributions.length ? snapshot.contributions.map(item => <article key={item.id}><p className="eyebrow">{labels[item.category]}</p><blockquote>{item.content}</blockquote>{item.pseudonym && <small>— {item.pseudonym}</small>}</article>) : <div className="projection-empty">Esperando aportes aprobados…</div>}</section></main>
}
