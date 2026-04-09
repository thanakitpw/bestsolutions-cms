import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/navigation
const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error(`REDIRECT:${url}`)
  },
}))

// Mock supabase server client
const mockSignOut = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signOut: mockSignOut,
    },
  })),
}))

describe('logoutAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls signOut and redirects to /login — AC #3', async () => {
    mockSignOut.mockResolvedValue({})

    const { logoutAction } = await import('@/app/(auth)/logout/actions')

    await expect(logoutAction()).rejects.toThrow('REDIRECT:/login')
    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('calls signOut even if it resolves with an error', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'Already signed out' } })

    const { logoutAction } = await import('@/app/(auth)/logout/actions')

    await expect(logoutAction()).rejects.toThrow('REDIRECT:/login')
    expect(mockSignOut).toHaveBeenCalledOnce()
  })
})
