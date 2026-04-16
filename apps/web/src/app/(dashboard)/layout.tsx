import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { OnboardingModal } from '@/components/onboarding-modal'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('auth_id', user.id)
    .maybeSingle()

  const username = profile?.username ?? user.email ?? 'You'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar username={username} />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      {!profile && <OnboardingModal />}
    </div>
  )
}
