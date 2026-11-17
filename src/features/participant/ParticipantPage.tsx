import { useEffect, useRef, useState } from 'react'
import { contributionCategories, type ContributionCategory } from '../../domain/workshop'
import { createParticipantRepository, type ParticipantRepository, type ParticipantSnapshot } from './repository'

const categoryLabels: Record<ContributionCategory, string> = {
  experience: 'Experiencia', difficulty: 'Dificultad', hope: 'Esperanza', idea: 'Idea',
}
const stageLabels = {
  lobby: 'sala de espera', icebreaker: 'bienvenida', contributions: 'aportes',
  poll: 'votación', story: 'historia', complete: 'finalizado',
}

type Props = { sessionCode: string; repository?: ParticipantRepository }
const messageFor = (cause: unknown, fallback: string) => {
  const message = cause instanceof Error ? cause.message : ''
  if (message.includes('Worker API is unavailable')) return 'El backend no está configurado. Avisale a la persona facilitadora.'
  if (/fetch|network|offline/i.test(message)) return 'No hay conexión con el taller. Revisá tu conexión e intentá de nuevo.'
  return message || fallback
}

export function ParticipantPage({ sessionCode, repository }: Props) {
  const [repo, setRepo] = useState(repository)
  const [joining, setJoining] = useState(false)
  const joinLock = useRef(false)
  const [pseudonym, setPseudonym] = useState('')
  const [snapshot, setSnapshot] = useState<ParticipantSnapshot>()
  const [category, setCategory] = useState<ContributionCategory>()
  const [content, setContent] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [sending, setSending] = useState(false)
  const submitLock = useRef(false)
  const reloadVersion = useRef(0)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!snapshot || !repo) return
    let active = true
    const reload = () => {
      const request = ++reloadVersion.current
      repo.reload(snapshot.participant).then(next => { if (active && request === reloadVersion.current) setSnapshot(next) })
        .catch(() => { if (active && request === reloadVersion.current) setError('No pudimos actualizar el taller. Revisá tu conexión.') })
    }
    const unsubscribe = repo.subscribe(snapshot.participant, reload)
    return () => { active = false; reloadVersion.current++; unsubscribe() }
  }, [repo, snapshot?.participant.id])

  async function join() {
    if (joinLock.current) return
    joinLock.current = true; setJoining(true); setError('')
    try {
      const activeRepo = repo ?? createParticipantRepository()
      setRepo(activeRepo)
      setSnapshot(await activeRepo.join(sessionCode, pseudonym))
    } catch (cause) {
      setError(messageFor(cause, 'No pudimos entrar al taller.'))
    } finally { joinLock.current = false; setJoining(false) }
  }

  async function submit() {
    if (!repo || !snapshot || !category || !content.trim() || content.length > 1000 || submitLock.current) return
    submitLock.current = true; setSending(true); setError('')
    try {
      const contribution = await repo.submit(snapshot.participant, category, content)
      const request = ++reloadVersion.current
      try {
        const next = await repo.reload(snapshot.participant)
        if (request === reloadVersion.current) setSnapshot(next)
      } catch {
        if (request === reloadVersion.current) setSnapshot({ ...snapshot, contributions: [...snapshot.contributions.filter(item => item.id !== contribution.id), contribution] })
      }
      setSubmitted(true)
    } catch (cause) {
      setError(messageFor(cause, 'No pudimos enviar tu aporte.'))
    } finally { submitLock.current = false; setSending(false) }
  }

  if (!snapshot) return <main className="participant-shell"><section className="participant-card">
    <p className="eyebrow">Código <span>{sessionCode}</span></p><h1 aria-label="Espacio de participante">Entrá al taller</h1>
    <p>Tu participación es anónima. Usamos una sesión temporal para vincular tus aportes al taller. Un seudónimo es opcional y no compartas datos personales.</p>
    <label>Seudónimo (opcional)<input value={pseudonym} maxLength={80} onChange={event => setPseudonym(event.target.value)} /></label>
    {error && <p role="alert" className="error">{error}</p>}
    <button className="action" disabled={joining} onClick={join}>{joining ? 'Entrando…' : 'Entrar al taller'}</button>
  </section></main>

  const approved = snapshot.contributions.filter(item => item.status === 'approved')
  const own = snapshot.contributions.filter(item => item.own)
  return <main className="participant-shell">
    <header><span className="brand">El Buzón de las Historias</span><span>{snapshot.workshop.title}</span></header>
    <p className="stage" role="status" aria-live="polite">Etapa actual: {stageLabels[snapshot.workshop.stage]} · Conexión activa, actualización cada 3 segundos</p>
    <div className="participant-grid"><section className="participant-card">
      <p className="eyebrow">Tu sobre</p><h1>Compartí una voz</h1>
      {submitted ? <div role="status"><h2>Aporte recibido</h2><p>Quedó pendiente de moderación y todavía no es público.</p><button className="action" onClick={() => { setSubmitted(false); setCategory(undefined); setContent(''); setReviewing(false) }}>Enviar otro aporte</button></div> : <>
        <fieldset><legend>Elegí una categoría</legend><div className="category-list">{contributionCategories.map(value => <button type="button" aria-pressed={category === value} className={category === value ? 'selected' : ''} key={value} onClick={() => { setCategory(value); setReviewing(false) }}>{categoryLabels[value]}</button>)}</div></fieldset>
        <label>Tu aporte<textarea aria-describedby="contribution-counter" value={content} maxLength={1000} onChange={event => { setContent(event.target.value); setReviewing(false) }} /></label>
        <p id="contribution-counter" className="counter" role="status" aria-live="polite">{content.length}/1000 caracteres</p>
        {!reviewing ? <button className="action" disabled={!category || !content.trim() || content.length > 1000} onClick={() => setReviewing(true)}>Revisar aporte</button> : <div className="review"><strong>{category && categoryLabels[category]}</strong><p>{content}</p><button className="action" disabled={sending} onClick={submit}>{sending ? 'Enviando…' : 'Enviar aporte'}</button></div>}
      </>}
      {error && <p role="alert" className="error">{error}</p>}
      {own.length > 0 && <aside><h2>Tus envíos</h2>{own.map(item => <p key={item.id}><strong>{categoryLabels[item.category]}:</strong> {item.content} <small>({item.status === 'approved' ? 'aprobado' : item.status === 'rejected' ? 'rechazado' : 'pendiente'})</small></p>)}</aside>}
    </section><section className="participant-card"><p className="eyebrow">Comunidad</p><h2>Mural aprobado</h2>{approved.length ? <div className="mural">{approved.map(item => <article key={item.id}><strong>{categoryLabels[item.category]}</strong><p>{item.content}</p></article>)}</div> : <p>Todavía no hay aportes aprobados.</p>}</section></div>
  </main>
}
