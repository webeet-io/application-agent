'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import logo from '@/assets/logo.png'
import {
  Briefcase,
  UserCircle,
  LayoutGrid,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  CircleUser,
} from 'lucide-react'

const topNav = [
  { href: '/', label: 'Opportunities', icon: Briefcase },
  { href: '/career-profile', label: 'Career Profile', icon: UserCircle },
  { href: '/tracker', label: 'Tracker', icon: LayoutGrid },
  { href: '/learning', label: 'Learning', icon: BookOpen },
]

const bottomNav = [{ href: '/settings', label: 'Settings', icon: Settings }]

interface Props {
  username: string
}

export function DashboardSidebar({ username }: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored !== null) setCollapsed(stored === 'true')
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  return (
    <aside
      className={cn(
        'flex h-screen shrink-0 flex-col bg-primary text-primary-foreground transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo + toggle */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center px-3',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <>
            <div className="flex items-center gap-2">
              <Image src={logo} alt="CeeVee" width={28} height={28} className="rounded-md" />
              <span className="text-base font-bold tracking-tight text-white">CeeVee</span>
            </div>
            <button
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-primary-foreground/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
        {collapsed && (
          <button
            onClick={toggle}
            aria-label="Expand sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-primary-foreground/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Top nav — scrollable if content overflows */}
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-2">
        {topNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-foreground/15 text-primary-foreground'
                  : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom nav — pinned to bottom, never shrinks */}
      <div className="flex shrink-0 flex-col gap-1 border-t border-primary-foreground/10 px-2 py-3">
        {bottomNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-foreground/15 text-primary-foreground'
                  : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}

        {/* User row */}
        <Link
          href="/profile"
          className={cn(
            'mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground',
            pathname === '/profile' && 'bg-primary-foreground/15 text-primary-foreground',
            collapsed && 'justify-center px-2'
          )}
        >
          <CircleUser className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">{username}</span>}
        </Link>
      </div>
    </aside>
  )
}
