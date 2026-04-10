import Link from 'next/link'
import { redirect } from 'next/navigation'
import { resolveUserOnboardingStateUseCase } from '@/infrastructure/container'
import { WorkspaceShell } from '@/modules/workspace/components/workspace-shell'
import { getWorkspaceUserContext } from '@/modules/workspace/server'

function ActionLink({
  href,
  label,
  tone,
}: {
  href: string
  label: string
  tone: 'primary' | 'secondary'
}) {
  const className =
    tone === 'primary'
      ? 'bg-[linear-gradient(135deg,#cb6e44,#9f4e2b)] text-[#fffaf6] shadow-[0_12px_24px_rgba(159,78,43,0.22)] hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(159,78,43,0.28)]'
      : 'border border-[rgba(58,44,33,0.12)] bg-[rgba(255,255,255,0.88)] text-[#221914] hover:-translate-y-px hover:border-[rgba(201,109,66,0.28)] hover:bg-[rgba(255,247,241,0.95)]'

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-5 py-3 font-semibold transition duration-150 ${className}`}
    >
      {label}
    </Link>
  )
}

export default async function OnboardingPage() {
  const userContext = await getWorkspaceUserContext()
  const onboardingStateResult = await resolveUserOnboardingStateUseCase.execute({
    userId: userContext.userId,
  })

  if (!onboardingStateResult.success) {
    throw new Error(onboardingStateResult.error.message)
  }

  if (onboardingStateResult.value.status === 'profile_ready') {
    redirect('/opportunities')
  }

  const isInProgress = onboardingStateResult.value.status === 'onboarding_in_progress'
  const activeSession = onboardingStateResult.value.activeSession

  return (
    <WorkspaceShell
      currentPath="/onboarding"
      userContext={userContext}
      eyebrow="Onboarding Flow"
      title={
        isInProgress
          ? 'Continue the onboarding flow toward a usable career profile.'
          : 'Guide the user from first login to a usable career profile.'
      }
      description={
        isInProgress
          ? 'An active onboarding session already exists. The next product steps should continue from the saved session instead of starting over.'
          : 'This page establishes the future onboarding experience: resume upload or skip, guided information gathering, and a clear transition into opportunities.'
      }
      actions={
        <>
          <ActionLink href="/career-profile" label="Open career profile" tone="secondary" />
          <ActionLink href="/opportunities" label="View target destination" tone="primary" />
        </>
      }
    >
      <section className="rounded-[28px] border border-[rgba(71,53,40,0.11)] bg-[rgba(255,252,248,0.78)] p-5 shadow-[0_18px_50px_rgba(65,46,32,0.08)]">
        <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
          Current session state
        </p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="m-0 text-[1.45rem] leading-tight text-[#221914]">
              {isInProgress ? 'Onboarding already in progress' : 'No onboarding session yet'}
            </h2>
            <p className="mt-2 text-[0.98rem] leading-[1.7] text-[#594b41]">
              {isInProgress
                ? `Current step: ${activeSession?.currentStep ?? 'guided_chat'}. This will later restore upload state, parsed resume text, and saved onboarding messages.`
                : 'The next implementation step can now safely create a first onboarding session and persist it in the database.'}
            </p>
          </div>
          <div className="rounded-full border border-[rgba(58,44,33,0.12)] bg-[rgba(255,255,255,0.88)] px-4 py-2 text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-[#7d3f23]">
            {onboardingStateResult.value.status}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="grid gap-4 rounded-[28px] border border-[rgba(71,53,40,0.11)] bg-[rgba(255,252,248,0.78)] p-5 shadow-[0_18px_50px_rgba(65,46,32,0.08)]">
          <div>
            <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
              Step 1
            </p>
            <h2 className="mt-2 text-[1.45rem] leading-tight text-[#221914]">Resume upload</h2>
          </div>
          <p className="m-0 text-[0.98rem] leading-[1.7] text-[#594b41]">
            The UI is ready for an upload-or-skip entry point. The backend can later connect PDF
            storage, text extraction, and onboarding session updates behind this step.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-[linear-gradient(135deg,#cb6e44,#9f4e2b)] px-5 py-3 font-semibold text-[#fffaf6] shadow-[0_12px_24px_rgba(159,78,43,0.22)] transition duration-150 hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(159,78,43,0.28)]"
            >
              Upload resume
            </button>
            <button
              type="button"
              className="rounded-full border border-[rgba(58,44,33,0.12)] bg-[rgba(255,255,255,0.88)] px-5 py-3 font-semibold text-[#221914] transition duration-150 hover:-translate-y-px hover:border-[rgba(201,109,66,0.28)] hover:bg-[rgba(255,247,241,0.95)]"
            >
              Skip for now
            </button>
          </div>
        </article>

        <article className="grid gap-4 rounded-[28px] border border-[rgba(71,53,40,0.11)] bg-[rgba(255,252,248,0.78)] p-5 shadow-[0_18px_50px_rgba(65,46,32,0.08)]">
          <div>
            <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
              Step 2
            </p>
            <h2 className="mt-2 text-[1.45rem] leading-tight text-[#221914]">Guided questions</h2>
          </div>
          <p className="m-0 text-[0.98rem] leading-[1.7] text-[#594b41]">
            The onboarding assistant can ask about education, work experience, skills, volunteering,
            and anything still missing after resume parsing.
          </p>
          <div className="rounded-[22px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.74)] px-4 py-4 text-[0.95rem] leading-[1.65] text-[#594b41]">
            Each user message and assistant reply should later be saved inside an onboarding chat
            table, separate from the generic workspace chat.
          </div>
        </article>

        <article className="grid gap-4 rounded-[28px] border border-[rgba(71,53,40,0.11)] bg-[rgba(255,252,248,0.78)] p-5 shadow-[0_18px_50px_rgba(65,46,32,0.08)]">
          <div>
            <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
              Step 3
            </p>
            <h2 className="mt-2 text-[1.45rem] leading-tight text-[#221914]">Continue onward</h2>
          </div>
          <p className="m-0 text-[0.98rem] leading-[1.7] text-[#594b41]">
            Once enough information is gathered, the flow can finalize a draft career profile and
            send the user to opportunities.
          </p>
          <div className="flex flex-wrap gap-3">
            <ActionLink href="/career-profile" label="Review profile area" tone="secondary" />
            <ActionLink href="/opportunities" label="Continue to opportunities" tone="primary" />
          </div>
        </article>
      </section>
    </WorkspaceShell>
  )
}
