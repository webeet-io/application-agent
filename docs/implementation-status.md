# Implementation Status

## Skill Gap Learning Paths

| Issue | Status | Notes |
|---|---|---|
| `#18` Define domain model and prioritization rules | In Progress | Core Mentor-specific domain models, evidence rules, relevance rules, and prioritization logic now exist in code. Resume-readiness gates are still placeholder-level until Phase 6. |
| `#19` Define MVP input contract | Done | Implemented through the Mentor-specific input and preferences types in the domain contract and Phase 1 use-case contract. |
| `#21` Create `GenerateSkillGapPlanUseCase` | In Progress | The contract and required outbound ports are defined. Full orchestration wiring is deferred to Phase 8. |
| `#22` Implement recurring skill-gap detection | Done | Implemented in the Mentor-specific detector with golden tests for recurrence, contradiction handling, sparse resume behavior, and degraded single-job behavior. |
| `#23` Add learning resource recommendation boundary | In Progress | The outbound port and request/response types are defined. No resource adapter or orchestration is implemented yet. |
| `#24` Implement prioritization and strategy modes | Done | Implemented with deterministic scoring, bucket assignment, and tests across all three strategy modes. |
| `#25` Generate ordered learning path recommendations | In Progress | Phase 5 starts the ordered path generator with effort estimates, bucket sequencing, dependency ordering, and tests. |

## Completed Phases

- Phase 1: use-case contracts and outbound port interfaces
- Phase 2: deterministic relevance and evidence rules
- Phase 3: recurring skill-gap detection with golden tests
- Phase 4: prioritization and strategy modes with tests

## Current Phase

- Phase 5: learning path generation with effort estimates and exit criteria

## Next Phases

- Phase 6: deterministic resume-readiness gates
- Phase 7: append-only progress logging and readiness recomputation
- Phase 8: full `GenerateSkillGapPlanUseCase` orchestration wiring
- Phase 9: remaining contradiction, sparse-data, and integration test coverage
