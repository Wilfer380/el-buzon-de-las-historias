import { Link, Route, Routes, useParams } from 'react-router-dom'

function Shell({ eyebrow, title, identifier, children }: { eyebrow: string; title: string; identifier?: string; children: React.ReactNode }) {
  return <main className="shell"><header><Link className="brand" to="/">El Buzón de las Historias</Link></header><section className="panel"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{identifier && <p className="identifier">Session: <strong>{identifier}</strong></p>}<p>{children}</p><Link className="action secondary" to="/">Return home</Link></section></main>
}

function Landing() {
  return <main className="shell"><header><span className="brand">El Buzón de las Historias</span><span className="host">Aprender Sin Barreras</span></header><section className="hero"><div><p className="eyebrow">Teams workshop · 18 November 2026</p><h1>El Buzón de las Historias</h1><p className="tagline">Cada voz construye nuestra historia</p><p className="lede">A shared workshop space prepared by Aprender Sin Barreras. Session participation and facilitation tools will arrive in later releases.</p><nav aria-label="Workshop entry points"><Link className="action" to="/join/WORKSHOP">Join a session</Link><Link className="action secondary" to="/admin/WORKSHOP">Organizer preview</Link><Link className="action secondary" to="/project/WORKSHOP">Projection preview</Link></nav></div><aside aria-label="Workshop details"><strong>Workshop details</strong><p>Online in Microsoft Teams</p><p>18 November 2026</p></aside></section></main>
}

function Participant() { const { sessionCode } = useParams(); return <Shell eyebrow="Workshop participant" title="Participant space" identifier={sessionCode}>This route will become the place to contribute during a guided session. Submission tools are not available yet.</Shell> }
function Organizer() { const { sessionId } = useParams(); return <Shell eyebrow="Workshop facilitation" title="Organizer space" identifier={sessionId}>This route is reserved for future facilitation controls. Authentication and session management are not implemented.</Shell> }
function Projection() { const { sessionId } = useParams(); return <Shell eyebrow="Shared workshop display" title="Projection space" identifier={sessionId}>This route will support a room display in a future release. Realtime stories are not available yet.</Shell> }
function NotFound() { return <Shell eyebrow="404" title="Page not found">The address does not match an available workshop route.</Shell> }

export function App() { return <Routes><Route path="/" element={<Landing />} /><Route path="/join/:sessionCode" element={<Participant />} /><Route path="/admin/:sessionId" element={<Organizer />} /><Route path="/project/:sessionId" element={<Projection />} /><Route path="*" element={<NotFound />} /></Routes> }
