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

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12 md:px-8">
      <div className="w-full max-w-[720px]">
        <LoginForm initialError={params.error ?? null} />
      </div>
    </main>
  )
}
