import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ProjectEditor } from './project-editor'

// ── mocks ──────────────────────────────────────────────────────────────────

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

const mockTriggerSave = vi.fn()
const mockSaveNow = vi.fn()
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
      // fire save immediately for testing
      void onSave()
    },
    saveNow: mockSaveNow,
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

const mockProject = {
  id: 'proj-1',
  title: { th: 'โปรเจกต์ทดสอบ', en: 'Test Project' },
  slug: 'test-project',
  description: { th: 'คำอธิบาย', en: 'Description' },
  content: { th: null, en: null },
  category_id: null,
  location: { th: 'กรุงเทพฯ', en: 'Bangkok' },
  area_sqm: 120,
  year: 2025,
  cover_image: null,
  status: 'draft' as const,
  published_at: null,
  seo_title: { th: 'SEO Title TH', en: 'SEO Title EN' },
  seo_description: { th: 'SEO Desc TH', en: 'SEO Desc EN' },
  seo_keywords: { th: ['คีย์เวิร์ด'], en: ['keyword'] },
}

const mockCategories = [
  { id: 'cat-1', name: { th: 'หมวดหมู่ 1', en: 'Category 1' } },
]

// ── tests ──────────────────────────────────────────────────────────────────

describe('ProjectEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockProject }),
    } as Response)
  })

  it('renders project title in breadcrumb', () => {
    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    expect(screen.getByText('โปรเจกต์ทดสอบ')).toBeDefined()
  })

  it('renders SaveIndicator', () => {
    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    expect(screen.getByTestId('save-indicator')).toBeDefined()
  })

  it('renders Publish button when status is draft', () => {
    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDefined()
  })

  it('renders Unpublish button when status is published', () => {
    const publishedProject = { ...mockProject, status: 'published' as const, published_at: '2026-04-01T00:00:00Z' }
    render(<ProjectEditor project={publishedProject} categories={mockCategories} />)
    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeDefined()
  })

  it('renders locale tabs for content', () => {
    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    expect(screen.getByTestId('locale-tabs')).toBeDefined()
  })

  it('renders category select', () => {
    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    // Select trigger should be rendered
    expect(screen.getByText('เลือกหมวดหมู่...')).toBeDefined()
  })

  it('renders danger zone delete button', () => {
    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    expect(screen.getByText('ลบโปรเจกต์')).toBeDefined()
  })

  it('shows delete confirmation dialog when delete button clicked', async () => {
    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    fireEvent.click(screen.getByText('ลบโปรเจกต์'))
    await waitFor(() => {
      expect(screen.getByText('ยืนยันการลบโปรเจกต์')).toBeDefined()
    })
  })

  it('calls DELETE API and redirects on confirm delete', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    fireEvent.click(screen.getByText('ลบโปรเจกต์'))

    await waitFor(() => {
      expect(screen.getByText('ยืนยันการลบโปรเจกต์')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'ลบโปรเจกต์' }))

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('ลบโปรเจกต์สำเร็จ')
      expect(mockPush).toHaveBeenCalledWith('/projects')
    })
  })

  it('shows error toast when delete API fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'forbidden' }),
    } as Response)

    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    fireEvent.click(screen.getByText('ลบโปรเจกต์'))

    await waitFor(() => {
      expect(screen.getByText('ยืนยันการลบโปรเจกต์')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'ลบโปรเจกต์' }))

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('เกิดข้อผิดพลาด ไม่สามารถลบได้')
    })
  })

  it('calls PATCH API when Publish button clicked', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockProject, status: 'published' }),
    } as Response)

    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        `/api/projects/${mockProject.id}`,
        expect.objectContaining({
          method: 'PATCH',
        })
      )
    })
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Publish สำเร็จ')
    })
  })

  it('triggers auto-save when content changes', async () => {
    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    fireEvent.click(screen.getByText('change-content'))
    expect(mockTriggerSave).toHaveBeenCalled()
  })

  it('opens MediaPickerModal when cover image button clicked', async () => {
    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    fireEvent.click(screen.getByText('เลือกรูป Cover'))
    await waitFor(() => {
      expect(screen.getByTestId('media-picker-modal')).toBeDefined()
    })
  })

  it('sets cover image and triggers save when media selected', async () => {
    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    fireEvent.click(screen.getByText('เลือกรูป Cover'))

    await waitFor(() => {
      expect(screen.getByTestId('media-picker-modal')).toBeDefined()
    })

    fireEvent.click(screen.getByText('select-media'))

    // After selection, modal should close and save triggered
    await waitFor(() => {
      expect(mockTriggerSave).toHaveBeenCalled()
    })
  })

  it('renders existing seo keywords as badges', () => {
    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    // 'คีย์เวิร์ด' is a TH keyword from fixture
    expect(screen.getByText('คีย์เวิร์ด')).toBeDefined()
  })

  it('renders initial area_sqm value', () => {
    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    const areaInput = screen.getByPlaceholderText('100')
    expect((areaInput as HTMLInputElement).value).toBe('120')
  })

  it('renders initial year value', () => {
    render(<ProjectEditor project={mockProject} categories={mockCategories} />)
    const yearInput = screen.getByPlaceholderText('2025')
    expect((yearInput as HTMLInputElement).value).toBe('2025')
  })
})
