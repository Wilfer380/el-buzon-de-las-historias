import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminPage, type AdminApi } from './AdminPage'

const contribution = { id: 'c1', pseudonym: null, category: 'hope' as const, content: 'Un futuro accesible', status: 'pending' as const, createdAt: '2026-01-01' }
const api = (): AdminApi => ({
  login: vi.fn().mockResolvedValue({ token: 'session', expiresAt: Date.now() + 1000 }),
  list: vi.fn().mockResolvedValue([contribution]),
  moderate: vi.fn().mockResolvedValue(undefined),
})
afterEach(() => { cleanup(); window.history.replaceState(null, '', '/') })

describe('organizer moderation', () => {
  it('exchanges the URL fragment automatically and clears it immediately', async () => {
    const capability = crypto.randomUUID()
    window.history.replaceState(null, '', `/admin/HISTORIA#${capability}`)
    const client = api()
    render(<AdminPage workshopCode="HISTORIA" api={client} />)
    await waitFor(() => expect(client.login).toHaveBeenCalledWith('HISTORIA', capability))
    expect(window.location.hash).toBe('')
    expect(await screen.findByText('Un futuro accesible')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /aprobar/i }))
    await waitFor(() => expect(client.moderate).toHaveBeenCalledWith('session', 'c1', 'approved'))
  })

  it('asks for the private organizer link when no fragment is present', () => {
    render(<AdminPage workshopCode="HISTORIA" api={api()} />)
    expect(screen.getByText(/abrí tu enlace privado de organización/i)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/secreto/i)).not.toBeInTheDocument()
  })
})
