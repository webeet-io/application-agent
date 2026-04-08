# Direct Outreach Error Handling

## Contact Discovery
- `provider_unavailable`: provider key missing or unavailable
- `provider_error`: upstream API failure
- `not_found`: no suitable contacts found

## Email Validation
- `provider_unavailable`: validation service not configured
- `provider_error`: upstream API failure

## Drafting
- `llm_failed`: drafting model failed or was unreachable

## Guidelines
- Fail closed: do not surface unvalidated emails.
- Treat missing provider keys as explicit errors, not silent fallbacks.
