import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── helpers ────────────────────────────────────────────────────────────────
const mockProject = {
  id: 'proj-1',
  tenant_id: 'tenant-1',
  title: { th: 'ทดสอบ', en: 'Test' },
  slug: 'test-project',
  status: 'draft',
  deleted_at: null,
  published_at: null,
  category: null,
}

function createMockChain(overrides?: {
  singleData?: unknown
  singleError?: unknown
  maybySingleData?: unknown
  updateError?: unknown
}) {
  const chain: Record<string, unknown> = {}
  const methods = ['from', 'select', 'eq', 'is', 'neq', 'update', 'insert']
  for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain)
  chain.maybeSingle = vi.fn().mockResolvedValue({
    data: overrides?.maybySingleData ?? null,
    error: null,
  })
  chain.single = vi.fn().mockResolvedValue({
    data: overrides?.singleData !== undefined ? overrides.singleData : mockProject,
    error: overrides?.singleError ?? null,
  })
  return chain
}

// ── mocks ──────────────────────────────────────────────────────────────────
const mockSupabaseChain = createMockChain()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => mockSupabaseChain),
}))

vi.mock('@/lib/auth', () => ({
  requireRole: vi.fn().mockResolvedValue({ user: { id: 'user-1' } as never, response: null }),
}))

vi.mock('@/lib/tenant', () => ({
  getTenantId: vi.fn().mockResolvedValue('tenant-1'),
}))

// ── imports after mocks ────────────────────────────────────────────────────
import { GET, PATCH, DELETE } from './route'
import { requireRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { createServerClient } from '@/lib/supabase/server'

const mockParams = Promise.resolve({ id: 'proj-1' })

function makeRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(url, options)
}

// ══════════════════════════════════════════════════════════════════════════
// GET /api/projects/[id]
// ══════════════════════════════════════════════════════════════════════════
describe('GET /api/projects/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireRole).mockResolvedValue({ user: { id: 'user-1' } as never, response: null })
    vi.mocked(getTenantId).mockResolvedValue('tenant-1')
  })

  it('returns project when found', async () => {
    const chain = createMockChain({ singleData: mockProject })
    vi.mocked(createServerClient).mockReturnValue(chain as never)

    const req = makeRequest('http://localhost/api/projects/proj-1')
    const res = await GET(req, { params: mockParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('proj-1')
  })

  it('returns 404 when project not found', async () => {
    const chain = createMockChain({ singleData: null, singleError: { code: 'PGRST116' } })
    vi.mocked(createServerClient).mockReturnValue(chain as never)

    const req = makeRequest('http://localhost/api/projects/not-found')
    const res = await GET(req, { params: Promise.resolve({ id: 'not-found' }) })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.code).toBe('NOT_FOUND')
  })

  it('returns 400 when no tenant selected', async () => {
    vi.mocked(getTenantId).mockRejectedValueOnce(new Error('no tenant'))

    const req = makeRequest('http://localhost/api/projects/proj-1')
    const res = await GET(req, { params: mockParams })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('TENANT_NOT_SELECTED')
  })

  it('returns 403 when editor role denied', async () => {
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: null,
      response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    } as never)

    const req = makeRequest('http://localhost/api/projects/proj-1')
    const res = await GET(req, { params: mockParams })
    expect(res.status).toBe(403)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// PATCH /api/projects/[id]
// ══════════════════════════════════════════════════════════════════════════
describe('PATCH /api/projects/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireRole).mockResolvedValue({ user: { id: 'user-1' } as never, response: null })
    vi.mocked(getTenantId).mockResolvedValue('tenant-1')
  })

  it('updates project fields and returns 200', async () => {
    const updated = { ...mockProject, title: { th: 'อัปเดต', en: 'Updated' } }
    const chain = createMockChain({ singleData: updated })
    vi.mocked(createServerClient).mockReturnValue(chain as never)

    const req = makeRequest('http://localhost/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: { th: 'อัปเดต', en: 'Updated' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title.th).toBe('อัปเดต')
  })

  it('returns 422 for invalid slug (uppercase/spaces)', async () => {
    const chain = createMockChain()
    vi.mocked(createServerClient).mockReturnValue(chain as never)

    const req = makeRequest('http://localhost/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ slug: 'INVALID SLUG!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 409 when slug conflict with another project', async () => {
    const chain = createMockChain({ maybySingleData: { id: 'other-project' } })
    vi.mocked(createServerClient).mockReturnValue(chain as never)

    const req = makeRequest('http://localhost/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ slug: 'existing-slug' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe('SLUG_CONFLICT')
  })

  it('sets published_at when status changes to published and published_at is null', async () => {
    const unpublishedProject = { ...mockProject, published_at: null }
    const publishedProject = { ...mockProject, status: 'published', published_at: '2026-04-11T00:00:00Z' }

    // First single() call: fetch current published_at → null
    // Second single() call: return updated project with published_at set
    const chain: Record<string, unknown> = {}
    const methods = ['from', 'select', 'eq', 'is', 'neq', 'update', 'insert']
    for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain)
    chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    chain.single = vi
      .fn()
      .mockResolvedValueOnce({ data: unpublishedProject, error: null }) // fetch current
      .mockResolvedValueOnce({ data: publishedProject, error: null }) // final update

    vi.mocked(createServerClient).mockReturnValue(chain as never)

    const req = makeRequest('http://localhost/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('published')
  })

  it('returns 400 when no tenant selected', async () => {
    vi.mocked(getTenantId).mockRejectedValueOnce(new Error('no tenant'))

    const req = makeRequest('http://localhost/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: { th: 'ทดสอบ' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(400)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// DELETE /api/projects/[id]
// ══════════════════════════════════════════════════════════════════════════
describe('DELETE /api/projects/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireRole).mockResolvedValue({ user: { id: 'user-1' } as never, response: null })
    vi.mocked(getTenantId).mockResolvedValue('tenant-1')
  })

  it('soft-deletes project and returns { success: true }', async () => {
    const chain: Record<string, unknown> = {}
    const methods = ['from', 'select', 'eq', 'is', 'neq', 'update', 'insert']
    for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null })
    chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    // update().eq().eq() resolves to { error: null }
    ;(chain.eq as ReturnType<typeof vi.fn>).mockReturnValue(
      Object.assign(Promise.resolve({ error: null }), chain)
    )
    vi.mocked(createServerClient).mockReturnValue(chain as never)

    const req = makeRequest('http://localhost/api/projects/proj-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: mockParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 403 when editor (not admin) tries to delete', async () => {
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: null,
      response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    } as never)

    const req = makeRequest('http://localhost/api/projects/proj-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: mockParams })
    expect(res.status).toBe(403)
  })

  it('returns 400 when no tenant selected', async () => {
    vi.mocked(getTenantId).mockRejectedValueOnce(new Error('no tenant'))

    const req = makeRequest('http://localhost/api/projects/proj-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: mockParams })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('TENANT_NOT_SELECTED')
  })
})
