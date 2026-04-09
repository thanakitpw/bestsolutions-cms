import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

const mockStorageRemove = vi.fn()
const mockAdminFrom = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createServiceRoleClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        remove: mockStorageRemove,
      })),
    },
    from: mockAdminFrom,
  })),
}))

const mockGetTenantId = vi.fn()
vi.mock('@/lib/tenant', () => ({
  getTenantId: () => mockGetTenantId(),
}))

const mockLogAuditEvent = vi.fn()
vi.mock('@/lib/audit', () => ({
  logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args),
}))

const params = (id: string) => Promise.resolve({ id })

describe('DELETE /api/media/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated — AC #2', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { DELETE } = await import('./route')
    const req = new NextRequest('http://localhost/api/media/123', { method: 'DELETE' })
    const res = await DELETE(req, { params: params('123') })
    expect(res.status).toBe(401)
  })

  it('returns 404 when item not found or wrong tenant — AC #4', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetTenantId.mockResolvedValue('tenant-abc')

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    }
    mockFrom.mockReturnValue(mockChain)

    const { DELETE } = await import('./route')
    const req = new NextRequest('http://localhost/api/media/not-mine', { method: 'DELETE' })
    const res = await DELETE(req, { params: params('not-mine') })
    expect(res.status).toBe(404)
  })

  it('deletes from storage AND media_items table — AC #4', async () => {
    const tenantId = 'tenant-abc'
    const mediaId = 'media-uuid-1'
    const item = { id: mediaId, filename: 'photo.jpg', storage_path: `${tenantId}/uuid.jpg` }

    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetTenantId.mockResolvedValue(tenantId)
    mockStorageRemove.mockResolvedValue({ error: null })

    const mockSelectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: item, error: null }),
    }
    const mockDeleteChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    // First call = SELECT, second call = DELETE
    mockFrom
      .mockReturnValueOnce(mockSelectChain)
      .mockReturnValueOnce(mockDeleteChain)

    const { DELETE } = await import('./route')
    const req = new NextRequest(`http://localhost/api/media/${mediaId}`, { method: 'DELETE' })
    const res = await DELETE(req, { params: params(mediaId) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)

    // Storage must be deleted
    expect(mockStorageRemove).toHaveBeenCalledWith([item.storage_path])
    // DB must be deleted
    expect(mockDeleteChain.delete).toHaveBeenCalled()
  })

  it('calls logAuditEvent on delete — AC #4', async () => {
    const tenantId = 'tenant-abc'
    const mediaId = 'media-uuid-1'
    const item = { id: mediaId, filename: 'photo.jpg', storage_path: `${tenantId}/uuid.jpg` }

    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetTenantId.mockResolvedValue(tenantId)
    mockStorageRemove.mockResolvedValue({ error: null })

    const mockSelectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: item, error: null }),
    }
    const mockDeleteChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    mockFrom
      .mockReturnValueOnce(mockSelectChain)
      .mockReturnValueOnce(mockDeleteChain)

    const { DELETE } = await import('./route')
    const req = new NextRequest(`http://localhost/api/media/${mediaId}`, { method: 'DELETE' })
    await DELETE(req, { params: params(mediaId) })

    expect(mockLogAuditEvent).toHaveBeenCalledWith(
      'delete', 'media', mediaId, tenantId, 'user-1', { filename: 'photo.jpg' }
    )
  })
})

describe('PATCH /api/media/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { PATCH } = await import('./route')
    const req = new NextRequest('http://localhost/api/media/123', {
      method: 'PATCH',
      body: JSON.stringify({ alt_text: { th: 'ทดสอบ' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: params('123') })
    expect(res.status).toBe(401)
  })

  it('returns 422 on invalid body — AC #5', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetTenantId.mockResolvedValue('tenant-abc')

    const { PATCH } = await import('./route')
    const req = new NextRequest('http://localhost/api/media/123', {
      method: 'PATCH',
      body: JSON.stringify({ wrong_field: 'bad' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: params('123') })
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('updates alt_text and returns updated item — AC #5', async () => {
    const tenantId = 'tenant-abc'
    const mediaId = 'media-uuid-1'
    const updatedItem = {
      id: mediaId,
      filename: 'photo.jpg',
      alt_text: { th: 'รูปทดสอบ', en: 'Test image' },
    }

    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetTenantId.mockResolvedValue(tenantId)

    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updatedItem, error: null }),
    }
    mockFrom.mockReturnValue(mockChain)

    const { PATCH } = await import('./route')
    const req = new NextRequest(`http://localhost/api/media/${mediaId}`, {
      method: 'PATCH',
      body: JSON.stringify({ alt_text: { th: 'รูปทดสอบ', en: 'Test image' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: params(mediaId) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.alt_text).toEqual({ th: 'รูปทดสอบ', en: 'Test image' })

    // Verify tenant isolation
    expect(mockChain.eq).toHaveBeenCalledWith('tenant_id', tenantId)
  })
})
