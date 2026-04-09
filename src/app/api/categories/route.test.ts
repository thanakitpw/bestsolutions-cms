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
  requireTenant: vi.fn(),
}))

vi.mock('@/lib/validations/category', () => ({
  CategorySchema: {
    safeParse: vi.fn(),
  },
}))

vi.mock('@/lib/slugify', () => ({
  generateSlug: vi.fn((s: string) => s.toLowerCase().replace(/\s+/g, '-')),
}))

// ── imports after mocks ────────────────────────────────────────────────────
import { GET, POST } from './route'
import { requireRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { CategorySchema } from '@/lib/validations/category'

const TENANT_ID = 'tenant-abc'
const ADMIN_USER = { id: 'user-1', role: 'admin' as const }

function makeRequest(path: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(`http://localhost${path}`, options)
}

describe('GET /api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    ;(getTenantId as ReturnType<typeof vi.fn>).mockResolvedValue(TENANT_ID)
  })

  it('returns 401 when no user session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const req = makeRequest('/api/categories')
    const res = await GET(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.code).toBe('UNAUTHORIZED')
  })

  it('returns all tenant categories sorted by sort_order', async () => {
    const cats = [
      { id: '1', name: { th: 'เชิงพาณิชย์' }, slug: 'commercial', type: 'project', sort_order: 0 },
      { id: '2', name: { en: 'Residential' }, slug: 'residential', type: 'project', sort_order: 1 },
    ]
    mockFrom.mockReturnValue(makeChain({ data: cats, error: null }))
    const req = makeRequest('/api/categories')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(2)
  })

  it('filters by type=project when query param provided', async () => {
    const projectCats = [
      { id: '1', name: { th: 'เชิงพาณิชย์' }, slug: 'commercial', type: 'project', sort_order: 0 },
    ]
    const chain = makeChain({ data: projectCats, error: null })
    mockFrom.mockReturnValue(chain)

    const req = makeRequest('/api/categories?type=project')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    // eq('type', 'project') must have been called
    expect(chain.eq).toHaveBeenCalledWith('type', 'project')
  })

  it('ignores invalid type param and returns all', async () => {
    const allCats = [
      { id: '1', slug: 'a', type: 'project', sort_order: 0 },
      { id: '2', slug: 'b', type: 'article', sort_order: 0 },
    ]
    const chain = makeChain({ data: allCats, error: null })
    mockFrom.mockReturnValue(chain)

    const req = makeRequest('/api/categories?type=invalid')
    const res = await GET(req)
    expect(res.status).toBe(200)
    // eq('type') must NOT have been called with 'invalid'
    const eqCalls = (chain.eq as ReturnType<typeof vi.fn>).mock.calls
    expect(eqCalls.some(([, v]: [string, string]) => v === 'invalid')).toBe(false)
  })

  it('returns 500 on DB error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'db down' } }))
    const req = makeRequest('/api/categories')
    const res = await GET(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.code).toBe('DB_ERROR')
  })
})

describe('POST /api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireRole as ReturnType<typeof vi.fn>).mockResolvedValue({ user: ADMIN_USER, response: null })
    ;(getTenantId as ReturnType<typeof vi.fn>).mockResolvedValue(TENANT_ID)
    ;(CategorySchema.safeParse as ReturnType<typeof vi.fn>).mockReturnValue({
      success: true,
      data: { name: { th: 'เชิงพาณิชย์', en: 'Commercial' }, slug: '', type: 'project', sort_order: 0 },
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
    const req = makeRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: { th: 'Test' }, type: 'project' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 422 on validation failure', async () => {
    ;(CategorySchema.safeParse as ReturnType<typeof vi.fn>).mockReturnValue({
      success: false,
      error: { flatten: () => ({ fieldErrors: { name: ['required'] } }) },
    })
    const req = makeRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ type: 'project' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 409 when slug already exists for the same type', async () => {
    // Slug check → existing found
    mockFrom.mockReturnValueOnce(makeChain({ data: { id: 'existing-1' }, error: null }))
    const req = makeRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: { th: 'Test' }, slug: 'commercial', type: 'project' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe('SLUG_EXISTS')
  })

  it('creates category and returns 201 with auto sort_order', async () => {
    const created = { id: 'new-1', name: { th: 'เชิงพาณิชย์' }, slug: 'commercial', type: 'project', sort_order: 0 }
    // slug check → not found
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: { code: 'PGRST116' } }))
    // max sort_order query
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }))
    // insert
    mockFrom.mockReturnValueOnce(makeChain({ data: created, error: null }))

    const req = makeRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: { th: 'เชิงพาณิชย์' }, type: 'project' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('new-1')
  })
})
