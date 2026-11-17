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
  return <main className="shell"><header><span className="brand">El Buzón de las Historias</span><span className="host">Aprender Sin Barreras</span></header><section className="hero participant-first"><div><p className="eyebrow">Taller en Teams · 18 de noviembre de 2026</p><h1>El Buzón de las Historias</h1><p className="tagline">Cada voz construye nuestra historia</p><p className="lede">Entrá directamente y compartí tu voz de manera anónima.</p><Link className="action participant-action" to={route('/join/HISTORIA')}>Participar</Link></div><aside className="qr-card" aria-label="Entrada de participantes"><img src={route('/qr-participantes.png')} alt="QR para entrar como participante" /><div><strong>Participá desde tu celular</strong><p>Escaneá el QR o abrí el enlace para entrar sin escribir códigos.</p><Link to={route('/join/HISTORIA')}>Abrir enlace de participación</Link></div></aside></section><section className="organizer-tools" aria-label="Herramientas de organización"><h2>Herramientas privadas</h2><div><Link className="organizer-link" to={route('/admin/HISTORIA')}><span>Moderación</span><small>Solo organización</small></Link><Link className="organizer-link" to={route('/project/HISTORIA')}><span>Proyección</span><small>Solo organización</small></Link></div></section></main>
}
function Participant({ repository }: { repository?: ParticipantRepository }) { const { sessionCode = '' } = useParams(); return <><h2 className="route-contract">Participant space</h2><ParticipantPage sessionCode={sessionCode} repository={repository} /></> }
function Organizer() { const { sessionId = '' } = useParams(); return <><h2 className="route-contract">Organizer space</h2><AdminPage workshopCode={sessionId} /></> }
function Projection() { const { sessionId = '' } = useParams(); const [search] = useSearchParams(); return <><h2 className="route-contract">Projection space</h2><ProjectionPage workshopCode={sessionId} token={search.get('token') ?? apiEnvironment.projectionToken} /></> }
function NotFound() { return <Shell eyebrow="404" title="Page not found">La dirección no coincide con una ruta disponible del taller.</Shell> }

export function App({ participantRepository }: { participantRepository?: ParticipantRepository }) {
  const prefix = base || ''
  return <Routes><Route path={`${prefix}/`} element={<Landing />} /><Route path={`${prefix}/join/:sessionCode`} element={<Participant repository={participantRepository} />} /><Route path={`${prefix}/admin/:sessionId`} element={<Organizer />} /><Route path={`${prefix}/project/:sessionId`} element={<Projection />} /><Route path="*" element={<NotFound />} /></Routes>
}
