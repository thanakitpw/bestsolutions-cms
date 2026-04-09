'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState<LoginState | null, FormData>(
    loginAction,
    null
  )

  return (
    <div className="flex min-h-screen">
      {/* Left — Brand */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#1A1A1A] p-[60px] lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
            <span className="text-sm font-bold text-[#1A1A1A]">BS</span>
          </div>
          <span className="text-xl font-bold tracking-[0.04em] text-white">
            BEST SOLUTIONS
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-[40px] font-bold leading-[1.15] text-white">
            Manage your
            <br />
            content with ease
          </h1>
          <p className="max-w-[400px] text-[15px] leading-[1.6] text-white/50">
            Your admin panel for managing projects, blog articles, and client
            messages — all in one place.
          </p>
        </div>

        <span className="text-xs text-white/25">
          &copy; {new Date().getFullYear()} Best Solutions. All rights reserved.
        </span>
      </div>

      {/* Right — Form */}
      <div className="flex w-full items-center justify-center bg-[#FAFAF8] px-8 lg:w-1/2">
        <form action={formAction} className="flex w-[360px] flex-col gap-7">
          <input type="hidden" name="redirectTo" value={redirectTo ?? '/'} />

          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Welcome back</h2>
            <p className="text-sm text-[#999]">Sign in to your admin account</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
                Email
              </Label>
              <Input
                type="email"
                name="email"
                placeholder="admin@bestsolutions.co"
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
                Password
              </Label>
              {/* key trick: force re-render to clear password on error */}
              <Input
                key={state?.error ? Date.now() : 'password'}
                type="password"
                name="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {state?.error && (
            <p className="text-[13px] text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full py-6" disabled={isPending}>
            {isPending ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="text-center text-xs text-[#999]">
            Need help? Contact your developer
          </p>
        </form>
      </div>
    </div>
  )
}
