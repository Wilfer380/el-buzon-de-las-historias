import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './App'

const renderAt = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
afterEach(cleanup)

describe('application routes', () => {
  it('presents the workshop identity and accessible entry points', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: 'El Buzón de las Historias' })).toBeInTheDocument()
    expect(screen.getByText('Cada voz construye nuestra historia')).toBeInTheDocument()
    expect(screen.getAllByText(/Aprender Sin Barreras/)).not.toHaveLength(0)
    expect(screen.getAllByText(/18 November 2026/)).not.toHaveLength(0)
    expect(screen.getByRole('link', { name: /Join a session/ })).toHaveAttribute('href', '/join/WORKSHOP')
  })

  it.each([
    ['/join/ABC123', 'Participant space', 'ABC123'],
    ['/admin/session-1', 'Organizer space', 'session-1'],
    ['/project/session-1', 'Projection space', 'session-1'],
  ])('keeps %s within its route boundary', (path, heading, identifier) => {
    renderAt(path)
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    expect(screen.getByText(identifier)).toBeInTheDocument()
  })

  it('provides a useful boundary for unknown routes', () => {
    renderAt('/missing')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
