'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createProfile(username: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('profiles')
    .insert({ auth_id: user.id, username: username.trim() })

  if (error) {
    if (error.code === '23505') return { error: 'That username is already taken.' }
    return { error: error.message }
  }

  return { error: null }
}

export async function saveApiKey(value: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('tokens')
    .insert({ auth_id: user.id, value: value.trim() })

  if (error) return { error: error.message }
  return { error: null }
}

export async function deleteApiKey(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('tokens').delete().eq('id', id).eq('auth_id', user.id)

  if (error) return { error: error.message }
  return { error: null }
}
