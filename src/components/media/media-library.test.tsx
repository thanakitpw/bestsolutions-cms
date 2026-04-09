import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MediaLibrary, type MediaItem } from './media-library'

// Mock child components that have external dependencies
vi.mock('./media-upload-zone', () => ({
  MediaUploadZone: ({ onUploaded }: { onUploaded: (item: MediaItem) => void; tenantId: string }) => (
    <div data-testid="upload-zone">
      <button
        onClick={() => onUploaded({
          id: 'new-id',
          filename: 'new-upload.jpg',
          public_url: 'https://x.co/new.jpg',
          mime_type: 'image/jpeg',
          size: 2000,
          created_at: new Date().toISOString(),
        })}
      >
        Mock Upload
      </button>
    </div>
  ),
}))

vi.mock('./media-detail-panel', () => ({
  MediaDetailPanel: ({ item, onClose }: { item: MediaItem; onClose: () => void; onUpdated: (i: MediaItem) => void; onDelete: () => void }) => (
    <div data-testid="detail-panel">
      <span>{item.filename}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

vi.mock('./delete-media-dialog', () => ({
  DeleteMediaDialog: ({ item, onConfirm, onClose }: { item: MediaItem; onConfirm: () => void; onClose: () => void }) => (
    <div data-testid="delete-dialog">
      <span>ลบ {item.filename}</span>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  ),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const makeItems = (count: number): MediaItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    filename: `image-${i}.jpg`,
    public_url: `https://x.co/image-${i}.jpg`,
    mime_type: 'image/jpeg',
    size: 1000 + i,
    created_at: new Date().toISOString(),
  }))

describe('MediaLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders grid with initial items — AC #3', () => {
    const items = makeItems(3)
    render(<MediaLibrary initialItems={items} tenantId="tenant-abc" />)

    expect(screen.getByText('image-0.jpg')).toBeInTheDocument()
    expect(screen.getByText('image-1.jpg')).toBeInTheDocument()
    expect(screen.getByText('image-2.jpg')).toBeInTheDocument()
  })

  it('shows empty state when no items — AC #3', () => {
    render(<MediaLibrary initialItems={[]} tenantId="tenant-abc" />)
    expect(screen.getByText(/ยังไม่มีรูปภาพ/)).toBeInTheDocument()
  })

  it('filters items by search — AC #3', () => {
    const items = [
      { id: '1', filename: 'banner.jpg', public_url: 'https://x.co/banner.jpg', mime_type: 'image/jpeg', size: 1000, created_at: new Date().toISOString() },
      { id: '2', filename: 'profile.png', public_url: 'https://x.co/profile.png', mime_type: 'image/png', size: 2000, created_at: new Date().toISOString() },
    ]
    render(<MediaLibrary initialItems={items} tenantId="tenant-abc" />)

    const searchInput = screen.getByPlaceholderText('ค้นหาจากชื่อไฟล์...')
    fireEvent.change(searchInput, { target: { value: 'banner' } })

    expect(screen.getByText('banner.jpg')).toBeInTheDocument()
    expect(screen.queryByText('profile.png')).not.toBeInTheDocument()
  })

  it('shows no-results message when search yields empty — AC #3', () => {
    const items = makeItems(2)
    render(<MediaLibrary initialItems={items} tenantId="tenant-abc" />)

    const searchInput = screen.getByPlaceholderText('ค้นหาจากชื่อไฟล์...')
    fireEvent.change(searchInput, { target: { value: 'xyznotexist' } })

    expect(screen.getByText(/ไม่พบไฟล์ที่ค้นหา/)).toBeInTheDocument()
  })

  it('renders upload zone — AC #1', () => {
    render(<MediaLibrary initialItems={[]} tenantId="tenant-abc" />)
    expect(screen.getByTestId('upload-zone')).toBeInTheDocument()
  })

  it('prepends uploaded item to grid — AC #1', () => {
    const items = makeItems(1)
    render(<MediaLibrary initialItems={items} tenantId="tenant-abc" />)

    fireEvent.click(screen.getByText('Mock Upload'))

    expect(screen.getByText('new-upload.jpg')).toBeInTheDocument()
    expect(screen.getByText('image-0.jpg')).toBeInTheDocument()
  })

  it('shows "Load more" button when exactly 50 items returned — AC #3', () => {
    const items = makeItems(50)
    render(<MediaLibrary initialItems={items} tenantId="tenant-abc" />)
    expect(screen.getByText('โหลดเพิ่มเติม')).toBeInTheDocument()
  })

  it('hides "Load more" when less than 50 items — AC #3', () => {
    const items = makeItems(10)
    render(<MediaLibrary initialItems={items} tenantId="tenant-abc" />)
    expect(screen.queryByText('โหลดเพิ่มเติม')).not.toBeInTheDocument()
  })
})
