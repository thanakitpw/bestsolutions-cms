import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/navigation
const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    // next/navigation redirect throws an error in test env — simulate it
    throw new Error(`REDIRECT:${url}`)
  },
}))

// Mock supabase server client
const mockSignInWithPassword = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}))

describe('loginAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeFormData(fields: Record<string, string>): FormData {
    const fd = new FormData()
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v))
    return fd
  }

  it('returns error when credentials are invalid — AC #2', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })

    const { loginAction } = await import('@/app/(auth)/login/actions')
    const formData = makeFormData({
      email: 'wrong@test.com',
      password: 'badpass',
    })

    const result = await loginAction(null, formData)
    expect(result).toEqual({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
  })

  it('redirects to / after successful login — AC #2', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })

    const { loginAction } = await import('@/app/(auth)/login/actions')
    const formData = makeFormData({
      email: 'admin@test.com',
      password: 'correctpass',
    })

    await expect(loginAction(null, formData)).rejects.toThrow('REDIRECT:/')
    expect(mockRedirect).toHaveBeenCalledWith('/')
  })

  it('redirects to redirectTo param after login — AC #2', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })

    const { loginAction } = await import('@/app/(auth)/login/actions')
    const formData = makeFormData({
      email: 'admin@test.com',
      password: 'correctpass',
      redirectTo: '/projects',
    })

    await expect(loginAction(null, formData)).rejects.toThrow(
      'REDIRECT:/projects'
    )
    expect(mockRedirect).toHaveBeenCalledWith('/projects')
  })

  it('falls back to / when redirectTo is /login — AC #2', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })

    const { loginAction } = await import('@/app/(auth)/login/actions')
    const formData = makeFormData({
      email: 'admin@test.com',
      password: 'correctpass',
      redirectTo: '/login',
    })

    await expect(loginAction(null, formData)).rejects.toThrow('REDIRECT:/')
    expect(mockRedirect).toHaveBeenCalledWith('/')
  })
})
