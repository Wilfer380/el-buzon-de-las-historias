import { Link, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import { apiEnvironment } from './env'
import { AdminPage } from './features/admin/AdminPage'
import { ParticipantPage } from './features/participant/ParticipantPage'
import type { ParticipantRepository } from './features/participant/repository'
import { ProjectionPage } from './features/projection/ProjectionPage'

const base = import.meta.env.BASE_URL.replace(/\/$/, '')
const route = (path: string) => `${base}${path}` || '/'
function Shell({ eyebrow, title, identifier, children }: { eyebrow: string; title: string; identifier?: string; children: React.ReactNode }) {
  return <main className="shell"><header><Link className="brand" to={route('/')}>El Buzón de las Historias</Link></header><section className="panel"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{identifier && <p className="identifier">Sesión: <strong>{identifier}</strong></p>}<p>{children}</p><Link className="action secondary" to={route('/')}>Volver al inicio</Link></section></main>
}
function Landing() {
  return <main className="shell"><header><span className="brand">El Buzón de las Historias</span><span className="host">Aprender Sin Barreras</span></header><section className="hero"><div><p className="eyebrow">Teams workshop · 18 November 2026</p><h1>El Buzón de las Historias</h1><p className="tagline">Cada voz construye nuestra historia</p><p className="lede">Un espacio compartido y accesible para aportar, moderar y proyectar las voces aprobadas del taller.</p><nav aria-label="Entradas al taller"><Link className="action" to={route('/join/WORKSHOP')}>Join a session</Link><Link className="action secondary" to={route('/admin/HISTORIA')}>Organizar</Link><Link className="action secondary" to={route('/project/HISTORIA')}>Proyectar</Link></nav></div><aside aria-label="Detalles del taller"><strong>Detalles del taller</strong><p>Online en Microsoft Teams</p><p>18 November 2026</p></aside></section></main>
}
function Participant({ repository }: { repository?: ParticipantRepository }) { const { sessionCode = '' } = useParams(); return <><h2 className="route-contract">Participant space</h2><ParticipantPage sessionCode={sessionCode} repository={repository} /></> }
function Organizer() { const { sessionId = '' } = useParams(); return <><h2 className="route-contract">Organizer space</h2><AdminPage workshopCode={sessionId} /></> }
function Projection() { const { sessionId = '' } = useParams(); const [search] = useSearchParams(); return <><h2 className="route-contract">Projection space</h2><ProjectionPage workshopCode={sessionId} token={search.get('token') ?? apiEnvironment.projectionToken} /></> }
function NotFound() { return <Shell eyebrow="404" title="Page not found">La dirección no coincide con una ruta disponible del taller.</Shell> }

export function App({ participantRepository }: { participantRepository?: ParticipantRepository }) {
  const prefix = base || ''
  return <Routes><Route path={`${prefix}/`} element={<Landing />} /><Route path={`${prefix}/join/:sessionCode`} element={<Participant repository={participantRepository} />} /><Route path={`${prefix}/admin/:sessionId`} element={<Organizer />} /><Route path={`${prefix}/project/:sessionId`} element={<Projection />} /><Route path="*" element={<NotFound />} /></Routes>
}
