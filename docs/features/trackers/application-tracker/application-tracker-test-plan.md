# Application Tracker Test Plan

## Unit Tests
- Create application record with valid jobId/resumeId.
- Update status to interview/rejected/offer.
- Prevent updates for missing application (not_found).

## Repository Tests (Mocked DB)
- Insert application row
- Update status
- Fetch by user

## API Tests
- POST mark as applied (success)
- PATCH update status (success)
- Invalid payload (400)

## Non-Goals (for now)
- End-to-end UI flows
