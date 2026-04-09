'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface LoginState {
  error: string | null
}

export async function loginAction(
  _prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string | null

  const supabase = createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  }

  redirect(redirectTo && redirectTo !== '/login' ? redirectTo : '/')
}
