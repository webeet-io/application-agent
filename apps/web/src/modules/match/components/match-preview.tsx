import type { ReactNode } from 'react'
import {
  buildDefaultMatchOutput,
  matchFixtures,
  scoreResumeAgainstJob,
} from '../../../../../../packages/match-engine/src'
import type {
  MatchGapSeverity,
  MatchGapType,
  MatchOutputItem,
  MatchWeaknessItem,
  RecommendedSkillItem,
  SkillLearningPriority,
} from '@ceevee/types'

const demoFixture = matchFixtures[0]
const demoResult = scoreResumeAgainstJob(demoFixture.resume, demoFixture.job)
const demoOutput = buildDefaultMatchOutput(demoResult)

function scoreBandLabel(scoreBand: string) {
  switch (scoreBand) {
    case 'high':
      return 'High Fit'
    case 'medium':
      return 'Medium Fit'
    default:
      return 'Low Fit'
  }
}

function scoreToneClassName(displayTone: string) {
  switch (displayTone) {
    case 'success':
      return 'border-[rgba(64,111,88,0.18)] bg-[linear-gradient(180deg,rgba(236,247,240,0.94),rgba(228,242,234,0.9))] text-[#234a35]'
    case 'warning':
      return 'border-[rgba(164,115,35,0.18)] bg-[linear-gradient(180deg,rgba(255,246,226,0.96),rgba(248,236,205,0.9))] text-[#7c5415]'
    default:
      return 'border-[rgba(153,58,43,0.18)] bg-[linear-gradient(180deg,rgba(255,238,234,0.96),rgba(248,226,220,0.9))] text-[#8b3325]'
  }
}

function priorityLabel(priority?: string) {
  switch (priority) {
    case 'core':
      return 'Core'
    case 'supporting':
      return 'Supporting'
    case 'nice_to_have':
      return 'Nice to have'
    default:
      return 'Info'
  }
}

function priorityClassName(priority?: string) {
  switch (priority) {
    case 'core':
      return 'bg-[rgba(159,78,43,0.12)] text-[#8c4727]'
    case 'supporting':
      return 'bg-[rgba(95,109,82,0.12)] text-[#43513a]'
    case 'nice_to_have':
      return 'bg-[rgba(93,83,73,0.1)] text-[#5f5349]'
    default:
      return 'bg-[rgba(93,83,73,0.08)] text-[#5f5349]'
  }
}

function severityLabel(severity: MatchGapSeverity) {
  switch (severity) {
    case 'critical':
      return 'Critical'
    case 'moderate':
      return 'Moderate'
    case 'low':
      return 'Low'
  }
}

function weaknessTypeLabel(type: MatchGapType) {
  switch (type) {
    case 'critical_gap':
      return 'Skill gap'
    case 'presentation_gap':
      return 'Presentation gap'
    case 'learnable_gap':
      return 'Learnable gap'
  }
}

function learningPriorityLabel(priority: SkillLearningPriority) {
  switch (priority) {
    case 'high':
      return 'High priority'
    case 'medium':
      return 'Medium priority'
    case 'low':
      return 'Low priority'
  }
}

function SectionCard({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow: string
  children: ReactNode
}) {
  return (
    <section className="grid gap-4 rounded-[28px] border border-[rgba(71,53,40,0.11)] bg-[rgba(255,253,249,0.78)] p-5 shadow-[0_18px_50px_rgba(65,46,32,0.08)] backdrop-blur-[16px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-[1.35rem] leading-tight text-[#221914]">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  )
}

function OutputList({ items }: { items: MatchOutputItem[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article
          key={`${item.label}-${item.description}`}
          className="rounded-[22px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[1rem] leading-none text-[#221914]">{item.label}</h4>
            <span
              className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] ${priorityClassName(item.priority)}`}
            >
              {priorityLabel(item.priority)}
            </span>
          </div>
          <p className="mt-2 text-[0.97rem] leading-[1.6] text-[#594b41]">{item.description}</p>
        </article>
      ))}
    </div>
  )
}

function WeaknessList({ items }: { items: MatchWeaknessItem[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article
          key={`${item.label}-${item.description}`}
          className="rounded-[22px] border border-[rgba(129,87,62,0.11)] bg-[rgba(255,250,246,0.82)] px-4 py-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[1rem] leading-none text-[#221914]">{item.label}</h4>
            <span
              className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] ${priorityClassName(item.priority)}`}
            >
              {priorityLabel(item.priority)}
            </span>
            <span className="rounded-full bg-[rgba(122,84,21,0.08)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#7c5415]">
              {severityLabel(item.severity)}
            </span>
          </div>
          <p className="mt-2 text-[0.97rem] leading-[1.6] text-[#594b41]">{item.description}</p>
          <p className="mt-2 text-[0.8rem] uppercase tracking-[0.08em] text-[#8d7667]">
            {weaknessTypeLabel(item.type)}
          </p>
        </article>
      ))}
    </div>
  )
}

function SkillLearningList({ items }: { items: RecommendedSkillItem[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article
          key={`${item.skill}-${item.reason}`}
          className="rounded-[22px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[1rem] leading-none text-[#221914]">{item.skill}</h4>
            <span className="rounded-full bg-[rgba(95,109,82,0.12)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#43513a]">
              {learningPriorityLabel(item.priority)}
            </span>
          </div>
          <p className="mt-2 text-[0.97rem] leading-[1.6] text-[#594b41]">{item.reason}</p>
        </article>
      ))}
    </div>
  )
}

export function MatchPreview() {
  return (
    <section className="grid gap-6">
      <div className="grid gap-5 rounded-[34px] border border-[rgba(71,53,40,0.11)] bg-[rgba(252,249,244,0.82)] p-6 shadow-[0_28px_80px_rgba(65,46,32,0.16)] backdrop-blur-[18px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[46rem]">
            <p className="m-0 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#8d7667]">
              Scoring Preview
            </p>
            <h1 className="mt-3 text-[clamp(2.3rem,4.5vw,4.3rem)] leading-[0.94] text-[#221914]">
              Resume-to-job fit that feels readable, not mechanical.
            </h1>
            <p className="mt-4 max-w-[38rem] text-[1.02rem] leading-[1.7] text-[#594b41]">
              This simple frontend uses the current scoring engine output and presents it in a way
              the product team can later connect to real career profile and job data.
            </p>
          </div>
          <div className="rounded-[24px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.62)] px-4 py-4 text-sm text-[#594b41]">
            <p className="m-0 font-bold text-[#221914]">{demoFixture.job.title}</p>
            <p className="mt-1">Profile: {demoFixture.resume.label}</p>
            <p className="mt-1">Mode: {demoFixture.job.locationConstraint?.mode ?? 'flexible'}</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[30px] border border-[rgba(58,44,33,0.08)] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(249,242,234,0.9))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
                  Overall Match
                </p>
                <h2 className="mt-2 text-[2rem] leading-none text-[#221914]">{demoOutput.title}</h2>
                <p className="mt-4 max-w-[36rem] text-[1rem] leading-[1.7] text-[#594b41]">
                  {demoOutput.shortSummary}
                </p>
              </div>
              <div
                className={`min-w-[220px] rounded-[28px] border px-5 py-5 ${scoreToneClassName(demoOutput.displayTone)}`}
              >
                <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em]">
                  Score Band
                </p>
                <div className="mt-3 flex items-end gap-3">
                  <span className="text-[3.7rem] leading-none">{demoOutput.overallScore}%</span>
                  <span className="mb-2 rounded-full bg-[rgba(255,255,255,0.6)] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.08em]">
                    {scoreBandLabel(demoOutput.scoreBand)}
                  </span>
                </div>
                <p className="mt-3 text-[0.94rem] leading-[1.6] opacity-85">
                  Structured output ready for frontend color coding and later adapter-based data
                  sources.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 rounded-[30px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.5)] p-5">
            <div>
              <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
                What This Demo Shows
              </p>
              <p className="mt-3 text-[1rem] leading-[1.7] text-[#594b41]">
                The UI is driven by the default match output, so the frontend only needs one stable
                structure for score, lists, and short explanation.
              </p>
            </div>
            <div className="grid gap-3 text-[0.95rem] leading-[1.6] text-[#594b41]">
              <div className="rounded-[20px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
                Score and score band for simple visual status.
              </div>
              <div className="rounded-[20px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
                Strengths and weaknesses as readable cards instead of raw logic output.
              </div>
              <div className="rounded-[20px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
                Improvement and learning suggestions prepared for later AI enhancement.
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard eyebrow="Strengths" title="What already fits well">
          <OutputList items={demoOutput.strengths} />
        </SectionCard>

        <SectionCard eyebrow="Weaknesses" title="What may still block or weaken the match">
          <WeaknessList items={demoOutput.weaknesses} />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard eyebrow="Improvements" title="How the profile could be presented better">
          <div className="grid gap-3">
            {demoOutput.recommendedImprovements.map((item) => (
              <article
                key={item}
                className="rounded-[22px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-4 text-[0.97rem] leading-[1.65] text-[#594b41]"
              >
                {item}
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Learning Next" title="Skills worth learning for this role">
          <SkillLearningList items={demoOutput.recommendedSkillsToLearn} />
        </SectionCard>
      </div>
    </section>
  )
}
