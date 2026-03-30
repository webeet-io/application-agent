# Application Agent (CeeVee)

CeeVee is a smart job opportunity agent that discovers companies, scrapes career pages, and matches roles to resumes.

## Key Docs
- `ARCHITECTURE.md`
- `CHECKLIST.md`
- `docs/PULL_REQUEST_GUIDE.md`
- `docs/feat-career-page-scraper.md`
- `docs/career-page-output-contract.md`
- `docs/career-page-scraper-flow.md`
- `docs/career-page-scraper-errors.md`
- `docs/career-page-scraper-test-plan.md`

## Notes
- Core architecture: functional domain + hexagonal ports and adapters.
- Use cases live in `apps/web/src/application`.
