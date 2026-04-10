import Link from 'next/link'
import { redirect } from 'next/navigation'
import { resolveUserOnboardingStateUseCase } from '@/infrastructure/container'
import { WorkspaceShell } from '@/modules/workspace/components/workspace-shell'
import { getWorkspaceUserContext } from '@/modules/workspace/server'

export default async function OpportunitiesPage() {
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
      currentPath="/opportunities"
      userContext={userContext}
      eyebrow="Opportunities"
      title="The future destination after onboarding should already feel intentional."
      description="This page is the natural handoff after a user completes onboarding. It gives the product a clear place to surface relevant job opportunities and later matching results."
      actions={
        <>
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-full border border-[rgba(58,44,33,0.12)] bg-[rgba(255,255,255,0.88)] px-5 py-3 font-semibold text-[#221914] transition duration-150 hover:-translate-y-px hover:border-[rgba(201,109,66,0.28)] hover:bg-[rgba(255,247,241,0.95)]"
          >
            Back to onboarding
          </Link>
          <Link
            href="/career-profile"
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#cb6e44,#9f4e2b)] px-5 py-3 font-semibold text-[#fffaf6] shadow-[0_12px_24px_rgba(159,78,43,0.22)] transition duration-150 hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(159,78,43,0.28)]"
          >
            Open career profile
          </Link>
        </>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="grid gap-4 rounded-[28px] border border-[rgba(71,53,40,0.11)] bg-[rgba(255,252,248,0.78)] p-5 shadow-[0_18px_50px_rgba(65,46,32,0.08)]">
          <div>
            <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
              Destination
            </p>
            <h2 className="mt-2 text-[1.45rem] leading-tight text-[#221914]">
              Opportunities can become the user’s daily surface.
            </h2>
          </div>
          <p className="m-0 text-[0.98rem] leading-[1.7] text-[#594b41]">
            After onboarding is complete, this route can display relevant jobs, ranking logic, and
            later your existing scoring output in a way that feels connected to the user profile.
          </p>
          <div className="grid gap-3">
            <div className="rounded-[22px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.74)] px-4 py-4 text-[0.98rem] leading-[1.65] text-[#594b41]">
              Show curated jobs once the user has enough structured profile data.
            </div>
            <div className="rounded-[22px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.74)] px-4 py-4 text-[0.98rem] leading-[1.65] text-[#594b41]">
              Use the career profile as the stable base for fit, scoring, and future
              recommendations.
            </div>
          </div>
        </article>

        <article className="grid gap-4 rounded-[28px] border border-[rgba(71,53,40,0.11)] bg-[rgba(255,252,248,0.78)] p-5 shadow-[0_18px_50px_rgba(65,46,32,0.08)]">
          <div>
            <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
              Transitional state
            </p>
            <h2 className="mt-2 text-[1.45rem] leading-tight text-[#221914]">
              For now, this page marks the end of the onboarding journey.
            </h2>
          </div>
          <p className="m-0 text-[0.98rem] leading-[1.7] text-[#594b41]">
            It is intentionally simple right now, but it gives the flow a real destination instead
            of dropping the user back into an unrelated screen.
          </p>
        </article>
      </section>
    </WorkspaceShell>
  )
}
