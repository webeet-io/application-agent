import Link from 'next/link'
import { LogoutButton } from '@/modules/auth/components/logout-button'
import { UserBadge } from '@/modules/auth/components/user-badge'
import { extractUserProfile } from '@/modules/auth/lib/extract-user-profile'
import { requireUser } from '@/modules/auth/server'
import { ChatInterface } from '@/modules/chat/components/chat-interface'

export default async function Home() {
  const user = await requireUser()
  const { avatarUrl, displayName } = extractUserProfile(user)

  return (
    <main className="px-5 py-10 md:px-8 md:py-12">
      <div className="mx-auto grid w-full max-w-[1240px] gap-8">
        <header className="flex flex-col gap-3 rounded-[26px] border border-[rgba(71,53,40,0.11)] bg-[rgba(252,249,244,0.72)] px-5 py-4 shadow-[0_18px_40px_rgba(65,46,32,0.1)] backdrop-blur-[16px] md:flex-row md:items-center md:justify-between">
          <UserBadge initialAvatarUrl={avatarUrl} initialDisplayName={displayName} />
          <LogoutButton />
        </header>

        <section className="grid gap-4 rounded-[34px] border border-[rgba(71,53,40,0.11)] bg-[rgba(252,249,244,0.82)] p-6 shadow-[0_28px_80px_rgba(65,46,32,0.16)] backdrop-blur-[18px]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[42rem]">
              <p className="m-0 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#8d7667]">
                CeeVee
              </p>
              <h1 className="mt-3 text-[clamp(2.1rem,4vw,3.8rem)] leading-[0.95] text-[#221914]">
                Chat and scoring preview in one calm workspace.
              </h1>
              <p className="mt-4 text-[1rem] leading-[1.7] text-[#594b41]">
                The main page stays focused on chat, while the dedicated match preview route shows
                how our resume scoring can later be presented in the product.
              </p>
            </div>
            <Link
              href="/match-preview"
              className="inline-flex w-fit items-center justify-center rounded-full bg-[linear-gradient(135deg,#cb6e44,#9f4e2b)] px-5 py-3 font-bold text-[#fffaf6] shadow-[0_12px_24px_rgba(159,78,43,0.22)] transition duration-150 hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(159,78,43,0.28)]"
            >
              Open match preview
            </Link>
          </div>
        </section>

        <div className="flex min-h-full items-start justify-center">
          <div className="w-full max-w-[940px]">
            <ChatInterface />
          </div>
        </div>
      </div>
    </main>
  )
}
