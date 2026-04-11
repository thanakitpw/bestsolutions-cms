import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SaveIndicator } from './save-indicator'

describe('SaveIndicator', () => {
  it('renders empty text when status is idle', () => {
    const { container } = render(<SaveIndicator status="idle" />)
    const el = container.querySelector('[aria-live="polite"]')
    expect(el?.textContent).toBe('')
  })

  it('renders saving text when status is saving', () => {
    render(<SaveIndicator status="saving" />)
    expect(screen.getByText('● Saving...')).toBeInTheDocument()
  })

  it('renders saved text when status is saved', () => {
    render(<SaveIndicator status="saved" />)
    expect(screen.getByText('✓ Saved')).toBeInTheDocument()
  })

  it('renders error text when status is error', () => {
    render(<SaveIndicator status="error" />)
    expect(screen.getByText('⚠ Save failed')).toBeInTheDocument()
  })

  it('has aria-live="polite" for accessibility', () => {
    const { container } = render(<SaveIndicator status="saving" />)
    const span = container.querySelector('[aria-live="polite"]')
    expect(span).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<SaveIndicator status="saving" className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('applies opacity-0 class when idle', () => {
    const { container } = render(<SaveIndicator status="idle" />)
    expect(container.firstChild).toHaveClass('opacity-0')
  })
})
