import { resolveUserOnboardingStateUseCase } from '@/infrastructure/container'
import { getWorkspaceUserContext } from '@/modules/workspace/server'

function ProfileField({ label, description }: { label: string; description: string }) {
  return (
    <article className="rounded-2xl border bg-card px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground/80">{description}</p>
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
  const profile = persistedProfile?.profile
  const targetRoles = profile?.preferences?.targetRoles ?? []
  const detectedSkills = profile?.skillEvidence.slice(0, 6) ?? []

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Career Profile
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            A dedicated home for structured resume and onboarding knowledge.
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            This area becomes the stable source for job fit, resume scoring, and later mentoring
            features. It should outlive any single resume upload.
          </p>
        </header>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4 rounded-3xl border bg-card/80 p-5 shadow-sm">
            <ProfileField
              label="Current state"
              description={
                persistedProfile
                  ? `A ready career profile already exists with a completeness score of ${persistedProfile.completenessScore}%.`
                  : 'No ready career profile exists yet. This page is already available so the navigation stays stable during onboarding.'
              }
            />
            <ProfileField
              label="Identity"
              description={
                profile
                  ? `Seniority: ${profile.seniority}. Languages: ${profile.languages.length > 0 ? profile.languages.join(', ') : 'not detected yet'}.`
                  : 'Target roles, seniority, locations, and language preferences will live here as stable profile data.'
              }
            />
            <ProfileField
              label="Evidence"
              description={
                profile
                  ? detectedSkills.length > 0
                    ? `Detected skill signals: ${detectedSkills.map((skill) => skill.skill).join(', ')}.`
                    : 'A profile exists already, but concrete skill evidence still needs to be enriched.'
                  : 'Skills, work history, projects, education, and volunteer experience should be merged from resume parsing and onboarding answers.'
              }
            />
            <ProfileField
              label="Readiness"
              description={
                persistedProfile
                  ? `The latest persisted profile is marked ready with ${persistedProfile.completenessScore}% completeness.`
                  : 'This page can later show how complete the profile is before sending the user deeper into opportunities and scoring.'
              }
            />
          </div>

          <div className="grid gap-4 rounded-3xl border bg-card/80 p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Why this page matters
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground">
                The profile should be more durable than one CV.
              </h2>
            </div>
            {profile ? (
              <div className="grid gap-3">
                <div className="rounded-2xl border bg-background px-4 py-4 text-sm leading-6 text-foreground/80">
                  Target roles: {targetRoles.length > 0 ? targetRoles.join(', ') : 'not captured yet'}
                </div>
                <div className="rounded-2xl border bg-background px-4 py-4 text-sm leading-6 text-foreground/80">
                  Additional notes: {profile.additionalNotes ?? 'No onboarding notes were persisted yet.'}
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                The onboarding flow can fill a draft first, but this page gives the product a long-term
                destination where users later review, improve, and expand their career data.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
