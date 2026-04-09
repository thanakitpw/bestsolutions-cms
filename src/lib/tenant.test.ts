import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock ทั้ง module ก่อน import
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: ResponseInit) => ({ body, init })),
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { getTenantId, requireTenant } from './tenant'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const mockCreateServerClient = vi.mocked(createServerClient)
const mockCookies = vi.mocked(cookies)

function makeSupabaseMock(overrides: {
  user?: unknown
  authError?: unknown
  userData?: unknown
  userError?: unknown
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: overrides.user ?? null },
        error: overrides.authError ?? null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: overrides.userData ?? null,
            error: overrides.userError ?? null,
          }),
        }),
      }),
    }),
  }
}

function makeCookieStoreMock(value?: string) {
  return {
    get: vi.fn().mockReturnValue(value ? { value } : undefined),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getTenantId', () => {
  it('คืน tenant_id เมื่อ user มี session และมี tenant', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'user-123' },
      userData: { tenant_id: 'tenant-abc', role: 'admin' },
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)

    const result = await getTenantId()
    expect(result).toBe('tenant-abc')
  })

  it('throw error เมื่อไม่มี session', async () => {
    const mockSupabase = makeSupabaseMock({
      user: null,
      authError: new Error('No session'),
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)

    await expect(getTenantId()).rejects.toThrow('Unauthorized: No active session')
  })

  it('throw error เมื่อ user profile ไม่พบ', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'user-123' },
      userData: null,
      userError: new Error('Not found'),
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)

    await expect(getTenantId()).rejects.toThrow('User profile not found')
  })

  it('super_admin มี cookie active_tenant_id → คืน cookie value', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'super-admin-id' },
      userData: { tenant_id: null, role: 'super_admin' },
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)
    mockCookies.mockResolvedValue(makeCookieStoreMock('tenant-from-cookie') as unknown as ReturnType<typeof cookies>)

    const result = await getTenantId()
    expect(result).toBe('tenant-from-cookie')
  })

  it('super_admin ไม่มี cookie → throw SUPER_ADMIN_NO_TENANT_SELECTED', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'super-admin-id' },
      userData: { tenant_id: null, role: 'super_admin' },
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)
    mockCookies.mockResolvedValue(makeCookieStoreMock(undefined) as unknown as ReturnType<typeof cookies>)

    await expect(getTenantId()).rejects.toThrow('SUPER_ADMIN_NO_TENANT_SELECTED')
  })

  it('regular admin → อ่านจาก users.tenant_id (ไม่เรียก cookies)', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'admin-id' },
      userData: { tenant_id: 'tenant-regular', role: 'admin' },
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)

    const result = await getTenantId()
    expect(result).toBe('tenant-regular')
    expect(mockCookies).not.toHaveBeenCalled()
  })
})

describe('requireTenant', () => {
  it('คืน tenant_id string เมื่อสำเร็จ (regular user)', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'user-123' },
      userData: { tenant_id: 'tenant-xyz', role: 'editor' },
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)

    const result = await requireTenant()
    expect(result).toBe('tenant-xyz')
  })

  it('คืน NextResponse 401 เมื่อไม่มี session', async () => {
    const mockSupabase = makeSupabaseMock({
      user: null,
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)

    const result = await requireTenant()
    expect(result).not.toBeTypeOf('string')
  })

  it('super_admin ไม่มี cookie → คืน NextResponse 400 code TENANT_NOT_SELECTED', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'super-admin-id' },
      userData: { tenant_id: null, role: 'super_admin' },
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)
    mockCookies.mockResolvedValue(makeCookieStoreMock(undefined) as unknown as ReturnType<typeof cookies>)

    const result = await requireTenant() as { body: unknown; init: ResponseInit }
    expect(result).not.toBeTypeOf('string')
    expect(result.body).toMatchObject({ code: 'TENANT_NOT_SELECTED' })
    expect(result.init).toMatchObject({ status: 400 })
  })
})
