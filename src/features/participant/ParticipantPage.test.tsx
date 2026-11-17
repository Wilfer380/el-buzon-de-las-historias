import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ParticipantPage } from './ParticipantPage'
import type { ParticipantRepository, ParticipantSnapshot } from './repository'

const snapshot: ParticipantSnapshot = {
  participant: { id: 'p1', workshopId: 'w1', pseudonym: null, token: 'participant-token', code: 'HISTORIA' },
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
  it('enters anonymously on mount and lands directly on contribution envelopes', async () => {
    const repo = repository()
    render(<ParticipantPage sessionCode="HISTORIA" repository={repo} />)
    expect(screen.getByText(/preparando tu buzón/i)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /compartí una voz/i })).toBeInTheDocument()
    expect(repo.join).toHaveBeenCalledWith('HISTORIA', '')
    expect(screen.queryByLabelText(/seudónimo/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /entrar al taller/i })).not.toBeInTheDocument()
  })

  it('offers a clear retry after automatic enrollment fails', async () => {
    const join = vi.fn().mockRejectedValueOnce(new Error('Sin conexión con el taller')).mockResolvedValueOnce(snapshot)
    const repo = repository({ join })
    render(<ParticipantPage sessionCode="HISTORIA" repository={repo} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión con el taller')
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(await screen.findByRole('heading', { name: /compartí una voz/i })).toBeInTheDocument()
    expect(join).toHaveBeenCalledTimes(2)
  })

  it('selects a category and confirms a pending submission', async () => {
    const pending = { id: 'mine', category: 'idea' as const, content: 'Rampas para todos', status: 'pending' as const, own: true }
    const repo = repository({ reload: vi.fn().mockResolvedValue({ ...snapshot, contributions: [...snapshot.contributions, pending] }) })
    render(<ParticipantPage sessionCode="HISTORIA" repository={repo} />)
    await screen.findByRole('heading', { name: /compartí una voz/i })
    fireEvent.click(screen.getByRole('button', { name: /idea/i }))
    fireEvent.change(screen.getByLabelText(/tu aporte/i), { target: { value: 'Rampas para todos' } })
    fireEvent.click(screen.getByRole('button', { name: /revisar aporte/i }))
    fireEvent.click(screen.getByRole('button', { name: /enviar aporte/i }))
    await screen.findByText(/pendiente de moderación/i)
    expect(repo.submit).toHaveBeenCalledWith(snapshot.participant, 'idea', 'Rampas para todos')
  })

  it('renders only approved contributions on the public mural', async () => {
    render(<ParticipantPage sessionCode="HISTORIA" repository={repository()} />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /mural aprobado/i })).toBeInTheDocument())
    expect(screen.getByText('Un futuro accesible')).toBeInTheDocument()
    expect(screen.getByText(/Una entrada estrecha/)).toHaveTextContent('rechazado')
  })
})
