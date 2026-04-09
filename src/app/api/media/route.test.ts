import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock server-only (used in admin.ts)
vi.mock('server-only', () => ({}))

// Mock supabase server client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

// Mock admin client (service role)
const mockStorageUpload = vi.fn()
const mockStorageRemove = vi.fn()
const mockStorageGetPublicUrl = vi.fn()
const mockAdminFrom = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createServiceRoleClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: mockStorageUpload,
        remove: mockStorageRemove,
        getPublicUrl: mockStorageGetPublicUrl,
      })),
    },
    from: mockAdminFrom,
  })),
}))

// Mock tenant
const mockGetTenantId = vi.fn()
vi.mock('@/lib/tenant', () => ({
  getTenantId: () => mockGetTenantId(),
}))

describe('GET /api/media', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated — AC #2', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { GET } = await import('./route')
    const req = new NextRequest('http://localhost/api/media')
    const res = await GET(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.code).toBe('UNAUTHORIZED')
  })

  it('returns paginated media items for authenticated tenant — AC #2, #3', async () => {
    const tenantId = 'tenant-abc'
    const mockItems = [
      { id: '1', filename: 'photo.jpg', public_url: 'https://x.co/photo.jpg', mime_type: 'image/jpeg', size: 5000, created_at: new Date().toISOString() },
    ]

    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetTenantId.mockResolvedValue(tenantId)

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: mockItems, error: null, count: 1 }),
    }
    mockFrom.mockReturnValue(mockChain)

    const { GET } = await import('./route')
    const req = new NextRequest('http://localhost/api/media?limit=50&offset=0')
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)

    // Verify tenant isolation — eq must be called with tenant_id
    expect(mockChain.eq).toHaveBeenCalledWith('tenant_id', tenantId)
  })

  it('enforces max limit of 100', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetTenantId.mockResolvedValue('tenant-abc')

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    }
    mockFrom.mockReturnValue(mockChain)

    const { GET } = await import('./route')
    const req = new NextRequest('http://localhost/api/media?limit=999')
    await GET(req)

    // range should be called with max 100
    expect(mockChain.range).toHaveBeenCalledWith(0, 99)
  })
})

describe('POST /api/media', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated — AC #2', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('./route')
    const fd = new FormData()
    fd.append('file', new File(['data'], 'test.jpg', { type: 'image/jpeg' }))
    const req = new NextRequest('http://localhost/api/media', { method: 'POST', body: fd })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when no file provided — AC #1', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetTenantId.mockResolvedValue('tenant-abc')

    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/media', { method: 'POST' })
    // Mock formData() to return empty FormData (no 'file' field)
    const emptyFd = new FormData()
    vi.spyOn(req, 'formData').mockResolvedValue(emptyFd)
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('NO_FILE')
  })

  it('returns 422 for invalid mime type — AC #1', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetTenantId.mockResolvedValue('tenant-abc')

    const { POST } = await import('./route')
    const fd = new FormData()
    fd.append('file', new File(['data'], 'doc.pdf', { type: 'application/pdf' }))
    const req = new NextRequest('http://localhost/api/media', { method: 'POST', body: fd })
    const res = await POST(req)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.code).toBe('INVALID_MIME')
  })

  it('returns 422 when file exceeds 10MB — AC #1', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetTenantId.mockResolvedValue('tenant-abc')

    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/media', { method: 'POST' })
    // Mock formData() to return a File with overridden size (11MB)
    const bigFd = new FormData()
    const bigFile = new File(['data'], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024, configurable: true })
    bigFd.append('file', bigFile)
    vi.spyOn(req, 'formData').mockResolvedValue(bigFd)
    const res = await POST(req)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.code).toBe('FILE_TOO_LARGE')
  })

  it('uploads file and inserts media_items row — AC #1', async () => {
    const tenantId = 'tenant-abc'
    const fakeItem = {
      id: 'media-uuid',
      filename: 'photo.jpg',
      storage_path: `${tenantId}/uuid.jpg`,
      public_url: 'https://x.co/photo.jpg',
      mime_type: 'image/jpeg',
      size: 5000,
      created_at: new Date().toISOString(),
    }

    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetTenantId.mockResolvedValue(tenantId)
    mockStorageUpload.mockResolvedValue({ error: null })
    mockStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://x.co/photo.jpg' } })

    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeItem, error: null }),
    }
    mockFrom.mockReturnValue(mockChain)

    const { POST } = await import('./route')
    const fd = new FormData()
    fd.append('file', new File(['imagedata'], 'photo.jpg', { type: 'image/jpeg' }))
    const req = new NextRequest('http://localhost/api/media', { method: 'POST', body: fd })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('media-uuid')
    expect(body.filename).toBe('photo.jpg')
  })

  it('cleans up storage if DB insert fails — AC #1', async () => {
    const tenantId = 'tenant-abc'
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetTenantId.mockResolvedValue(tenantId)
    mockStorageUpload.mockResolvedValue({ error: null })
    mockStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://x.co/photo.jpg' } })
    mockStorageRemove.mockResolvedValue({})

    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }
    mockFrom.mockReturnValue(mockChain)

    const { POST } = await import('./route')
    const fd = new FormData()
    fd.append('file', new File(['data'], 'photo.jpg', { type: 'image/jpeg' }))
    const req = new NextRequest('http://localhost/api/media', { method: 'POST', body: fd })
    const res = await POST(req)
    expect(res.status).toBe(500)
    expect(mockStorageRemove).toHaveBeenCalledOnce()
  })
})
