import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ArticleEditor } from './article-editor'

// ── mocks ──────────────────────────────────────────────────────────────────

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockToastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

const mockTriggerSave = vi.fn()
vi.mock('@/components/editor', () => ({
  LocaleTabs: ({ onChange }: { onChange: (locale: string, json: unknown) => void }) => (
    <div data-testid="locale-tabs">
      <button onClick={() => onChange('th', { type: 'doc' })}>change-content</button>
    </div>
  ),
  SaveIndicator: ({ status }: { status: string }) => (
    <div data-testid="save-indicator">{status}</div>
  ),
  useAutoSave: ({ onSave }: { onSave: () => Promise<void> }) => ({
    saveStatus: 'idle' as const,
    triggerSave: () => {
      mockTriggerSave()
      void onSave().catch(() => {})
    },
    saveNow: vi.fn(),
  }),
  MediaPickerModal: ({
    open,
    onClose,
    onSelect,
  }: {
    open: boolean
    onClose: () => void
    onSelect: (item: { public_url: string; id: string }) => void
  }) =>
    open ? (
      <div data-testid="media-picker-modal">
        <button onClick={() => onSelect({ public_url: 'https://example.com/img.jpg', id: 'media-1' })}>
          select-media
        </button>
        <button onClick={onClose}>close-picker</button>
      </div>
    ) : null,
}))

// ── fixtures ───────────────────────────────────────────────────────────────

const mockArticle = {
  id: 'art-1',
  title: { th: 'บทความทดสอบ', en: 'Test Article' },
  slug: 'test-article',
  excerpt: { th: 'บทสรุป', en: 'Summary' },
  content: { th: null, en: null },
  category_id: null,
  cover_image: null,
  status: 'draft' as const,
  published_at: null,
  seo_title: { th: 'SEO Title TH', en: 'SEO Title EN' },
  seo_description: { th: 'SEO Desc TH', en: 'SEO Desc EN' },
  seo_keywords: { th: ['คีย์เวิร์ด'], en: ['keyword'] },
}

const mockCategories = [{ id: 'cat-1', name: { th: 'หมวดหมู่ 1', en: 'Category 1' } }]

// ── tests ──────────────────────────────────────────────────────────────────

describe('ArticleEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockArticle }),
    } as Response)
  })

  it('renders article title in breadcrumb', () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    expect(screen.getByText('บทความทดสอบ')).toBeDefined()
  })

  it('renders SaveIndicator', () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    expect(screen.getByTestId('save-indicator')).toBeDefined()
  })

  it('renders status badge (draft)', () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    // Badge shows status text — at least one occurrence
    const badges = screen.getAllByText('draft')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('renders status badge (published) when article is published', () => {
    const published = {
      ...mockArticle,
      status: 'published' as const,
      published_at: '2026-04-01T00:00:00Z',
    }
    render(<ArticleEditor article={published} categories={mockCategories} />)
    const badges = screen.getAllByText('published')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('renders "เผยแพร่บทความ" button when status is draft', () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    expect(screen.getByRole('button', { name: /เผยแพร่บทความ/i })).toBeDefined()
  })

  it('renders "ลบบทความ" button for all statuses', () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    expect(screen.getByRole('button', { name: /ลบบทความ/i })).toBeDefined()
  })

  it('renders "ยกเลิกเผยแพร่" and "เก็บถาวร" buttons when status is published', () => {
    const published = { ...mockArticle, status: 'published' as const, published_at: '2026-04-01T00:00:00Z' }
    render(<ArticleEditor article={published} categories={mockCategories} />)
    expect(screen.getByRole('button', { name: /ยกเลิกเผยแพร่/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /เก็บถาวร/i })).toBeDefined()
  })

  it('renders "เผยแพร่อีกครั้ง" button when status is archived', () => {
    const archived = { ...mockArticle, status: 'archived' as const }
    render(<ArticleEditor article={archived} categories={mockCategories} />)
    expect(screen.getByRole('button', { name: /เผยแพร่อีกครั้ง/i })).toBeDefined()
  })

  it('renders locale tabs for rich text content', () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    expect(screen.getByTestId('locale-tabs')).toBeDefined()
  })

  it('renders category select', () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    expect(screen.getByText('เลือกหมวดหมู่...')).toBeDefined()
  })

  it('renders cover image placeholder when no cover', () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    expect(screen.getByText('เลือกรูป Cover')).toBeDefined()
  })

  it('renders "เปลี่ยนรูป Cover" when cover image exists', () => {
    const withCover = { ...mockArticle, cover_image: 'https://example.com/cover.jpg' }
    render(<ArticleEditor article={withCover} categories={mockCategories} />)
    expect(screen.getByText('เปลี่ยนรูป Cover')).toBeDefined()
  })

  it('renders existing seo keywords as badges', () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    expect(screen.getByText('คีย์เวิร์ด')).toBeDefined()
  })

  it('triggers auto-save when content changes', () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    fireEvent.click(screen.getByText('change-content'))
    expect(mockTriggerSave).toHaveBeenCalled()
  })

  it('opens MediaPickerModal when cover image button clicked', async () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    fireEvent.click(screen.getByText('เลือกรูป Cover'))
    await waitFor(() => {
      expect(screen.getByTestId('media-picker-modal')).toBeDefined()
    })
  })

  it('sets cover image and triggers save when media selected', async () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    fireEvent.click(screen.getByText('เลือกรูป Cover'))

    await waitFor(() => {
      expect(screen.getByTestId('media-picker-modal')).toBeDefined()
    })

    fireEvent.click(screen.getByText('select-media'))

    await waitFor(() => {
      expect(mockTriggerSave).toHaveBeenCalled()
    })
  })

  it('closes MediaPickerModal when onClose triggered', async () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    fireEvent.click(screen.getByText('เลือกรูป Cover'))

    await waitFor(() => {
      expect(screen.getByTestId('media-picker-modal')).toBeDefined()
    })

    fireEvent.click(screen.getByText('close-picker'))

    await waitFor(() => {
      expect(screen.queryByTestId('media-picker-modal')).toBeNull()
    })
  })

  it('shows slug conflict toast on PATCH 409', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ code: 'SLUG_CONFLICT' }),
    } as Response)

    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    // trigger save via content change
    fireEvent.click(screen.getByText('change-content'))

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Slug นี้ถูกใช้ไปแล้ว กรุณาเปลี่ยน slug')
    })
  })

  it('renders Back to Blog link', () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    const link = screen.getByRole('link', { name: 'Blog' })
    expect(link).toBeDefined()
    expect((link as HTMLAnchorElement).href).toContain('/blog')
  })

  it('calls PATCH with published status when publish button clicked', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockArticle, status: 'published', published_at: '2026-04-11T00:00:00Z' }),
    } as Response)

    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    fireEvent.click(screen.getByRole('button', { name: /เผยแพร่บทความ/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        `/api/articles/${mockArticle.id}`,
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })

  it('opens delete dialog when ลบบทความ clicked', async () => {
    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    fireEvent.click(screen.getByRole('button', { name: /ลบบทความ/i }))
    await waitFor(() => {
      expect(screen.getByText('ลบบทความนี้?')).toBeDefined()
    })
  })

  it('calls DELETE API and redirects to /blog on confirm delete', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    fireEvent.click(screen.getByRole('button', { name: /ลบบทความ/i }))

    await waitFor(() => {
      expect(screen.getByText('ลบบทความนี้?')).toBeDefined()
    })

    fireEvent.click(screen.getByText('ยืนยันลบ'))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/blog')
    })
  })

  it('shows error toast when DELETE API fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Delete failed' }),
    } as Response)

    render(<ArticleEditor article={mockArticle} categories={mockCategories} />)
    fireEvent.click(screen.getByRole('button', { name: /ลบบทความ/i }))

    await waitFor(() => {
      expect(screen.getByText('ลบบทความนี้?')).toBeDefined()
    })

    fireEvent.click(screen.getByText('ยืนยันลบ'))

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('ลบบทความไม่สำเร็จ')
    })
  })
})
