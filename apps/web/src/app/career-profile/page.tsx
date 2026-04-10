import Link from 'next/link'
import { resolveUserOnboardingStateUseCase } from '@/infrastructure/container'
import { WorkspaceShell } from '@/modules/workspace/components/workspace-shell'
import { getWorkspaceUserContext } from '@/modules/workspace/server'

function ProfileField({ label, description }: { label: string; description: string }) {
  return (
    <article className="rounded-[22px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.74)] px-4 py-4">
      <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
        {label}
      </p>
      <p className="mt-2 text-[0.98rem] leading-[1.65] text-[#594b41]">{description}</p>
    </article>
  )
}

export default async function CareerProfilePage() {
  const userContext = await getWorkspaceUserContext()
  const onboardingStateResult = await resolveUserOnboardingStateUseCase.execute({
    userId: userContext.userId,
  })

  if (!onboardingStateResult.success) {
    throw new Error(onboardingStateResult.error.message)
  }

  const persistedProfile = onboardingStateResult.value.careerProfile

  return (
    <WorkspaceShell
      currentPath="/career-profile"
      userContext={userContext}
      eyebrow="Career Profile"
      title="A dedicated home for structured resume and onboarding knowledge."
      description="This area will become the stable source for job fit, resume scoring, and later mentoring features. It should outlive any single resume upload."
      actions={
        <>
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-full border border-[rgba(58,44,33,0.12)] bg-[rgba(255,255,255,0.88)] px-5 py-3 font-semibold text-[#221914] transition duration-150 hover:-translate-y-px hover:border-[rgba(201,109,66,0.28)] hover:bg-[rgba(255,247,241,0.95)]"
          >
            Return to onboarding
          </Link>
          <Link
            href="/opportunities"
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#cb6e44,#9f4e2b)] px-5 py-3 font-semibold text-[#fffaf6] shadow-[0_12px_24px_rgba(159,78,43,0.22)] transition duration-150 hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(159,78,43,0.28)]"
          >
            View opportunities
          </Link>
        </>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 rounded-[28px] border border-[rgba(71,53,40,0.11)] bg-[rgba(255,252,248,0.78)] p-5 shadow-[0_18px_50px_rgba(65,46,32,0.08)]">
          <ProfileField
            label="Current state"
            description={
              persistedProfile
                ? `A ready career profile already exists with a completeness score of ${persistedProfile.completenessScore}%.`
                : 'No ready career profile exists yet. This page is intentionally available already so the navigation structure stays stable during onboarding.'
            }
          />
          <ProfileField
            label="Identity"
            description="Target roles, seniority, locations, and language preferences will live here as stable profile data."
          />
          <ProfileField
            label="Evidence"
            description="Skills, work history, projects, education, and volunteer experience should be merged from resume parsing and onboarding answers."
          />
          <ProfileField
            label="Readiness"
            description="This page can later show how complete the profile is before sending the user deeper into opportunities and scoring."
          />
        </div>

        <div className="grid gap-4 rounded-[28px] border border-[rgba(71,53,40,0.11)] bg-[rgba(255,252,248,0.78)] p-5 shadow-[0_18px_50px_rgba(65,46,32,0.08)]">
          <div>
            <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
              Why this page matters
            </p>
            <h2 className="mt-2 text-[1.45rem] leading-tight text-[#221914]">
              The profile should be more durable than one CV.
            </h2>
          </div>
          <p className="m-0 text-[0.98rem] leading-[1.7] text-[#594b41]">
            The onboarding flow can fill a draft first, but this page gives the product a long-term
            destination where users later review, improve, and expand their career data.
          </p>
        </div>
      </section>
    </WorkspaceShell>
  )
}
