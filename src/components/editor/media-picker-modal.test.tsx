import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MediaPickerModal } from './media-picker-modal'

const mockImages = [
  {
    id: 'img-1',
    filename: 'photo.jpg',
    storage_path: 'tenant-1/photo.jpg',
    public_url: 'https://storage.example.com/photo.jpg',
    mime_type: 'image/jpeg',
    size: 102400,
    width: 800,
    height: 600,
    alt_text: { th: 'รูปภาพ', en: 'photo' },
    created_at: '2026-04-11T00:00:00Z',
  },
  {
    id: 'img-2',
    filename: 'logo.png',
    storage_path: 'tenant-1/logo.png',
    public_url: 'https://storage.example.com/logo.png',
    mime_type: 'image/png',
    size: 50000,
    width: 200,
    height: 200,
    alt_text: null,
    created_at: '2026-04-10T00:00:00Z',
  },
]

const mockPdf = {
  id: 'pdf-1',
  filename: 'doc.pdf',
  storage_path: 'tenant-1/doc.pdf',
  public_url: 'https://storage.example.com/doc.pdf',
  mime_type: 'application/pdf',
  size: 200000,
  width: null,
  height: null,
  alt_text: null,
  created_at: '2026-04-09T00:00:00Z',
}

describe('MediaPickerModal', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockImages }),
    } as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing when closed', () => {
    render(<MediaPickerModal open={false} onClose={vi.fn()} onSelect={vi.fn()} />)
    expect(screen.queryByText('เลือกรูปภาพ')).not.toBeInTheDocument()
  })

  it('shows dialog when open', () => {
    vi.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}))
    render(<MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('displays image grid after fetch', async () => {
    render(<MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('photo.jpg')).toBeInTheDocument()
      expect(screen.getByText('logo.png')).toBeInTheDocument()
    })
  })

  it('filters out non-image items (PDF)', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [...mockImages, mockPdf] }),
    } as Response)
    render(<MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    await waitFor(() => {
      expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument()
    })
  })

  it('select button is disabled until item is clicked', async () => {
    render(<MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    await waitFor(() => screen.getByText('photo.jpg'))
    expect(screen.getByRole('button', { name: 'เลือกรูปนี้' })).toBeDisabled()
  })

  it('calls onSelect with correct item and closes', async () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(<MediaPickerModal open={true} onClose={onClose} onSelect={onSelect} />)
    await waitFor(() => screen.getByText('photo.jpg'))

    fireEvent.click(screen.getByText('photo.jpg').closest('button')!)
    fireEvent.click(screen.getByRole('button', { name: 'เลือกรูปนี้' }))

    expect(onSelect).toHaveBeenCalledWith(mockImages[0])
    expect(onClose).toHaveBeenCalled()
  })

  it('shows empty state when no images', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response)
    render(<MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText(/ยังไม่มีรูปภาพ/)).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as Response)
    render(<MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('ไม่สามารถโหลดรูปภาพได้')).toBeInTheDocument()
    })
  })

  it('resets selection when closed and reopened', async () => {
    const { rerender } = render(
      <MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />
    )
    await waitFor(() => screen.getByText('photo.jpg'))
    fireEvent.click(screen.getByText('photo.jpg').closest('button')!)
    expect(screen.getByRole('button', { name: 'เลือกรูปนี้' })).toBeEnabled()

    rerender(<MediaPickerModal open={false} onClose={vi.fn()} onSelect={vi.fn()} />)
    rerender(<MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    await waitFor(() => screen.getByText('photo.jpg'))
    expect(screen.getByRole('button', { name: 'เลือกรูปนี้' })).toBeDisabled()
  })
})
