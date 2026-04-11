import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LocaleTabs } from './locale-tabs'
import type { JSONContent } from '@tiptap/react'
import type { SupportedLocale } from '@/types/tenant'

// Mock TiptapEditor เพื่อตัด dependency ออก
vi.mock('./tiptap-editor', () => ({
  TiptapEditor: ({
    content,
    onChange,
    placeholder,
  }: {
    content?: JSONContent
    onChange: (json: JSONContent) => void
    placeholder?: string
  }) => (
    <div
      data-testid="tiptap-editor"
      data-content={JSON.stringify(content)}
      data-placeholder={placeholder}
    >
      <button
        onClick={() => onChange({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'typed' }] }] })}
      >
        trigger-change
      </button>
    </div>
  ),
}))

describe('LocaleTabs', () => {
  const mockOnChange = vi.fn()
  const thContent: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Thai content' }] }] }
  const enContent: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'English content' }] }] }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders TH and EN tab triggers', () => {
    render(<LocaleTabs value={{}} onChange={mockOnChange} />)
    expect(screen.getByRole('tab', { name: /ภาษาไทย/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /english/i })).toBeInTheDocument()
  })

  it('shows TH tab as selected by default', () => {
    render(<LocaleTabs value={{}} onChange={mockOnChange} />)
    const thTab = screen.getByRole('tab', { name: /ภาษาไทย/i })
    expect(thTab).toHaveAttribute('aria-selected', 'true')
  })

  it('renders editor for active locale', () => {
    render(<LocaleTabs value={{ th: thContent }} onChange={mockOnChange} />)
    const editors = screen.getAllByTestId('tiptap-editor')
    // active tab (th) should be visible
    expect(editors.length).toBeGreaterThan(0)
  })

  it('calls onChange with correct locale and content when editor changes', () => {
    render(<LocaleTabs value={{ th: thContent }} onChange={mockOnChange} />)
    // Trigger change on the th editor (default active)
    const changeBtn = screen.getAllByText('trigger-change')[0]
    fireEvent.click(changeBtn)
    expect(mockOnChange).toHaveBeenCalledWith('th', expect.objectContaining({ type: 'doc' }))
  })

  it('passes correct content to each locale editor', () => {
    render(
      <LocaleTabs value={{ th: thContent, en: enContent }} onChange={mockOnChange} />
    )
    const editors = screen.getAllByTestId('tiptap-editor')
    // At least one editor should have th content
    const thEditor = editors.find(
      (el) => el.getAttribute('data-content') === JSON.stringify(thContent)
    )
    expect(thEditor).toBeTruthy()
  })

  it('passes placeholder to editor', () => {
    render(
      <LocaleTabs
        value={{}}
        onChange={mockOnChange}
        placeholder={{ th: 'Thai placeholder', en: 'English placeholder' }}
      />
    )
    // The active (TH) editor should have the thai placeholder
    const editors = screen.getAllByTestId('tiptap-editor')
    const thEditor = editors.find(
      (el) => el.getAttribute('data-placeholder') === 'Thai placeholder'
    )
    expect(thEditor).toBeTruthy()
  })

  it('switches to EN tab and calls onChange with en locale', () => {
    render(<LocaleTabs value={{ en: enContent }} onChange={mockOnChange} />)
    const enTab = screen.getByRole('tab', { name: /english/i })
    fireEvent.click(enTab)

    const changeBtns = screen.getAllByText('trigger-change')
    // Find the EN editor (last one after switch)
    fireEvent.click(changeBtns[changeBtns.length - 1])
    expect(mockOnChange).toHaveBeenCalledWith('en', expect.objectContaining({ type: 'doc' }))
  })
})
