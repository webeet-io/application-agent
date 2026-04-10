'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveApiKey, deleteApiKey } from '@/modules/auth/actions'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sun, Moon, Eye, EyeOff, KeyRound, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Token {
  id: string
  value: string
  created_at: string
}

interface Props {
  tokens: Token[]
}

function maskKey(value: string) {
  if (value.length <= 10) return '•'.repeat(value.length)
  return value.slice(0, 6) + '••••••••' + value.slice(-4)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function SettingsView({ tokens }: Props) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const [keyValue, setKeyValue] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()
  const [isDeleting, startDeleting] = useTransition()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!keyValue.trim()) return
    setSaveError(null)
    startSaving(async () => {
      const result = await saveApiKey(keyValue.trim())
      if (result.error) {
        setSaveError(result.error)
      } else {
        setKeyValue('')
        router.refresh()
      }
    })
  }

  function handleDelete(id: string) {
    startDeleting(async () => {
      await deleteApiKey(id)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-lg px-6 py-12">
        <h1 className="mb-8 text-2xl font-semibold text-foreground">Settings</h1>

        {/* Appearance */}
        <section className="mb-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Appearance
          </h2>
          <div className="flex overflow-hidden rounded-xl border border-border">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                theme === 'light'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
            <div className="w-px bg-border" />
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                theme === 'dark'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
          </div>
        </section>

        {/* API Keys */}
        <section>
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            API Keys
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Your keys are stored securely and never shown in full.
          </p>

          {/* Add key form */}
          <form onSubmit={handleSave} className="mb-6 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="api-key">OpenAI API Key</Label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:border-primary/40 transition-[border-color]">
                <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  disabled={isSaving}
                  autoComplete="off"
                  className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="shrink-0 text-muted-foreground/60 hover:text-muted-foreground"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}

            <Button type="submit" disabled={isSaving || !keyValue.trim()}>
              {isSaving ? 'Saving…' : 'Save key'}
            </Button>
          </form>

          {/* Key list */}
          {tokens.length > 0 && (
            <div className="flex flex-col gap-2">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-sm text-foreground">{maskKey(token.value)}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(token.created_at)}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(token.id)}
                    disabled={isDeleting}
                    aria-label="Delete key"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
