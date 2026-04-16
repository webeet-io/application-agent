'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface DeclaredSkill {
  id: string
  skill_name: string
  confidence: 'low' | 'medium' | 'high'
  evidence: string | null
  is_on_resume: boolean
  declared_at: string
}

const CONFIDENCE_STYLE: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export function DeclaredSkillsPanel() {
  const [skills, setSkills] = useState<DeclaredSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [skillName, setSkillName] = useState('')
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium')

  const fetchSkills = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/skill-gap/declared-skills')
      if (res.ok) {
        const body = (await res.json()) as { skills: DeclaredSkill[] }
        setSkills(body.skills)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSkills()
  }, [fetchSkills])

  async function handleAdd() {
    if (!skillName.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/skill-gap/declared-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName: skillName.trim(), confidence }),
      })
      if (res.ok) {
        setSkillName('')
        setConfidence('medium')
        setShowForm(false)
        await fetchSkills()
      }
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(name: string) {
    await fetch(`/api/skill-gap/declared-skills?skillName=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    })
    setSkills((prev) => prev.filter((s) => s.skill_name !== name))
  }

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">My skills</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Add skill
        </button>
      </div>

      {showForm && (
        <div className="mt-3 flex items-center gap-2">
          <Input
            placeholder="Skill name"
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleAdd()
              if (e.key === 'Escape') setShowForm(false)
            }}
            className="h-8 text-sm"
            autoFocus
          />
          <select
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as 'low' | 'medium' | 'high')}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <Button
            size="sm"
            onClick={() => void handleAdd()}
            disabled={adding || !skillName.trim()}
            className="h-8 px-3 text-xs"
          >
            {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
          </Button>
        </div>
      )}

      <div className="mt-3">
        {loading && <p className="text-xs text-muted-foreground">Loading...</p>}
        {!loading && skills.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No skills declared yet. Adding skills helps the plan better reflect what you already know.
          </p>
        )}
        {!loading && skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill.id}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  CONFIDENCE_STYLE[skill.confidence],
                )}
              >
                {skill.skill_name}
                <button
                  onClick={() => void handleRemove(skill.skill_name)}
                  aria-label={`Remove ${skill.skill_name}`}
                  className="opacity-60 transition-opacity hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
