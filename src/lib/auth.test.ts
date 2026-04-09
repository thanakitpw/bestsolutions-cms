import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: ResponseInit) => ({ body, init })),
  },
}))

const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    mockRedirect(path)
    // next/navigation redirect throws in real Next.js — simulate by throwing
    throw new Error(`REDIRECT:${path}`)
  },
}))

import { assertRole } from './auth'
import { createServerClient } from '@/lib/supabase/server'

const mockCreateServerClient = vi.mocked(createServerClient)

function makeSupabaseMock(overrides: {
  user?: unknown
  role?: string
  userError?: unknown
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: overrides.user ?? null },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: overrides.role ? { role: overrides.role } : null,
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

describe('assertRole', () => {
  it('ไม่มี session → redirect /login', async () => {
    const mockSupabase = makeSupabaseMock({ user: null })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)

    await expect(assertRole('admin')).rejects.toThrow('REDIRECT:/login')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('role editor + ต้องการ admin → redirect /', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'editor-id' },
      role: 'editor',
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)

    await expect(assertRole('admin')).rejects.toThrow('REDIRECT:/')
    expect(mockRedirect).toHaveBeenCalledWith('/')
  })

  it('role editor + ต้องการ editor → ไม่ redirect (pass through)', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'editor-id' },
      role: 'editor',
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)

    await expect(assertRole('editor')).resolves.toBeUndefined()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('role admin + ต้องการ admin → ไม่ redirect', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'admin-id' },
      role: 'admin',
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)

    await expect(assertRole('admin')).resolves.toBeUndefined()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('role admin + ต้องการ super_admin → redirect /', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'admin-id' },
      role: 'admin',
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)

    await expect(assertRole('super_admin')).rejects.toThrow('REDIRECT:/')
    expect(mockRedirect).toHaveBeenCalledWith('/')
  })

  it('role super_admin + ต้องการ super_admin → ไม่ redirect', async () => {
    const mockSupabase = makeSupabaseMock({
      user: { id: 'super-id' },
      role: 'super_admin',
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)

    await expect(assertRole('super_admin')).resolves.toBeUndefined()
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})
