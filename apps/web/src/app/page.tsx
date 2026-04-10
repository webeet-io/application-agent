import { requireUser } from '@/modules/auth/server'
import { ChatInterface } from '@/modules/chat/components/chat-interface'
import { LogoutButton } from '@/modules/auth/components/logout-button'
import { UserBadge } from '@/modules/auth/components/user-badge'
import { extractUserProfile } from '@/modules/auth/lib/extract-user-profile'

export default async function Home() {
  const user = await requireUser()
  const { avatarUrl, displayName } = extractUserProfile(user)

  return (
    <main className="grid min-h-screen px-5 py-12 md:px-8">
      <div className="mx-auto grid w-full max-w-[940px] gap-4">
        <header className="flex flex-col gap-3 rounded-[26px] border border-[rgba(71,53,40,0.11)] bg-[rgba(252,249,244,0.72)] px-5 py-4 shadow-[0_18px_40px_rgba(65,46,32,0.1)] backdrop-blur-[16px] md:flex-row md:items-center md:justify-between">
          <UserBadge initialAvatarUrl={avatarUrl} initialDisplayName={displayName} />
          <LogoutButton />
        </header>

        <div className="flex min-h-full items-start justify-center">
          <ChatInterface />
        </div>
      </div>
    </main>
  )
}
