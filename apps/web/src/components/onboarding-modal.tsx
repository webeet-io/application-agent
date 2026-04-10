'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createProfile } from '@/modules/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import logo from '@/assets/logo.png'

export function OnboardingModal() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = username.trim()
    if (!trimmed) return

    setError(null)
    startTransition(async () => {
      const result = await createProfile(trimmed)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-background p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src={logo} alt="CeeVee" width={56} height={56} className="mb-4 rounded-2xl" />
          <h2 className="text-2xl font-semibold text-foreground">Welcome to CeeVee!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;re in. Choose a username to get started — you can always update it later.
          </p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="e.g. david_rajcher"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isPending}
              autoFocus
              autoComplete="off"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isPending || !username.trim()} className="w-full">
            {isPending ? 'Saving…' : 'Get started'}
          </Button>
        </form>
      </div>
    </div>
  )
}
