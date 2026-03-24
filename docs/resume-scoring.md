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
