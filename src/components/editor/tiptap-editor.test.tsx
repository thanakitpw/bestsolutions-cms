import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TiptapEditor } from './tiptap-editor'
import type { JSONContent } from '@tiptap/react'

// Mock Tiptap — happy-dom ไม่รองรับ browser APIs ที่ Tiptap ต้องการ
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => null),
  EditorContent: ({ className }: { className?: string }) => (
    <div data-testid="editor-content" className={className} />
  ),
}))

vi.mock('./editor-toolbar', () => ({
  EditorToolbar: () => <div data-testid="editor-toolbar" />,
}))

describe('TiptapEditor', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders editor-content area', () => {
    render(<TiptapEditor onChange={mockOnChange} />)
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })

  it('does not render toolbar when editable=false', () => {
    render(<TiptapEditor onChange={mockOnChange} editable={false} />)
    expect(screen.queryByTestId('editor-toolbar')).not.toBeInTheDocument()
  })

  it('does not render toolbar when editor is null (loading)', () => {
    render(<TiptapEditor onChange={mockOnChange} />)
    // useEditor returns null in mock, so toolbar should not render
    expect(screen.queryByTestId('editor-toolbar')).not.toBeInTheDocument()
  })

  it('accepts content prop without crashing', () => {
    const content: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] }
    render(<TiptapEditor content={content} onChange={mockOnChange} />)
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })

  it('accepts className prop', () => {
    const { container } = render(
      <TiptapEditor onChange={mockOnChange} className="test-class" />
    )
    expect(container.firstChild).toHaveClass('test-class')
  })

  it('calls useEditor with immediatelyRender: false for SSR safety', async () => {
    const { useEditor } = await import('@tiptap/react')
    render(<TiptapEditor onChange={mockOnChange} />)
    expect(useEditor).toHaveBeenCalledWith(
      expect.objectContaining({ immediatelyRender: false })
    )
  })

  it('calls useEditor with correct editable value', async () => {
    const { useEditor } = await import('@tiptap/react')
    render(<TiptapEditor onChange={mockOnChange} editable={false} />)
    expect(useEditor).toHaveBeenCalledWith(
      expect.objectContaining({ editable: false })
    )
  })
})
