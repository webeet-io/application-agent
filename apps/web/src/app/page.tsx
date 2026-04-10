import Link from 'next/link'
import { redirect } from 'next/navigation'
import { resolveUserOnboardingStateUseCase } from '@/infrastructure/container'
import { ChatInterface } from '@/modules/chat/components/chat-interface'
import { WorkspaceShell } from '@/modules/workspace/components/workspace-shell'
import { getWorkspaceUserContext } from '@/modules/workspace/server'

export default async function Home() {
  const userContext = await getWorkspaceUserContext()
  const onboardingStateResult = await resolveUserOnboardingStateUseCase.execute({
    userId: userContext.userId,
  })

  if (!onboardingStateResult.success) {
    throw new Error(onboardingStateResult.error.message)
  }

  if (onboardingStateResult.value.status !== 'profile_ready') {
    redirect('/onboarding')
  }

  return (
    <WorkspaceShell
      currentPath="/"
      userContext={userContext}
      eyebrow="CeeVee Workspace"
      title="Chat, onboarding, and profile structure in one calm workspace."
      description="This workspace now prepares the onboarding flow with clear navigation. The chat remains available here, while Career Profile and Opportunities already have dedicated destinations in the product."
      actions={
        <Link
          href="/match-preview"
          className="inline-flex w-fit items-center justify-center rounded-full bg-[linear-gradient(135deg,#cb6e44,#9f4e2b)] px-5 py-3 font-bold text-[#fffaf6] shadow-[0_12px_24px_rgba(159,78,43,0.22)] transition duration-150 hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(159,78,43,0.28)]"
        >
          Open match preview
        </Link>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="grid gap-4 rounded-[30px] border border-[rgba(71,53,40,0.11)] bg-[rgba(255,252,248,0.76)] p-5 shadow-[0_18px_50px_rgba(65,46,32,0.08)]">
          <div>
            <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
              Next Build-Up
            </p>
            <h2 className="mt-2 text-[1.6rem] leading-tight text-[#221914]">
              The foundation for onboarding is in place.
            </h2>
          </div>
          <div className="grid gap-3 text-[0.98rem] leading-[1.65] text-[#594b41]">
            <div className="rounded-[22px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.74)] px-4 py-4">
              Use <strong>Onboarding</strong> for the guided flow with resume upload, questions, and
              session progress.
            </div>
            <div className="rounded-[22px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.74)] px-4 py-4">
              Your <strong>Career Profile</strong> is already considered ready enough to unlock the
              main workspace.
            </div>
            <div className="rounded-[22px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.74)] px-4 py-4">
              Use <strong>Opportunities</strong> as the target destination after onboarding is
              complete.
            </div>
          </div>
        </article>

        <div className="flex min-h-full items-start justify-center">
          <div className="w-full max-w-[940px]">
            <ChatInterface />
          </div>
        </div>
      </section>
    </WorkspaceShell>
  )
}
