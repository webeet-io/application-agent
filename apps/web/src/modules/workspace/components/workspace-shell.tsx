import Link from 'next/link'
import type { ReactNode } from 'react'
import { LogoutButton } from '@/modules/auth/components/logout-button'
import { UserBadge } from '@/modules/auth/components/user-badge'
import { extractUserProfile } from '@/modules/auth/lib/extract-user-profile'
import { requireUser } from '@/modules/auth/server'

interface WorkspaceShellProps {
  currentPath: '/' | '/onboarding' | '/career-profile' | '/opportunities'
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}

const navigationItems: Array<{
  href: WorkspaceShellProps['currentPath']
  label: string
  shortLabel: string
}> = [
  { href: '/', label: 'Workspace', shortLabel: 'Home' },
  { href: '/onboarding', label: 'Onboarding', shortLabel: 'Flow' },
  { href: '/career-profile', label: 'Career Profile', shortLabel: 'Profile' },
  { href: '/opportunities', label: 'Opportunities', shortLabel: 'Explore' },
]

function getNavigationClassName(isActive: boolean) {
  if (isActive) {
    return 'border-[rgba(159,78,43,0.2)] bg-[linear-gradient(135deg,rgba(255,247,240,0.98),rgba(248,236,228,0.94))] text-[#7d3f23] shadow-[0_12px_22px_rgba(159,78,43,0.12)]'
  }

  return 'border-[rgba(71,53,40,0.11)] bg-[rgba(255,255,255,0.7)] text-[#594b41] hover:-translate-y-px hover:border-[rgba(201,109,66,0.28)] hover:bg-[rgba(255,250,246,0.92)]'
}

export async function WorkspaceShell({
  currentPath,
  eyebrow,
  title,
  description,
  actions,
  children,
}: WorkspaceShellProps) {
  const user = await requireUser()
  const { avatarUrl, displayName } = extractUserProfile(user)

  return (
    <main className="px-5 py-10 md:px-8 md:py-12">
      <div className="mx-auto grid w-full max-w-[1240px] gap-8">
        <header className="flex flex-col gap-3 rounded-[26px] border border-[rgba(71,53,40,0.11)] bg-[rgba(252,249,244,0.72)] px-5 py-4 shadow-[0_18px_40px_rgba(65,46,32,0.1)] backdrop-blur-[16px] md:flex-row md:items-center md:justify-between">
          <UserBadge initialAvatarUrl={avatarUrl} initialDisplayName={displayName} />
          <LogoutButton />
        </header>

        <nav
          aria-label="Workspace navigation"
          className="grid gap-3 rounded-[28px] border border-[rgba(71,53,40,0.11)] bg-[rgba(252,249,244,0.7)] p-3 shadow-[0_18px_40px_rgba(65,46,32,0.08)] backdrop-blur-[16px] md:grid-cols-4"
        >
          {navigationItems.map((item) => {
            const isActive = item.href === currentPath

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`grid gap-1 rounded-[22px] border px-4 py-4 transition duration-150 ${getNavigationClassName(isActive)}`}
              >
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
                  {item.shortLabel}
                </span>
                <span className="text-[1.04rem] font-semibold leading-tight">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <section className="grid gap-5 rounded-[34px] border border-[rgba(71,53,40,0.11)] bg-[rgba(252,249,244,0.82)] p-6 shadow-[0_28px_80px_rgba(65,46,32,0.16)] backdrop-blur-[18px]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[44rem]">
              <p className="m-0 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#8d7667]">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-[clamp(2.1rem,4vw,3.8rem)] leading-[0.95] text-[#221914]">
                {title}
              </h1>
              <p className="mt-4 text-[1rem] leading-[1.7] text-[#594b41]">{description}</p>
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
          </div>
        </section>

        {children}
      </div>
    </main>
  )
}
