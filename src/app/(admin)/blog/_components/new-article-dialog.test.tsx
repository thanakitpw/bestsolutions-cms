import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NewArticleDialog } from './new-article-dialog'

// ── mocks ──────────────────────────────────────────────────────────────────
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

// ── helpers ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'cat-1', name: { th: 'เทรนด์การออกแบบ', en: 'Design Trends' } },
  { id: 'cat-2', name: { en: 'Tips' } },
]

function openDialog() {
  const btn = screen.getByRole('button', { name: /new article/i })
  fireEvent.click(btn)
}

// ══════════════════════════════════════════════════════════════════════════
describe('NewArticleDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "New Article" trigger button', () => {
    render(<NewArticleDialog categories={CATEGORIES} />)
    expect(screen.getByRole('button', { name: /new article/i })).toBeInTheDocument()
  })

  it('opens dialog when button is clicked', () => {
    render(<NewArticleDialog categories={CATEGORIES} />)
    openDialog()
    expect(screen.getByText('สร้างบทความใหม่')).toBeInTheDocument()
  })

  it('auto-generates slug from EN title', () => {
    render(<NewArticleDialog categories={CATEGORIES} />)
    openDialog()

    // Switch to EN tab
    fireEvent.click(screen.getByRole('tab', { name: /english/i }))

    const titleInput = screen.getByPlaceholderText('Article title in English')
    fireEvent.change(titleInput, { target: { value: 'My New Article' } })

    const slugInput = screen.getByPlaceholderText('article-title')
    expect((slugInput as HTMLInputElement).value).toBe('my-new-article')
  })

  it('does not overwrite manually edited slug when title changes', () => {
    render(<NewArticleDialog categories={CATEGORIES} />)
    openDialog()

    // Switch to EN tab and type title
    fireEvent.click(screen.getByRole('tab', { name: /english/i }))
    fireEvent.change(screen.getByPlaceholderText('Article title in English'), {
      target: { value: 'First Article' },
    })

    // Manually edit slug
    const slugInput = screen.getByPlaceholderText('article-title')
    fireEvent.change(slugInput, { target: { value: 'custom-slug' } })

    // Change title again
    fireEvent.change(screen.getByPlaceholderText('Article title in English'), {
      target: { value: 'Second Article' },
    })

    // Slug should remain as manually entered
    expect((slugInput as HTMLInputElement).value).toBe('custom-slug')
  })

  it('shows toast error when submitting with no title', async () => {
    const { toast } = await import('sonner')
    render(<NewArticleDialog categories={CATEGORIES} />)
    openDialog()

    // Click submit without filling any title
    const submitBtn = screen.getByRole('button', { name: /สร้างบทความ/i })
    fireEvent.click(submitBtn)

    expect(toast.error).toHaveBeenCalledWith('กรุณากรอกชื่อบทความอย่างน้อย 1 ภาษา')
  })

  it('shows toast error when submitting with no slug', async () => {
    const { toast } = await import('sonner')
    render(<NewArticleDialog categories={CATEGORIES} />)
    openDialog()

    // Fill title TH but no slug
    fireEvent.change(screen.getByPlaceholderText('ชื่อบทความภาษาไทย'), {
      target: { value: 'บทความทดสอบ' },
    })

    const submitBtn = screen.getByRole('button', { name: /สร้างบทความ/i })
    fireEvent.click(submitBtn)

    expect(toast.error).toHaveBeenCalledWith('กรุณากรอก slug')
  })

  it('submits form and redirects on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'art-new-1', slug: 'my-article', status: 'draft' }),
    })

    const { toast } = await import('sonner')
    render(<NewArticleDialog categories={CATEGORIES} />)
    openDialog()

    // Fill title TH
    fireEvent.change(screen.getByPlaceholderText('ชื่อบทความภาษาไทย'), {
      target: { value: 'บทความทดสอบ' },
    })

    // Fill slug manually
    const slugInput = screen.getByPlaceholderText('article-title')
    fireEvent.change(slugInput, { target: { value: 'my-article' } })

    const submitBtn = screen.getByRole('button', { name: /สร้างบทความ/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/articles',
        expect.objectContaining({ method: 'POST' })
      )
      expect(toast.success).toHaveBeenCalledWith('สร้างบทความสำเร็จ')
      expect(mockPush).toHaveBeenCalledWith('/blog/art-new-1')
    })
  })

  it('shows SLUG_CONFLICT toast on 409', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ code: 'SLUG_CONFLICT' }),
    })

    const { toast } = await import('sonner')
    render(<NewArticleDialog categories={CATEGORIES} />)
    openDialog()

    fireEvent.change(screen.getByPlaceholderText('ชื่อบทความภาษาไทย'), {
      target: { value: 'ทดสอบ' },
    })
    fireEvent.change(screen.getByPlaceholderText('article-title'), {
      target: { value: 'existing-slug' },
    })

    fireEvent.click(screen.getByRole('button', { name: /สร้างบทความ/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Slug นี้ถูกใช้ไปแล้ว กรุณาเปลี่ยน slug')
    })
  })

  it('shows generic error toast on other non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ code: 'SERVER_ERROR' }),
    })

    const { toast } = await import('sonner')
    render(<NewArticleDialog categories={CATEGORIES} />)
    openDialog()

    fireEvent.change(screen.getByPlaceholderText('ชื่อบทความภาษาไทย'), {
      target: { value: 'ทดสอบ' },
    })
    fireEvent.change(screen.getByPlaceholderText('article-title'), {
      target: { value: 'my-slug' },
    })

    fireEvent.click(screen.getByRole('button', { name: /สร้างบทความ/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('เกิดข้อผิดพลาด กรุณาลองใหม่')
    })
  })
})
