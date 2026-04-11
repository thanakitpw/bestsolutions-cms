import { describe, it, expect, vi } from 'vitest'
import { GET, PATCH, DELETE } from './route'
import { NextRequest } from 'next/server'

const mockParams = Promise.resolve({ id: 'art-1' })

vi.mock('@/lib/auth', () => ({
  requireRole: vi.fn().mockResolvedValue({ user: { id: 'user-1' }, response: null }),
}))
vi.mock('@/lib/tenant', () => ({
  getTenantId: vi.fn().mockResolvedValue('tenant-1'),
}))

const mockArticle = {
  id: 'art-1',
  tenant_id: 'tenant-1',
  title: { th: 'ทดสอบ', en: 'Test Article' },
  slug: 'test-article',
  status: 'draft',
  deleted_at: null,
  published_at: null,
}

function createMockSupabase(singleData = mockArticle as unknown, singleError = null as unknown) {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: singleData, error: singleError }),
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => createMockSupabase()),
}))

describe('GET /api/articles/[id]', () => {
  it('returns article when found', async () => {
    const req = new NextRequest('http://localhost/api/articles/art-1')
    const res = await GET(req, { params: mockParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('art-1')
  })

  it('returns 404 when article not found', async () => {
    const { createServerClient } = await import('@/lib/supabase/server')
    vi.mocked(createServerClient).mockReturnValueOnce(
      createMockSupabase(null, { code: 'PGRST116' }) as never
    )
    const req = new NextRequest('http://localhost/api/articles/not-found')
    const res = await GET(req, { params: Promise.resolve({ id: 'not-found' }) })
    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    const { requireRole } = await import('@/lib/auth')
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: null,
      response: new Response(null, { status: 401 }),
    } as never)
    const req = new NextRequest('http://localhost/api/articles/art-1')
    const res = await GET(req, { params: mockParams })
    expect(res.status).toBe(401)
  })

  it('returns 400 when no tenant selected', async () => {
    const { getTenantId } = await import('@/lib/tenant')
    vi.mocked(getTenantId).mockRejectedValueOnce(new Error('No tenant'))
    const req = new NextRequest('http://localhost/api/articles/art-1')
    const res = await GET(req, { params: mockParams })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('TENANT_NOT_SELECTED')
  })
})

describe('PATCH /api/articles/[id]', () => {
  it('updates article fields', async () => {
    const req = new NextRequest('http://localhost/api/articles/art-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: { th: 'อัปเดต' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(200)
  })

  it('returns 422 for invalid slug', async () => {
    const req = new NextRequest('http://localhost/api/articles/art-1', {
      method: 'PATCH',
      body: JSON.stringify({ slug: 'INVALID SLUG!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(422)
  })

  it('returns 409 for slug conflict', async () => {
    const { createServerClient } = await import('@/lib/supabase/server')
    const conflictMock = createMockSupabase()
    conflictMock.maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'other-art' }, error: null })
    vi.mocked(createServerClient).mockReturnValueOnce(conflictMock as never)

    const req = new NextRequest('http://localhost/api/articles/art-1', {
      method: 'PATCH',
      body: JSON.stringify({ slug: 'existing-slug' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe('SLUG_CONFLICT')
  })

  it('returns 422 for invalid excerpt type (non-object)', async () => {
    const req = new NextRequest('http://localhost/api/articles/art-1', {
      method: 'PATCH',
      body: JSON.stringify({ excerpt: 'plain string not allowed' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(422)
  })

  it('auto-sets published_at when status changes to published', async () => {
    const { createServerClient } = await import('@/lib/supabase/server')
    const publishMock = createMockSupabase()
    // first call: published_at lookup → null
    publishMock.single = vi.fn()
      .mockResolvedValueOnce({ data: { published_at: null }, error: null })
      .mockResolvedValueOnce({ data: { ...mockArticle, status: 'published', published_at: new Date().toISOString() }, error: null })
    vi.mocked(createServerClient).mockReturnValueOnce(publishMock as never)

    const req = new NextRequest('http://localhost/api/articles/art-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.published_at).not.toBeNull()
  })

  it('returns 400 when no tenant selected', async () => {
    const { getTenantId } = await import('@/lib/tenant')
    vi.mocked(getTenantId).mockRejectedValueOnce(new Error('No tenant'))
    const req = new NextRequest('http://localhost/api/articles/art-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: { th: 'test' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/articles/[id]', () => {
  it('soft deletes article and returns success', async () => {
    const { createServerClient } = await import('@/lib/supabase/server')
    const deleteMock = createMockSupabase()
    deleteMock.update = vi.fn().mockReturnThis()
    vi.mocked(createServerClient).mockReturnValueOnce(deleteMock as never)

    const req = new NextRequest('http://localhost/api/articles/art-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: mockParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 403 when user is not admin', async () => {
    const { requireRole } = await import('@/lib/auth')
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: null,
      response: new Response(null, { status: 403 }),
    } as never)
    const req = new NextRequest('http://localhost/api/articles/art-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: mockParams })
    expect(res.status).toBe(403)
  })

  it('returns 400 when no tenant selected', async () => {
    const { getTenantId } = await import('@/lib/tenant')
    vi.mocked(getTenantId).mockRejectedValueOnce(new Error('No tenant'))
    const req = new NextRequest('http://localhost/api/articles/art-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: mockParams })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('TENANT_NOT_SELECTED')
  })

  it('returns 500 when DB error occurs', async () => {
    const { createServerClient } = await import('@/lib/supabase/server')
    const errorMock = createMockSupabase()
    errorMock.is = vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
    vi.mocked(createServerClient).mockReturnValueOnce(errorMock as never)

    const req = new NextRequest('http://localhost/api/articles/art-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: mockParams })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.code).toBe('DB_ERROR')
  })
})
