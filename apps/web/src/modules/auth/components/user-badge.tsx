'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { extractUserProfile } from '@/modules/auth/lib/extract-user-profile'

export function UserBadge({
  initialAvatarUrl,
  initialDisplayName,
}: {
  initialAvatarUrl: string | null
  initialDisplayName: string
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [displayName, setDisplayName] = useState(initialDisplayName)

  useEffect(() => {
    let cancelled = false

    async function hydrateProfile() {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (!data.user || cancelled) return

      const profile = extractUserProfile(data.user)
      setAvatarUrl(profile.avatarUrl)
      setDisplayName(profile.displayName)
    }

    void hydrateProfile()

    return () => {
      cancelled = true
    }
  }, [])

  const avatarFallback = displayName.slice(0, 1).toUpperCase()

  return (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          referrerPolicy="no-referrer"
          className="h-12 w-12 rounded-full border border-[rgba(71,53,40,0.12)] object-cover shadow-[0_8px_18px_rgba(65,46,32,0.12)]"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(71,53,40,0.12)] bg-[rgba(255,255,255,0.92)] text-[0.95rem] font-bold text-[#7a5a46] shadow-[0_8px_18px_rgba(65,46,32,0.08)]">
          {avatarFallback}
        </div>
      )}

      <div>
        <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#8a735f]">
          Authenticated session
        </p>
        <h1 className="m-0 text-[1.4rem] leading-tight text-[#221914]">CeeVee workspace</h1>
        <p className="m-0 text-[0.94rem] text-[#5e4e43]">{displayName}</p>
      </div>
    </div>
  )
}
