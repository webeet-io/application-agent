# Direct Outreach Test Plan

## Unit Tests
- Contact discovery result normalization.
- Validation gating: only valid/high-confidence emails returned.
- Draft generation uses required inputs.

## Adapter Tests (Mocked)
- Provider error handling (Apollo/Hunter stubs).
- Validation provider error handling (ZeroBounce/NeverBounce stubs).

## Tracking Tests
- Log outreach for an application.
- Multiple outreach entries for the same application.

## Non-Goals (for now)
- End-to-end integration with live providers.
