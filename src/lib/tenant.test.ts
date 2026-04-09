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

import { getTenantId, requireTenant } from './tenant'
import { createServerClient } from '@/lib/supabase/server'

const mockCreateServerClient = vi.mocked(createServerClient)

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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getTenantId', () => {
  it('คืน tenant_id เมื่อ user มี session และมี tenant', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'user-123' },
      userData: { tenant_id: 'tenant-abc', role: 'admin' },
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as ReturnType<typeof createServerClient>)

    const result = await getTenantId()
    expect(result).toBe('tenant-abc')
  })

  it('throw error เมื่อไม่มี session', async () => {
    const mockSupabase = makeSupabaseMock({
      user: null,
      authError: new Error('No session'),
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as ReturnType<typeof createServerClient>)

    await expect(getTenantId()).rejects.toThrow('Unauthorized: No active session')
  })

  it('throw error เมื่อ user profile ไม่พบ', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'user-123' },
      userData: null,
      userError: new Error('Not found'),
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as ReturnType<typeof createServerClient>)

    await expect(getTenantId()).rejects.toThrow('User profile not found')
  })

  it('throw error สำหรับ super_admin (tenant_id = null)', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'super-admin-id' },
      userData: { tenant_id: null, role: 'super_admin' },
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as ReturnType<typeof createServerClient>)

    await expect(getTenantId()).rejects.toThrow('Super admin must specify tenant context')
  })
})

describe('requireTenant', () => {
  it('คืน tenant_id string เมื่อสำเร็จ', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'user-123' },
      userData: { tenant_id: 'tenant-xyz', role: 'editor' },
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as ReturnType<typeof createServerClient>)

    const result = await requireTenant()
    expect(result).toBe('tenant-xyz')
  })

  it('คืน NextResponse 401 เมื่อไม่มี session', async () => {
    const mockSupabase = makeSupabaseMock({
      user: null,
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as ReturnType<typeof createServerClient>)

    const result = await requireTenant()
    // result จะเป็น NextResponse (object ที่ mock คืนมา)
    expect(result).not.toBeTypeOf('string')
  })
})
