Build a logical job-matching scoring concept for a resume-to-job application tool.

Goal:
Do not use naive keyword counting as the main logic. The scoring should reflect real candidate-job fit and produce understandable reasoning.

Core logic to include:
1. Check knockout criteria first:
   - required language
   - location / remote constraints
   - seniority mismatch
   - critical missing core technology
   These should strongly reduce or block the match.

2. Separate requirements into:
   - core must-haves
   - important supporting skills
   - nice-to-haves
   Missing a core skill should matter much more than missing a bonus skill.

3. Distinguish match quality:
   - direct match
   - closely related / transferable match
   - weakly inferable match
   - missing
   Example: JavaScript can partially support TypeScript readiness, but is not equal to real TypeScript experience.

4. Evaluate evidence strength:
   A skill is stronger if it appears in real projects, work experience, or concrete achievements, not only in a skill list.

5. Consider depth of experience:
   - theory/course level
   - small project
   - multiple projects
   - real work usage
   - ownership/responsibility
   The score should reflect confidence, not just presence.

6. Score seniority fit separately:
   A candidate can have related skills but still not match the expected level of independence/responsibility.

7. Separate real skill gaps from resume presentation gaps:
   Sometimes the candidate may be suitable, but the CV does not communicate it clearly enough.

8. Consider gap severity and learnability:
   Some missing skills are easy to learn quickly (e.g. Docker basics), others are structural gaps (e.g. no backend fundamentals for a backend role).

9. Soft skills should only support the score, not compensate for missing core technical requirements.

Output should not only be one percentage.
Return:
- overall match level
- strengths
- critical gaps
- learnable gaps
- evidence quality
- reasoning summary
- resume improvement suggestions
- recommended skills to learn next

Main principle:
Model the score as "how credible and low-risk is this candidate for this role?" instead of "how many keywords matched?"

## Current implementation status

The resume scoring / job fit work has been started as an independent functional core.

Implemented so far:
- Extended shared domain types in `packages/types/src/index.ts`
- Added structured scoring input types such as `ResumeProfile`, `NormalizedJobPosting`, `JobRequirement`, and `ResumeSkillEvidence`
- Added scoring output types such as `ResumeJobFitResult`, `RequirementAssessment`, `KnockoutAssessment`, `OverallMatchLevel`, and `EvidenceQuality`
- Added a standalone match engine package under `packages/match-engine`
- Added the pure scoring function `scoreResumeAgainstJob` in `packages/match-engine/src/score-resume-against-job.ts`
- Added match-engine exports in `packages/match-engine/src/index.ts`
- Added example resume/job scenarios in `packages/match-engine/src/fixtures.ts`
- Added lightweight smoke-test checks in `packages/match-engine/src/smoke-tests.ts`

The match engine currently evaluates:
- knockout criteria such as required languages, location constraints, seniority mismatch, and missing critical technologies
- requirement priority through `core`, `supporting`, and `nice_to_have`
- match quality through `direct`, `transferable`, `inferable`, and `missing`
- evidence strength and experience depth
- seniority fit separately from technical skill fit
- critical gaps versus learnable gaps
- resume presentation improvements, for example when a skill only appears in a skills list
- recommended skills to learn next

## Output strategy

The match result should be structured so the frontend can display it clearly without needing to understand the scoring internals.

The default output should work without AI, database access, resume parsing, job scraping, or UI-specific code.

Core fields for display:
- `overallScore`
- `scoreBand`
- `displayTone`
- `title`
- `shortSummary`
- `strengths`
- `weaknesses`
- `recommendedSkillsToLearn`

Score band rules:
- `score < 50` -> `low`
- `score < 80` -> `medium`
- `score >= 80` -> `high`

Display tone mapping:
- `low` -> `danger`
- `medium` -> `warning`
- `high` -> `success`

The frontend can later decide whether `danger` is red, `warning` is yellow, and `success` is green. The match engine should expose semantic UI hints, not hard-coded colors.

## CareerProfile input strategy

The scoring engine should not depend directly on resume PDFs or free-form user text.

The main scoring data source should be the `CareerProfile`. A `ResumeProfile` is only a derived scoring view created from that broader profile.

The intended long-term data flow is:
1. Resume PDF, resume text, and additional user form input are collected.
2. Those inputs are normalized into a `CareerProfile`.
3. The match engine maps the `CareerProfile` into a scoring-specific `ResumeProfile`.
4. `scoreResumeAgainstJob(resumeProfile, job)` evaluates the role fit.
5. `buildDefaultMatchOutput(result)` creates the frontend-friendly fallback output.

This keeps resume extraction, user input, and scoring separate.

`CareerProfile` is the broader user model. It can include:
- seniority
- target roles
- languages
- location preferences
- remote preference
- skill evidence from resumes
- skill evidence from additional user input
- work experience
- projects
- education
- additional notes

`ResumeProfile` is the smaller scoring view. It contains only the data the match engine needs:
- seniority
- languages
- locations
- target roles
- skill evidence

This distinction helps separate real skill gaps from resume presentation gaps.

Example:
- If Docker appears only in additional user input, the candidate may have some Docker ability.
- If Docker is not visible in the resume, the system can still recommend improving the resume evidence.
- The scoring core can consider the signal without pretending it is strong work experience.

Implemented preparation:
- Added `CareerProfile` and related types in `packages/types/src/index.ts`
- Added `careerProfileToResumeProfile` in `packages/match-engine/src/career-profile-to-resume-profile.ts`
- Added a CareerProfile fixture in `packages/match-engine/src/fixtures.ts`
- Added smoke checks for the mapping in `packages/match-engine/src/smoke-tests.ts`

## Core scoring vs AI adapter

The scoring decision should stay in the deterministic match engine.

The match engine owns:
- final score
- score band
- knockout handling
- seniority fit
- requirement priority weighting
- direct / transferable / inferable / missing match quality
- critical gaps
- learnable gaps
- resume presentation gaps
- recommended skills to learn next

An AI adapter can be added later, but it should not be the source of truth for the candidate's fit.

The AI adapter may help with:
- extracting structured skills from resumes
- extracting structured requirements from job descriptions
- suggesting transferable skill relationships
- improving the wording of summaries
- improving the wording of resume improvement suggestions
- making explanations more natural and readable

The AI adapter should not:
- overwrite the final score
- ignore knockout criteria
- compensate for missing core technical requirements with soft wording
- turn a blocked or low-confidence match into a strong match
- make the scoring behavior non-deterministic

Recommended flow:
1. Resume and job data are normalized into structured inputs.
2. `scoreResumeAgainstJob(resume, job)` produces the deterministic fit result.
3. `buildDefaultMatchOutput(result)` produces a frontend-friendly fallback output.
4. A future AI adapter may rewrite or enrich explanation text, while preserving the deterministic scoring fields.

This keeps the feature testable and understandable while still allowing better explanations later.

## Double scoring architecture

The planned stronger setup is a double-scoring model:
- deterministic fallback scoring
- AI-based second scoring
- deterministic comparison and combination layer

The goal is not to replace the fallback engine. The goal is to use AI as a second perspective while keeping the final result controllable.

Planned data flow:
1. `CareerProfile` and normalized job data are prepared.
2. The functional core produces `ResumeJobFitResult`.
3. `buildDefaultMatchOutput(result)` produces the fallback frontend output.
4. A future AI adapter produces `AiResumeMatchResult`.
5. `buildCombinedResumeMatchResult(fallbackResult, fallbackOutput, aiResult)` compares both and creates the final combined frontend output.

The combined result should contain:
- fallback result
- fallback output
- AI result
- comparison metadata
- combined frontend output

Comparison metadata should include:
- fallback score
- AI score
- score difference
- divergence level
- review flag

The final combined frontend output should include:
- final score
- score band
- display tone
- title
- short summary
- strengths
- weaknesses
- recommended improvements
- recommended skills to learn

Current implementation preparation:
- Added `AiResumeMatchResult`, `MatchComparisonResult`, `CombinedResumeMatchOutput`, and `CombinedResumeMatchResult` in `packages/types/src/index.ts`
- Added `buildCombinedResumeMatchResult` in `packages/match-engine/src/combined-match-result.ts`
- Added a mock AI fixture in `packages/match-engine/src/fixtures.ts`
- Added smoke checks for the combined result in `packages/match-engine/src/smoke-tests.ts`
- Added `IAiMatchEvaluationPort` in `apps/web/src/ports/outbound/IAiMatchEvaluationPort.ts`
- Added `PlaceholderAiMatchEvaluationAdapter` in `apps/web/src/adapters/llm/PlaceholderAiMatchEvaluationAdapter.ts`

Current rule for the combined score:
- fallback score remains the safer anchor
- AI score can influence the final score when divergence is low or moderate
- if divergence is high, the fallback score remains the final anchor
- if knockout criteria block the role, the fallback score remains dominant

This allows the frontend to show one combined result later while still preserving the fallback score as the safer control layer.

Until a real model API is connected, the placeholder adapter acts as a deterministic mock second opinion. It keeps the architecture ready for a future OpenAI-style adapter without requiring an API key yet.

What is intentionally not implemented yet:
- resume PDF parsing
- job scraping or ATS extraction
- database persistence
- UI integration
- production-grade test runner setup
- LLM/RAG integration
