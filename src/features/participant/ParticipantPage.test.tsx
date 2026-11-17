import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ParticipantPage } from './ParticipantPage'
import type { ParticipantRepository, ParticipantSnapshot } from './repository'

const snapshot: ParticipantSnapshot = {
  participant: { id: 'p1', workshopId: 'w1', pseudonym: 'Luna', token: 'participant-token', code: 'ABC123' },
  workshop: { id: 'w1', title: 'Taller', stage: 'contributions' },
  contributions: [
    { id: 'a1', category: 'hope', content: 'Un futuro accesible', status: 'approved', own: false },
    { id: 'r1', category: 'difficulty', content: 'Una entrada estrecha', status: 'rejected', own: true },
  ],
}

function repository(overrides: Partial<ParticipantRepository> = {}): ParticipantRepository {
  return {
    join: vi.fn().mockResolvedValue(snapshot),
    submit: vi.fn().mockResolvedValue({ id: 'mine', category: 'idea', content: 'Rampas para todos', status: 'pending', own: true }),
    reload: vi.fn().mockResolvedValue(snapshot),
    subscribe: vi.fn().mockReturnValue(() => undefined),
    ...overrides,
  }
}

afterEach(cleanup)

describe('participant flow', () => {
  it('joins anonymously, selects a category, and confirms a pending submission', async () => {
    const pending = { id: 'mine', category: 'idea' as const, content: 'Rampas para todos', status: 'pending' as const, own: true }
    const repo = repository({ reload: vi.fn().mockResolvedValue({ ...snapshot, contributions: [...snapshot.contributions, pending] }) })
    render(<ParticipantPage sessionCode="ABC123" repository={repo} />)
    expect(screen.getByText(/participación es anónima/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/seudónimo/i), { target: { value: 'Luna' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar al taller/i }))
    await screen.findByText(/Etapa actual: aportes/i)
    expect(repo.join).toHaveBeenCalledWith('ABC123', 'Luna')

    fireEvent.click(screen.getByRole('button', { name: /idea/i }))
    fireEvent.change(screen.getByLabelText(/tu aporte/i), { target: { value: 'Rampas para todos' } })
    fireEvent.click(screen.getByRole('button', { name: /revisar aporte/i }))
    fireEvent.click(screen.getByRole('button', { name: /enviar aporte/i }))

    await screen.findByText(/pendiente de moderación/i)
    expect(screen.getByText(/todavía no es público/i)).toBeInTheDocument()
    expect(repo.submit).toHaveBeenCalledWith(snapshot.participant, 'idea', 'Rampas para todos')
    expect(screen.getByText(/Rampas para todos/)).toHaveTextContent('pendiente')
  })

  it('locks Join while enrollment is pending', async () => {
    let finish!: (value: ParticipantSnapshot) => void
    const repo = repository({ join: vi.fn().mockReturnValue(new Promise(resolve => { finish = resolve })) })
    render(<ParticipantPage sessionCode="ABC123" repository={repo} />)
    const join = screen.getByRole('button', { name: /entrar al taller/i })
    fireEvent.click(join)
    fireEvent.click(join)
    expect(repo.join).toHaveBeenCalledTimes(1)
    expect(join).toBeDisabled()
    finish(snapshot)
    await screen.findByText(/Etapa actual: aportes/i)
  })

  it('shows backend errors without implying that a join succeeded', async () => {
    const repo = repository({ join: vi.fn().mockRejectedValue(new Error('Sin conexión con el taller')) })
    render(<ParticipantPage sessionCode="ABC123" repository={repo} />)
    fireEvent.click(screen.getByRole('button', { name: /entrar al taller/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión con el taller')
    expect(screen.queryByText(/Etapa actual/i)).not.toBeInTheDocument()
  })

  it('renders only approved contributions on the public mural', async () => {
    const repo = repository()
    render(<ParticipantPage sessionCode="ABC123" repository={repo} />)
    fireEvent.click(screen.getByRole('button', { name: /entrar al taller/i }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /mural aprobado/i })).toBeInTheDocument())
    expect(screen.getByText('Un futuro accesible')).toBeInTheDocument()
    expect(screen.getByText(/Una entrada estrecha/)).toHaveTextContent('rechazado')
    expect(screen.queryByText('Rampas para todos')).not.toBeInTheDocument()
  })
})
