import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock server-only (admin.ts has 'server-only' import)
vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/admin', () => ({
  createServiceRoleClient: vi.fn(),
}))

const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    mockRedirect(path)
    throw new Error(`REDIRECT:${path}`)
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

const mockRevalidatePath = vi.fn()
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

import { switchTenantAction } from './actions'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient)
const mockCreateServerClient = vi.mocked(createServerClient)
const mockCookies = vi.mocked(cookies)

function makeServerClientMock(role: string) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role },
            error: null,
          }),
        }),
      }),
    }),
  }
}

function makeServiceClientMock(tenantData: unknown, tenantError: unknown = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: tenantData,
              error: tenantError,
            }),
          }),
        }),
      }),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('switchTenantAction', () => {
  it('non-super_admin เรียก → ถูก redirect ออก (assertRole guard)', async () => {
    mockCreateServerClient.mockReturnValue(
      makeServerClientMock('admin') as unknown as ReturnType<typeof createServerClient>
    )

    await expect(switchTenantAction('some-tenant-id')).rejects.toThrow('REDIRECT:/')
    expect(mockRedirect).toHaveBeenCalledWith('/')
    expect(mockCookies).not.toHaveBeenCalled()
  })

  it('super_admin + valid tenantId → cookie ถูก set + revalidatePath ถูกเรียก', async () => {
    const mockCookieSet = vi.fn()
    mockCreateServerClient.mockReturnValue(
      makeServerClientMock('super_admin') as unknown as ReturnType<typeof createServerClient>
    )
    mockCreateServiceRoleClient.mockReturnValue(
      makeServiceClientMock({ id: 'tenant-id-valid' }) as unknown as ReturnType<typeof createServiceRoleClient>
    )
    mockCookies.mockResolvedValue({ set: mockCookieSet } as unknown as ReturnType<typeof cookies>)

    await switchTenantAction('tenant-id-valid')

    expect(mockCookieSet).toHaveBeenCalledWith(
      'active_tenant_id',
      'tenant-id-valid',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('super_admin + invalid tenantId → throw error', async () => {
    const mockCookieSet = vi.fn()
    mockCreateServerClient.mockReturnValue(
      makeServerClientMock('super_admin') as unknown as ReturnType<typeof createServerClient>
    )
    mockCreateServiceRoleClient.mockReturnValue(
      makeServiceClientMock(null, { message: 'not found' }) as unknown as ReturnType<typeof createServiceRoleClient>
    )
    mockCookies.mockResolvedValue({ set: mockCookieSet } as unknown as ReturnType<typeof cookies>)

    await expect(switchTenantAction('bad-tenant-id')).rejects.toThrow('Invalid or inactive tenant')
    expect(mockCookieSet).not.toHaveBeenCalled()
  })
})
