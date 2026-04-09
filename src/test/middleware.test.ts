import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock @supabase/ssr
const mockGetClaims = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getClaims: mockGetClaims,
    },
  })),
}))

// Patch NextResponse.next to avoid "request.headers must be instance of Headers" in happy-dom
const realRedirect = NextResponse.redirect.bind(NextResponse)
vi.spyOn(NextResponse, 'next').mockImplementation((_init?: ResponseInit) => {
  return new NextResponse(null, { status: 200 })
})

// Helper: create NextRequest
function makeRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    headers: new Headers({ host: 'localhost' }),
  })
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-apply the mock after clearAllMocks
    vi.spyOn(NextResponse, 'next').mockImplementation((_init?: ResponseInit) => {
      return new NextResponse(null, { status: 200 })
    })
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  describe('public paths — bypass auth', () => {
    it('allows /api/public/... without auth check', async () => {
      const { middleware } = await import('@/middleware')
      const req = makeRequest('/api/public/projects')
      const res = await middleware(req)
      // Should not redirect
      expect(res.status).not.toBe(307)
      // getClaims should NOT be called (bypassed)
      expect(mockGetClaims).not.toHaveBeenCalled()
    })
  })

  describe('legacy /auth/* redirect', () => {
    it('redirects /auth/login to /login', async () => {
      const { middleware } = await import('@/middleware')
      const req = makeRequest('/auth/login')
      const res = await middleware(req)
      expect(res.status).toBe(307)
      const location = res.headers.get('location') ?? ''
      expect(location).toContain('/login')
      expect(location).not.toContain('/auth/')
    })

    it('redirects /auth/sign-up to /login', async () => {
      const { middleware } = await import('@/middleware')
      const req = makeRequest('/auth/sign-up')
      const res = await middleware(req)
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/login')
    })
  })

  describe('unauthenticated user — AC #1', () => {
    beforeEach(() => {
      mockGetClaims.mockResolvedValue({ data: { claims: null }, error: null })
    })

    it('allows /login through (returns 200)', async () => {
      const { middleware } = await import('@/middleware')
      const req = makeRequest('/login')
      const res = await middleware(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('location')).toBeNull()
    })

    it('redirects to /login when accessing /', async () => {
      const { middleware } = await import('@/middleware')
      const req = makeRequest('/')
      const res = await middleware(req)
      expect(res.status).toBe(307)
      const location = res.headers.get('location') ?? ''
      expect(location).toContain('/login')
    })

    it('stores original path as redirectTo query param', async () => {
      const { middleware } = await import('@/middleware')
      const req = makeRequest('/projects')
      const res = await middleware(req)
      expect(res.status).toBe(307)
      const location = res.headers.get('location') ?? ''
      expect(location).toContain('redirectTo=%2Fprojects')
    })

    it('redirects to /login when accessing /settings', async () => {
      const { middleware } = await import('@/middleware')
      const req = makeRequest('/settings')
      const res = await middleware(req)
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/login')
    })
  })

  describe('authenticated user — AC #1, #2', () => {
    beforeEach(() => {
      mockGetClaims.mockResolvedValue({
        data: { claims: { sub: 'user-123', email: 'admin@test.com' } },
        error: null,
      })
    })

    it('allows access to / when authenticated (returns 200)', async () => {
      const { middleware } = await import('@/middleware')
      const req = makeRequest('/')
      const res = await middleware(req)
      expect(res.status).toBe(200)
    })

    it('redirects authenticated user away from /login to /', async () => {
      const { middleware } = await import('@/middleware')
      const req = makeRequest('/login')
      const res = await middleware(req)
      expect(res.status).toBe(307)
      const location = res.headers.get('location') ?? ''
      // Should redirect to root, not back to /login
      expect(location).toMatch(/http:\/\/localhost\/?$/)
    })

    it('allows access to /projects when authenticated (returns 200)', async () => {
      const { middleware } = await import('@/middleware')
      const req = makeRequest('/projects')
      const res = await middleware(req)
      expect(res.status).toBe(200)
    })
  })
})
