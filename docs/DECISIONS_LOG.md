# Decisions Log

## ADR-001: Local-First Storage for MVP

- Date: 2026-03-02
- Status: Accepted
- Context: Fast proof-of-work delivery is prioritized over backend complexity.
- Decision: Use browser `localStorage` for application and weekly goal persistence.
- Consequences:
  - Positive: zero backend setup, rapid iteration.
  - Negative: no multi-device sync, limited durability guarantees.

## ADR-002: Context API as Global State Layer

- Date: 2026-03-02
- Status: Accepted
- Context: App state is currently moderate and synchronous.
- Decision: Keep React Context as state layer for MVP.
- Consequences:
  - Positive: low overhead, easy contributor onboarding.
  - Negative: scaling pain if async/network state grows.

## ADR-003: Issue -> PR -> Deploy Workflow Enforcement

- Date: 2026-03-02
- Status: Accepted
- Context: Repository lacked repeatable delivery discipline.
- Decision: Adopt mandatory issue templates, PR template, CI checks, and changelog updates.
- Consequences:
  - Positive: stronger proof-of-work signal and traceability.
  - Negative: slightly slower ad-hoc coding loop.

## ADR-004: Scope Freeze on Major Refactors

- Date: 2026-03-02
- Status: Accepted
- Context: Current codebase includes broad UI scaffolding not fully used.
- Decision: Defer non-essential refactors (component pruning, architecture rewrites) until baseline delivery loop is stable.
- Consequences:
  - Positive: protects momentum and visible shipping.
  - Negative: temporary technical noise remains in repository.

## ADR-005: Retroactive OS Adoption

- Date: 2026-03-02
- Status: Accepted
- Context: Existing repository predates AI Production OS v1 governance.
- Decision: Adopt AI Production OS v1 retroactively and treat this date as operational baseline for roadmap, release notes, and execution checklist.
- Consequences:
  - Positive: clear before/after operational boundary for portfolio narrative.
  - Negative: initial documentation lift required.

## ADR-006: Repository Boundary Before Full Backend Cutover

- Date: 2026-03-03
- Status: Accepted
- Context: Persistence needed to evolve from local-only to remote without UI rewrites.
- Decision: Add `AppRepository` interface with local adapter fallback and optional remote API adapter.
- Consequences:
  - Positive: enables incremental backend adoption and migration safety.
  - Negative: introduces adapter complexity before full backend exists.

## ADR-007: Local Session Auth for MVP Bootstrap

- Date: 2026-03-03
- Status: Accepted
- Context: Authentication flow was needed for user-scoped data behavior before provider integration.
- Decision: Implement local email session bootstrap now, keep provider swap path open.
- Consequences:
  - Positive: immediate route protection and per-user state separation.
  - Negative: not production-grade identity until hosted auth is integrated.
