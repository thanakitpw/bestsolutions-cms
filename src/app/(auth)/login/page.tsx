import { LoginForm } from '@/components/auth/login-form'

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo } = await searchParams
  return <LoginForm redirectTo={redirectTo} />
}
