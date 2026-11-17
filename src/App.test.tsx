import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import type { ParticipantRepository } from './features/participant/repository'

const participantRepository: ParticipantRepository = {
  join: vi.fn().mockResolvedValue({ participant: { id: 'p1', workshopId: 'w1', pseudonym: null, token: 'token', code: 'HISTORIA' }, workshop: { id: 'w1', title: 'Taller', stage: 'contributions' }, contributions: [] }),
  reload: vi.fn(), submit: vi.fn(), subscribe: vi.fn().mockReturnValue(() => undefined),
}
const renderAt = (path: string) => render(<MemoryRouter initialEntries={[path]}><App participantRepository={participantRepository} /></MemoryRouter>)
afterEach(cleanup)

describe('application routes', () => {
  it('makes participant entry and QR the prominent public actions', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: 'El Buzón de las Historias' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Participar' })).toHaveAttribute('href', '/join/HISTORIA')
    expect(screen.getByRole('img', { name: /qr para entrar como participante/i })).toHaveAttribute('src', '/qr-participantes.png')
    expect(screen.getByText(/escaneá el qr o abrí el enlace/i)).toBeInTheDocument()
    expect(screen.getAllByText(/solo organización/i)).toHaveLength(2)
  })

  it.each([
    ['/join/HISTORIA', 'Participant space'],
    ['/admin/HISTORIA', 'Organizer space'],
    ['/project/HISTORIA', 'Projection space'],
  ])('keeps %s within its route boundary', (path, heading) => {
    renderAt(path)
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  })

  it('provides a useful boundary for unknown routes', () => {
    renderAt('/missing')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
