import { redirect } from 'next/navigation'
import { LoginForm } from '@/modules/auth/components/login-form'
import { getCurrentUser } from '@/modules/auth/server'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const user = await getCurrentUser()
  if (user) redirect('/')
  const params = await searchParams

  return <LoginForm initialError={params.error ?? null} />
}
