# Opportunity Feed UI Contract

This document describes the current module boundary for the Opportunity Feed UI.

The feature belongs to issue #13. It renders the ranked job-opportunity results that a user sees after a search or discovery flow. The implementation is intentionally UI-first and uses mocked data today, but the module is shaped so issue #14 can later pass real discovery, scrape, and match results into the same feed.

## Architectural Role

The repository follows a functional-core, typed-ports, thin-adapters architecture. In that model, this feature is a presentation module, not an infrastructure adapter and not a domain service.

Current responsibilities:
- render a ranked list of opportunities
- display match confidence and one-line reasoning
- display empty-state guidance
- allow a user to mark a visible opportunity as applied in local UI state
- avoid direct API calls, scraper calls, database writes, or SDK usage

Non-responsibilities:
- company discovery
- career-page scraping
- resume-to-job matching
- persistence of application status
- auth/session handling

The current source files are:
- `apps/web/src/app/(dashboard)/opportunities/page.tsx`
- `apps/web/src/modules/opportunities/components/opportunity-feed.tsx`
- `apps/web/src/modules/opportunities/types.ts`
- `apps/web/src/modules/opportunities/mock-opportunities.ts`
- `apps/web/src/modules/opportunities/opportunity-feed-model.ts`
- `apps/web/src/modules/opportunities/opportunity-feed-model.test.ts`

## Current Port/Adapter Shape

This UI module does not define a formal `src/ports/outbound/*` port yet because it does not talk to an external system. Its boundary is still explicit:

- inbound UI port: `OpportunityFeedProps`
- current inbound adapter: `app/(dashboard)/opportunities/page.tsx`
- current data adapter: `mock-opportunities.ts`
- functional core for presentation rules: `opportunity-feed-model.ts`
- current output adapter behavior: browser navigation to `applyUrl` when present, plus local `Applied` UI state

### Current Flow

```text
/opportunities route
  -> imports mocked opportunities
  -> passes Opportunity[] into <OpportunityFeed />
  -> pure helpers rank and summarize opportunities
  -> UI renders cards, match confidence, empty state, and actions
```

## Inbound Data Contract

The UI receives opportunities through component props.

```typescript
type OpportunityFeedProps = {
  opportunities: Opportunity[]
  searchPrompt?: string
}
```

`searchPrompt` is optional. When provided, it should be the user's discovery prompt from issue #14. When omitted, the UI labels the screen as a mocked preview rather than pretending a real search happened.

### Opportunity

```typescript
type Opportunity = {
  id: string
  companyName: string
  roleTitle: string
  location: string
  matchPercentage: number
  matchReason: string
  applyUrl?: string
  applied: boolean
  sourceCompanyReason?: string
}
```

Field meaning:

- `id`: stable UI identifier for this opportunity. Future real data should prefer a stable job id from the scraper or persistence layer.
- `companyName`: company display name.
- `roleTitle`: job title to show as the primary card title.
- `location`: human-readable job location.
- `matchPercentage`: integer-like score from `0` to `100`.
- `matchReason`: one-line explanation for why this opportunity matches the user.
- `applyUrl`: optional direct apply URL. If missing, the UI renders a disabled `Apply link pending` button.
- `applied`: whether this opportunity is already applied.
- `sourceCompanyReason`: optional explanation from company discovery, useful when issue #14 supplies discovered-company context.

## Expected Upstream Adapter

Issue #14 owns the discovery entry point. Its eventual output can be adapted into this UI contract.

Expected upstream sequence:

```text
User prompt
  -> POST /api/companies/discover
  -> POST /api/career-pages/scrape
  -> match/ranking step
  -> Opportunity[]
  -> <OpportunityFeed opportunities={opportunities} searchPrompt={prompt} />
```

The feed should not call those endpoints directly. A page, route loader, server action, or future use case should prepare `Opportunity[]` and pass it into the UI.

### Mapping From Existing Contracts

Existing discovery output:

```typescript
type DiscoveredCompany = {
  name: string
  careersUrl: string
  reason: string
}
```

Existing scrape output:

```typescript
type JobListing = {
  title: string
  location: string
  url: string
  description: string
}
```

Existing match output:

```typescript
type MatchResult = {
  score: number
  reasoning: string
  suggestedTweaks: string[]
}
```

Adapter mapping into `Opportunity`:

```typescript
type OpportunityMappingInput = {
  company: DiscoveredCompany
  job: JobListing
  match: MatchResult
  applied?: boolean
}

function mapToOpportunity(input: OpportunityMappingInput): Opportunity {
  return {
    id: stableJobId,
    companyName: input.company.name,
    roleTitle: input.job.title,
    location: input.job.location,
    matchPercentage: input.match.score,
    matchReason: input.match.reasoning,
    applyUrl: input.job.url,
    applied: input.applied ?? false,
    sourceCompanyReason: input.company.reason,
  }
}
```

`stableJobId` should come from persisted job data when available. Until then, an adapter may derive it from company name plus job URL, but that derivation should live outside the UI component.

## Presentation Functional Core

`opportunity-feed-model.ts` contains deterministic helper functions.

```typescript
function getOpportunityMatchBand(matchPercentage: number): OpportunityMatchBand
function rankOpportunities(opportunities: Opportunity[]): Opportunity[]
function summarizeOpportunities(opportunities: Opportunity[]): OpportunityFeedSummary
function getInitialAppliedIds(opportunities: Opportunity[]): Set<string>
function getOpportunitySetKey(opportunities: Opportunity[]): string
```

These functions:
- accept plain typed data
- return plain values
- do not call APIs
- do not read or write storage
- do not depend on React
- are covered by unit tests

### Match Confidence Bands

```typescript
type OpportunityMatchBand = 'excellent' | 'strong' | 'review'
```

Current thresholds:

- `90-100`: `excellent`
- `80-89`: `strong`
- below `80`: `review`

This is how the UI makes `72%` visibly different from `91%`.

### Summary Output

```typescript
type OpportunityFeedSummary = {
  totalCount: number
  averageMatchPercentage: number
  topMatchPercentage: number
  appliedCount: number
}
```

The summary is derived from the inbound `Opportunity[]` and is displayed in the feed header.

## Outbound UI Contract

The Opportunity Feed has two outbound interactions:

- opening the external job application page
- marking an opportunity as applied

Per `VISION.md`, the product-level consumer of `Mark applied` is the Application Assistant / Tracker. Once persistence exists, an applied opportunity enters the user's application history. Later outcomes from that tracker, such as interview, rejection, no response, offer, or withdrawal, become input for insights, mentor behavior, and recurring skill-gap analysis.

Current implemented outbound behavior is intentionally minimal because issue #13 is UI-only.

### Apply Link

If `applyUrl` exists:

```text
User clicks Apply
  -> browser opens applyUrl in a new tab
  -> the user applies on the external company or ATS site
  -> the user returns to CeeVee and marks the opportunity as applied
```

If `applyUrl` is missing:

```text
UI shows disabled "Apply link pending"
```

The UI does not invent fake URLs. Mock opportunities therefore omit `applyUrl` until real scrape data is available.

Current consumer:
- the user's browser opens an external company or ATS application page

Future internal consumer:
- after the user confirms the application, CeeVee should record that event through the application tracker flow

### Applied Action

Current behavior:

```text
User clicks Mark applied
  -> component adds opportunity.id to local appliedIds state
  -> card shows Applied
  -> header applied count updates
```

This is local presentation state only. It is not persisted.

The component resets that local state when the incoming opportunity set changes, so a future discovery result from issue #14 does not inherit stale applied IDs from the previous result set.

Current consumer:
- the `OpportunityFeed` component itself consumes this action to update visible UI state

Future product consumer:
- Application Assistant / Tracker

Future technical consumers:
- an application use case that creates or updates an `Application`
- `IApplicationRepositoryPort`, implemented by a persistence adapter such as Supabase
- downstream mentor / insights features that read application history

## Future Outbound Port

When application-status persistence is implemented, the UI should not write directly to Supabase or any database adapter. The likely future boundary is a callback or use case-backed adapter such as:

```typescript
type OpportunityFeedProps = {
  opportunities: Opportunity[]
  searchPrompt?: string
  onMarkApplied?: (input: MarkOpportunityAppliedInput) => Promise<MarkOpportunityAppliedResult>
}

type MarkOpportunityAppliedInput = {
  opportunityId: string
  jobId?: string
  resumeId?: string
}

type MarkOpportunityAppliedResult = {
  applicationId: string
  status: 'applied'
}
```

That callback should be provided by a route/page-level adapter or a server action. The UI component should remain a thin presentation layer.

The existing repository port for application persistence is `IApplicationRepositoryPort`:

```typescript
interface IApplicationRepositoryPort {
  findById(id: ApplicationId): Promise<AttemptResult<ApplicationRepositoryError, Application>>
  findByUser(userId: string): Promise<AttemptResult<ApplicationRepositoryError, Application[]>>
  save(application: Application): Promise<AttemptResult<ApplicationRepositoryError, void>>
  updateStatus(id: ApplicationId, status: ApplicationStatus): Promise<AttemptResult<ApplicationRepositoryError, void>>
  delete(id: ApplicationId): Promise<AttemptResult<ApplicationRepositoryError, void>>
}
```

The future route/use-case layer should translate `MarkOpportunityAppliedInput` into an `Application` save or status update. That port already belongs outside this UI module. The feed should only trigger the action and render the resulting state.

### Intended Product Flow After Apply

```text
User clicks Apply
  -> external applyUrl opens
  -> user submits the application outside CeeVee
  -> user returns and clicks Mark applied
  -> Opportunity Feed emits MarkOpportunityAppliedInput
  -> route/server action calls application use case
  -> use case writes Application(status: 'applied') through IApplicationRepositoryPort
  -> Tracker consumes application history and shows the new application
  -> future outcomes feed mentor, insights, and skill-gap features
```

This matches `VISION.md`: "Mark an opportunity as Applied — it enters your application tracker."

## Empty State

An empty `opportunities` array is valid.

```typescript
<OpportunityFeed opportunities={[]} />
```

Expected UI:
- explain that no opportunities are available yet
- suggest broadening the search or running discovery again
- provide a link back to `/`, where issue #14 owns the discovery/search entry point

## Testing

Current targeted tests cover:
- match-band thresholds
- ranking order
- summary derivation
- empty summary values
- initial applied-id derivation
- opportunity-set key derivation

Recommended future tests before full integration with issue #14:
- component smoke test for non-empty feed
- component smoke test for empty state
- click test for `Mark applied`
- check that missing `applyUrl` renders disabled `Apply link pending`
- integration test for mapping discovery/scrape/match output into `Opportunity[]`

## Integration Notes For Issue #14

The search/discovery module should treat this UI as a consumer of normalized opportunity data.

The clean integration boundary is:

```typescript
function buildOpportunityFeedInput(
  prompt: string,
  discoveredCompanies: DiscoveredCompany[],
  scrapedJobs: JobListing[],
  matchResults: MatchResult[]
): {
  searchPrompt: string
  opportunities: Opportunity[]
}
```

This mapping should live outside `OpportunityFeed`. The UI should not know how discovery, scraping, matching, or persistence are implemented.

## Checklist Alignment

This module follows the relevant parts of `ARCHITECTURE.md` and `CHECKLIST.md`:

- no inheritance
- no abstract classes
- no direct SDK imports
- no direct database access
- no direct `process.env` access
- pure presentation helpers are separated from React UI
- mock data is isolated from component logic
- external side effects are not hidden inside the module
- future adapter boundaries are explicit
