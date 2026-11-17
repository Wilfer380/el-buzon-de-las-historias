import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminPage, type AdminApi } from './AdminPage'

const contribution = { id: 'c1', pseudonym: 'Luna', category: 'hope' as const, content: 'Un futuro accesible', status: 'pending' as const, createdAt: '2026-01-01' }
afterEach(cleanup)

describe('organizer moderation', () => {
  it('logs in, lists pending content, and approves it', async () => {
    const api: AdminApi = {
      login: vi.fn().mockResolvedValue({ token: 'session', expiresAt: Date.now() + 1000 }),
      list: vi.fn().mockResolvedValue([contribution]),
      moderate: vi.fn().mockResolvedValue(undefined),
    }
    render(<AdminPage workshopCode="HISTORIA" api={api} />)
    fireEvent.change(screen.getByLabelText(/secreto de organización/i), { target: { value: 'private-secret' } })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText('Un futuro accesible')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /aprobar/i }))
    await waitFor(() => expect(api.moderate).toHaveBeenCalledWith('session', 'c1', 'approved'))
    expect(screen.getByText(/conexión activa/i)).toBeInTheDocument()
  })
})
