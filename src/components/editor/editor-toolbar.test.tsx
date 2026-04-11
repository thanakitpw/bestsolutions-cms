import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import type { Editor } from '@tiptap/react'
import { EditorToolbar } from './editor-toolbar'

function makeMockEditor(overrides: Partial<Editor> = {}): Editor {
  return {
    isActive: vi.fn().mockReturnValue(false),
    getAttributes: vi.fn().mockReturnValue({}),
    chain: vi.fn().mockReturnValue({
      focus: vi.fn().mockReturnValue({
        toggleBold: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleItalic: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleUnderline: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleHeading: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleBulletList: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleOrderedList: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleBlockquote: vi.fn().mockReturnValue({ run: vi.fn() }),
        setHorizontalRule: vi.fn().mockReturnValue({ run: vi.fn() }),
        extendMarkRange: vi.fn().mockReturnValue({
          setLink: vi.fn().mockReturnValue({ run: vi.fn() }),
          unsetLink: vi.fn().mockReturnValue({ run: vi.fn() }),
        }),
        unsetLink: vi.fn().mockReturnValue({ run: vi.fn() }),
      }),
    }),
    ...overrides,
  } as unknown as Editor
}

describe('EditorToolbar — image button', () => {
  it('calls onInsertImage when image button is clicked', () => {
    const onInsertImage = vi.fn()
    render(<EditorToolbar editor={makeMockEditor()} onInsertImage={onInsertImage} />)

    const imageBtn = screen.getByRole('button', { name: 'Insert Image' })
    fireEvent.click(imageBtn)
    expect(onInsertImage).toHaveBeenCalledTimes(1)
  })

  it('image button is disabled when onInsertImage is not provided', () => {
    render(<EditorToolbar editor={makeMockEditor()} />)
    const imageBtn = screen.getByRole('button', { name: 'Insert Image' })
    expect(imageBtn).toBeDisabled()
  })

  it('image button is enabled when onInsertImage is provided', () => {
    render(<EditorToolbar editor={makeMockEditor()} onInsertImage={vi.fn()} />)
    const imageBtn = screen.getByRole('button', { name: 'Insert Image' })
    expect(imageBtn).not.toBeDisabled()
  })
})

describe('EditorToolbar — formatting buttons', () => {
  it('renders bold button', () => {
    render(<EditorToolbar editor={makeMockEditor()} />)
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument()
  })

  it('renders italic button', () => {
    render(<EditorToolbar editor={makeMockEditor()} />)
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument()
  })

  it('renders divider button', () => {
    render(<EditorToolbar editor={makeMockEditor()} />)
    expect(screen.getByRole('button', { name: 'Divider' })).toBeInTheDocument()
  })
})
