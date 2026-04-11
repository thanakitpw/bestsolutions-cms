import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NewProjectDialog } from './new-project-dialog'

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
  { id: 'cat-1', name: { th: 'เชิงพาณิชย์', en: 'Commercial' } },
  { id: 'cat-2', name: { en: 'Residential' } },
]

function openDialog() {
  const btn = screen.getByRole('button', { name: /new project/i })
  fireEvent.click(btn)
}

// ══════════════════════════════════════════════════════════════════════════
describe('NewProjectDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "New Project" trigger button', () => {
    render(<NewProjectDialog categories={CATEGORIES} />)
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument()
  })

  it('opens dialog when button is clicked', () => {
    render(<NewProjectDialog categories={CATEGORIES} />)
    openDialog()
    expect(screen.getByText('สร้างโปรเจกต์ใหม่')).toBeInTheDocument()
  })

  it('auto-generates slug from EN title', () => {
    render(<NewProjectDialog categories={CATEGORIES} />)
    openDialog()

    // Switch to EN tab
    fireEvent.click(screen.getByRole('tab', { name: /english/i }))

    const titleInput = screen.getByPlaceholderText('Project name in English')
    fireEvent.change(titleInput, { target: { value: 'My New Project' } })

    const slugInput = screen.getByPlaceholderText('project-name')
    expect((slugInput as HTMLInputElement).value).toBe('my-new-project')
  })

  it('does not overwrite manually edited slug when title changes', () => {
    render(<NewProjectDialog categories={CATEGORIES} />)
    openDialog()

    // Switch to EN tab and type a title
    fireEvent.click(screen.getByRole('tab', { name: /english/i }))
    fireEvent.change(screen.getByPlaceholderText('Project name in English'), {
      target: { value: 'First Title' },
    })

    // Manually edit slug
    const slugInput = screen.getByPlaceholderText('project-name')
    fireEvent.change(slugInput, { target: { value: 'custom-slug' } })

    // Change title again
    fireEvent.change(screen.getByPlaceholderText('Project name in English'), {
      target: { value: 'Second Title' },
    })

    // Slug should remain as manually entered
    expect((slugInput as HTMLInputElement).value).toBe('custom-slug')
  })

  it('shows toast error when submitting with no title', async () => {
    const { toast } = await import('sonner')
    render(<NewProjectDialog categories={CATEGORIES} />)
    openDialog()

    // Click submit without filling any title
    const submitBtn = screen.getByRole('button', { name: /สร้างโปรเจกต์/i })
    fireEvent.click(submitBtn)

    expect(toast.error).toHaveBeenCalledWith('กรุณากรอกชื่อโปรเจกต์อย่างน้อย 1 ภาษา')
  })

  it('submits form and redirects on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'proj-new-1', slug: 'my-project', status: 'draft' }),
    })

    const { toast } = await import('sonner')
    render(<NewProjectDialog categories={CATEGORIES} />)
    openDialog()

    // Fill title TH
    fireEvent.change(screen.getByPlaceholderText('ชื่อโปรเจกต์ภาษาไทย'), {
      target: { value: 'โปรเจกต์ทดสอบ' },
    })

    // Fill slug manually
    const slugInput = screen.getByPlaceholderText('project-name')
    fireEvent.change(slugInput, { target: { value: 'my-project' } })

    const submitBtn = screen.getByRole('button', { name: /สร้างโปรเจกต์/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({ method: 'POST' })
      )
      expect(toast.success).toHaveBeenCalledWith('สร้างโปรเจกต์สำเร็จ')
      expect(mockPush).toHaveBeenCalledWith('/projects/proj-new-1')
    })
  })

  it('shows SLUG_CONFLICT toast on 409', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ code: 'SLUG_CONFLICT' }),
    })

    const { toast } = await import('sonner')
    render(<NewProjectDialog categories={CATEGORIES} />)
    openDialog()

    fireEvent.change(screen.getByPlaceholderText('ชื่อโปรเจกต์ภาษาไทย'), {
      target: { value: 'ทดสอบ' },
    })
    fireEvent.change(screen.getByPlaceholderText('project-name'), {
      target: { value: 'existing-slug' },
    })

    fireEvent.click(screen.getByRole('button', { name: /สร้างโปรเจกต์/i }))

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
    render(<NewProjectDialog categories={CATEGORIES} />)
    openDialog()

    fireEvent.change(screen.getByPlaceholderText('ชื่อโปรเจกต์ภาษาไทย'), {
      target: { value: 'ทดสอบ' },
    })
    fireEvent.change(screen.getByPlaceholderText('project-name'), {
      target: { value: 'my-slug' },
    })

    fireEvent.click(screen.getByRole('button', { name: /สร้างโปรเจกต์/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('เกิดข้อผิดพลาด กรุณาลองใหม่')
    })
  })
})
