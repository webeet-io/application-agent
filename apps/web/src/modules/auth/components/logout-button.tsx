'use client'

import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className="rounded-full border border-[rgba(58,44,33,0.12)] bg-[rgba(255,255,255,0.9)] px-4 py-2 text-[0.84rem] font-semibold text-[#221914] transition duration-150 hover:-translate-y-px hover:border-[rgba(201,109,66,0.28)] hover:bg-[rgba(255,247,241,0.95)]"
    >
      Sign out
    </button>
  )
}
