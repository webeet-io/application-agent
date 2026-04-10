'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'

interface Props {
  username: string
  email: string
}

export function ProfileView({ username, email }: Props) {
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-lg px-6 py-12">
        <h1 className="mb-8 text-2xl font-semibold text-foreground">Account</h1>

        <div className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Username
              </span>
              <span className="text-sm font-medium text-foreground">{username}</span>
            </div>
            <button
              disabled
              aria-label="Edit username"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40 cursor-not-allowed"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </span>
              <span className="text-sm font-medium text-foreground">{email}</span>
            </div>
            <button
              disabled
              aria-label="Edit email"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40 cursor-not-allowed"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-col gap-3">
            <Button onClick={() => void handleLogout()} variant="outline" className="w-full">
              Sign out
            </Button>
            <Button
              disabled
              variant="ghost"
              className="w-full text-destructive hover:text-destructive cursor-not-allowed opacity-50"
            >
              Delete account
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
