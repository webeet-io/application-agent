import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileView } from './profile-view'

export default async function ProfilePage() {
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

  return (
    <ProfileView
      username={profile?.username ?? ''}
      email={user.email ?? ''}
    />
  )
}
