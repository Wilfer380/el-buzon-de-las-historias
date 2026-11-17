import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProjectionPage, type ProjectionApi } from './ProjectionPage'

afterEach(cleanup)
describe('projection view', () => {
  it('shows approved content, aggregates, and connection state', async () => {
    const api: ProjectionApi = { load: vi.fn().mockResolvedValue({ workshop: { title: 'Taller', stage: 'contributions' }, contributions: [{ id: 'a1', pseudonym: null, category: 'idea', content: 'Rampas para todos', status: 'approved', createdAt: '2026-01-01' }], counts: { approved: 1, pending: 2, rejected: 0 } }) }
    render(<ProjectionPage workshopCode="HISTORIA" token="capability" api={api} />)
    expect(await screen.findByText('Rampas para todos')).toBeInTheDocument()
    expect(screen.getByText(/1 aporte aprobado/i)).toBeInTheDocument()
    expect(screen.getByText(/conexión activa/i)).toBeInTheDocument()
    expect(screen.queryByText(/pendientes/i)).not.toBeInTheDocument()
  })
})
