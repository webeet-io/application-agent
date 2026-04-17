import { redirect } from 'next/navigation'
import { resolveUserOnboardingStateUseCase } from '@/infrastructure/container'
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
    <div className="flex flex-1 flex-col overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Opportunities
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            The future destination after onboarding should already feel intentional.
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            This page is the natural handoff after a user completes onboarding. It gives the product
            a clear place to surface relevant job opportunities and later matching results.
          </p>
        </header>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="grid gap-4 rounded-3xl border bg-card/80 p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Destination
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground">
                Opportunities can become the user&apos;s daily surface.
              </h2>
            </div>
            <p className="text-sm leading-6 text-foreground/80">
              After onboarding is complete, this route can display relevant jobs, ranking logic, and
              later your existing scoring output in a way that feels connected to the user profile.
            </p>
            <div className="grid gap-3">
              <div className="rounded-2xl border bg-background px-4 py-4 text-sm leading-6 text-foreground/80">
                Show curated jobs once the user has enough structured profile data.
              </div>
              <div className="rounded-2xl border bg-background px-4 py-4 text-sm leading-6 text-foreground/80">
                Use the career profile as the stable base for fit, scoring, and future recommendations.
              </div>
            </div>
          </article>

          <article className="grid gap-4 rounded-3xl border bg-card/80 p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Transitional state
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground">
                For now, this page marks the end of the onboarding journey.
              </h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              It is intentionally simple right now, but it gives the flow a real destination instead
              of dropping the user back into an unrelated screen.
            </p>
          </article>
        </section>
      </div>
    </div>
  )
}
