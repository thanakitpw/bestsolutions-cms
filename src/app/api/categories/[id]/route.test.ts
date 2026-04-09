import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── helpers ────────────────────────────────────────────────────────────────
const makeChain = (result: any) => {
  const chain = Promise.resolve(result) as any
  const methods = ['select', 'eq', 'order', 'insert', 'update', 'delete', 'single', 'limit', 'is']
  for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain)
  return chain
}

// ── mocks ──────────────────────────────────────────────────────────────────
const mockFrom = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

vi.mock('@/lib/auth', () => ({
  requireRole: vi.fn(),
}))

vi.mock('@/lib/tenant', () => ({
  getTenantId: vi.fn(),
}))

vi.mock('@/lib/validations/category', () => ({
  CategorySchema: {
    safeParse: vi.fn(),
  },
}))

// ── imports after mocks ────────────────────────────────────────────────────
import { GET, PUT, DELETE } from './route'
import { requireRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { CategorySchema } from '@/lib/validations/category'

const TENANT_ID = 'tenant-abc'
const ADMIN_USER = { id: 'user-1', role: 'admin' as const }
const CAT_ID = 'cat-uuid-1'

function makeRequest(path: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(`http://localhost${path}`, options)
}

const params = { params: { id: CAT_ID } }

describe('GET /api/categories/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    ;(getTenantId as ReturnType<typeof vi.fn>).mockResolvedValue(TENANT_ID)
  })

  it('returns 401 when no user session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const req = makeRequest(`/api/categories/${CAT_ID}`)
    const res = await GET(req, params)
    expect(res.status).toBe(401)
  })

  it('returns 404 when category not found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { code: 'PGRST116' } }))
    const req = makeRequest(`/api/categories/${CAT_ID}`)
    const res = await GET(req, params)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.code).toBe('NOT_FOUND')
  })

  it('returns category when found', async () => {
    const cat = { id: CAT_ID, name: { th: 'Test' }, slug: 'test', type: 'project', sort_order: 0 }
    mockFrom.mockReturnValue(makeChain({ data: cat, error: null }))
    const req = makeRequest(`/api/categories/${CAT_ID}`)
    const res = await GET(req, params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe(CAT_ID)
  })
})

describe('PUT /api/categories/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireRole as ReturnType<typeof vi.fn>).mockResolvedValue({ user: ADMIN_USER, response: null })
    ;(getTenantId as ReturnType<typeof vi.fn>).mockResolvedValue(TENANT_ID)
    ;(CategorySchema.safeParse as ReturnType<typeof vi.fn>).mockReturnValue({
      success: true,
      data: { name: { th: 'Updated' }, slug: 'updated', type: 'project', sort_order: 0 },
    })
  })

  it('returns 403 when user is not admin', async () => {
    ;(requireRole as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: null,
      response: new Response(JSON.stringify({ error: 'Forbidden', code: 'INSUFFICIENT_ROLE', status: 403 }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    })
    const req = makeRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: JSON.stringify({ name: { th: 'Updated' }, type: 'project' }),
    })
    const res = await PUT(req, params)
    expect(res.status).toBe(403)
  })

  it('returns 404 when category not found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { code: 'PGRST116' } }))
    const req = makeRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: JSON.stringify({ name: { th: 'Updated' }, type: 'project' }),
    })
    const res = await PUT(req, params)
    expect(res.status).toBe(404)
  })

  it('updates name, slug, sort_order but NOT type', async () => {
    const existing = { id: CAT_ID, name: { th: 'Old' }, slug: 'old', type: 'project', sort_order: 0 }
    const updated = { ...existing, name: { th: 'Updated' }, slug: 'updated' }
    const chain = makeChain({ data: existing, error: null })
    mockFrom
      .mockReturnValueOnce(makeChain({ data: existing, error: null })) // fetch existing
      .mockReturnValueOnce(makeChain({ data: updated, error: null }))  // update

    const req = makeRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: JSON.stringify({ name: { th: 'Updated' }, slug: 'updated', type: 'article' }), // attempt type change
    })
    const res = await PUT(req, params)
    expect(res.status).toBe(200)

    // Verify type was NOT changed — update payload must not include type
    const updateChain = mockFrom.mock.results[1].value
    const updateCall = (updateChain.update as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]
    if (updateCall) {
      expect(updateCall).not.toHaveProperty('type')
    }
  })

  it('returns 422 on validation failure', async () => {
    ;(CategorySchema.safeParse as ReturnType<typeof vi.fn>).mockReturnValue({
      success: false,
      error: { flatten: () => ({ fieldErrors: {} }) },
    })
    const req = makeRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: JSON.stringify({}),
    })
    const res = await PUT(req, params)
    expect(res.status).toBe(422)
  })
})

describe('DELETE /api/categories/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireRole as ReturnType<typeof vi.fn>).mockResolvedValue({ user: ADMIN_USER, response: null })
    ;(getTenantId as ReturnType<typeof vi.fn>).mockResolvedValue(TENANT_ID)
  })

  it('returns 403 when user is not admin', async () => {
    ;(requireRole as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: null,
      response: new Response(JSON.stringify({ error: 'Forbidden', code: 'INSUFFICIENT_ROLE', status: 403 }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    })
    const req = makeRequest(`/api/categories/${CAT_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, params)
    expect(res.status).toBe(403)
  })

  it('returns 404 when category not found for this tenant', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { code: 'PGRST116' } }))
    const req = makeRequest(`/api/categories/${CAT_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, params)
    expect(res.status).toBe(404)
  })

  it('deletes category and returns linkedCount=0 when no linked content', async () => {
    const cat = { id: CAT_ID, type: 'project' }
    mockFrom
      .mockReturnValueOnce(makeChain({ data: cat, error: null }))              // fetch category
      .mockReturnValueOnce(makeChain({ data: null, error: null, count: 0 }))   // projects count
      .mockReturnValueOnce(makeChain({ data: null, error: null, count: 0 }))   // articles count
      .mockReturnValueOnce(makeChain({ data: null, error: null }))             // delete

    const req = makeRequest(`/api/categories/${CAT_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.linkedCount).toBe(0)
  })

  it('deletes category and returns correct linkedCount when content exists', async () => {
    const cat = { id: CAT_ID, type: 'project' }
    mockFrom
      .mockReturnValueOnce(makeChain({ data: cat, error: null }))              // fetch category
      .mockReturnValueOnce(makeChain({ data: null, error: null, count: 3 }))   // 3 projects
      .mockReturnValueOnce(makeChain({ data: null, error: null, count: 2 }))   // 2 articles
      .mockReturnValueOnce(makeChain({ data: null, error: null }))             // delete

    const req = makeRequest(`/api/categories/${CAT_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.linkedCount).toBe(5)
  })
})
