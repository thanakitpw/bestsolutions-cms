import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── helpers ────────────────────────────────────────────────────────────────
const makeChain = (result: unknown) => {
  const chain = Promise.resolve(result) as ReturnType<typeof Promise.resolve> & Record<string, unknown>
  const methods = [
    'select', 'eq', 'is', 'or', 'order', 'range',
    'insert', 'single', 'maybeSingle',
  ]
  for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain)
  return chain
}

// ── mocks ──────────────────────────────────────────────────────────────────
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({ from: mockFrom })),
}))

vi.mock('@/lib/auth', () => ({
  requireRole: vi.fn(),
}))

vi.mock('@/lib/tenant', () => ({
  getTenantId: vi.fn(),
}))

// ── imports after mocks ────────────────────────────────────────────────────
import { GET, POST } from './route'
import { requireRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'

const TENANT_ID = 'tenant-abc'
const EDITOR_USER = { id: 'user-1', role: 'editor' as const }

function makeRequest(path: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(`http://localhost${path}`, options)
}

// ══════════════════════════════════════════════════════════════════════════
// GET /api/projects
// ══════════════════════════════════════════════════════════════════════════
describe('GET /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireRole).mockResolvedValue({ user: EDITOR_USER as never, response: null })
    vi.mocked(getTenantId).mockResolvedValue(TENANT_ID)
  })

  it('returns project list with pagination shape', async () => {
    const projects = [
      { id: 'p1', title: { th: 'โปรเจกต์ 1' }, slug: 'project-1', status: 'draft', cover_image: null, created_at: '2026-01-01', category: null },
    ]
    mockFrom.mockReturnValue(makeChain({ data: projects, count: 1, error: null }))

    const req = makeRequest('/api/projects')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('total', 1)
    expect(body).toHaveProperty('page', 1)
    expect(body).toHaveProperty('limit', 12)
    expect(body).toHaveProperty('totalPages', 1)
  })

  it('returns 400 when no tenant selected', async () => {
    vi.mocked(getTenantId).mockRejectedValueOnce(new Error('SUPER_ADMIN_NO_TENANT_SELECTED'))
    const req = makeRequest('/api/projects')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('TENANT_NOT_SELECTED')
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    } as never)
    const req = makeRequest('/api/projects')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('applies search filter via .or()', async () => {
    const chain = makeChain({ data: [], count: 0, error: null })
    mockFrom.mockReturnValue(chain)

    const req = makeRequest('/api/projects?search=villa')
    await GET(req)

    expect(chain.or).toHaveBeenCalledWith(
      'slug.ilike.%villa%,title->>th.ilike.%villa%,title->>en.ilike.%villa%'
    )
  })

  it('applies category_id filter', async () => {
    const chain = makeChain({ data: [], count: 0, error: null })
    mockFrom.mockReturnValue(chain)

    const req = makeRequest('/api/projects?category_id=cat-uuid-123')
    await GET(req)

    const eqCalls = (chain.eq as ReturnType<typeof vi.fn>).mock.calls as [string, string][]
    expect(eqCalls.some(([k, v]) => k === 'category_id' && v === 'cat-uuid-123')).toBe(true)
  })

  it('applies status filter', async () => {
    const chain = makeChain({ data: [], count: 0, error: null })
    mockFrom.mockReturnValue(chain)

    const req = makeRequest('/api/projects?status=published')
    await GET(req)

    const eqCalls = (chain.eq as ReturnType<typeof vi.fn>).mock.calls as [string, string][]
    expect(eqCalls.some(([k, v]) => k === 'status' && v === 'published')).toBe(true)
  })

  it('respects limit max cap of 50', async () => {
    const chain = makeChain({ data: [], count: 0, error: null })
    mockFrom.mockReturnValue(chain)

    const req = makeRequest('/api/projects?limit=999')
    await GET(req)

    // range should be called with offset=0, end=49 (limit=50)
    expect(chain.range).toHaveBeenCalledWith(0, 49)
  })

  it('returns 500 on DB error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, count: null, error: { message: 'db error' } }))

    const req = makeRequest('/api/projects')
    const res = await GET(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.code).toBe('DB_ERROR')
  })
})

// ══════════════════════════════════════════════════════════════════════════
// POST /api/projects
// ══════════════════════════════════════════════════════════════════════════
describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireRole).mockResolvedValue({ user: EDITOR_USER as never, response: null })
    vi.mocked(getTenantId).mockResolvedValue(TENANT_ID)
  })

  it('creates project successfully and returns 201', async () => {
    const created = { id: 'proj-new', slug: 'my-project', title: { th: 'โปรเจกต์ใหม่' }, status: 'draft' }
    const chain = makeChain({ data: null, error: null })
    // maybeSingle for slug check → no existing
    ;(chain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: null, error: null })
    // single for insert → created project
    ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: created, error: null })
    mockFrom.mockReturnValue(chain)

    const req = makeRequest('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: { th: 'โปรเจกต์ใหม่' }, slug: 'my-project' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('proj-new')
  })

  it('returns 422 when title has no language', async () => {
    const req = makeRequest('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: {}, slug: 'test-slug' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 when slug is invalid (contains uppercase/spaces)', async () => {
    const req = makeRequest('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: { th: 'ทดสอบ' }, slug: 'Invalid Slug!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('returns 409 when slug already exists in tenant', async () => {
    const chain = makeChain({ data: null, error: null })
    ;(chain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: 'existing-proj' },
      error: null,
    })
    mockFrom.mockReturnValue(chain)

    const req = makeRequest('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: { en: 'My Project' }, slug: 'existing-slug' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe('SLUG_CONFLICT')
  })

  it('returns 400 when no tenant selected', async () => {
    vi.mocked(getTenantId).mockRejectedValueOnce(new Error('SUPER_ADMIN_NO_TENANT_SELECTED'))
    const req = makeRequest('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: { th: 'ทดสอบ' }, slug: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('TENANT_NOT_SELECTED')
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    } as never)
    const req = makeRequest('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: { th: 'ทดสอบ' }, slug: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 500 on DB insert error', async () => {
    const chain = makeChain({ data: null, error: null })
    ;(chain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: null, error: null })
    ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: null, error: { message: 'insert failed' } })
    mockFrom.mockReturnValue(chain)

    const req = makeRequest('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: { th: 'ทดสอบ' }, slug: 'new-slug' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.code).toBe('DB_ERROR')
  })
})
