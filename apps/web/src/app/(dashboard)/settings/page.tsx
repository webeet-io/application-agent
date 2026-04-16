import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsView } from './settings-view'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tokens } = await supabase
    .from('tokens')
    .select('id, value, created_at')
    .eq('auth_id', user.id)
    .order('created_at', { ascending: false })

  return <SettingsView tokens={tokens ?? []} />
}
