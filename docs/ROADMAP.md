# Roadmap

## Completion Snapshot (as of 2026-03-03)

- Week 1 complete: baseline docs and repo clarity.
- Week 2 complete: workflow governance and release discipline.
- Week 3 complete: 7-day activity signal + app-level error boundary.
- Week 4 complete: form hardening, safe delete with undo, smoke tests.
- Month 2 complete: persistence boundary, migration helper, auth/session, sync status, Firebase integration.

## Next 4 Weeks

## Week 1: Stabilize Baseline

### Outcome

Repository is clear, scoped, and reviewable in under 10 minutes.

### Issues

- Rewrite README with product framing and setup.
- Add PRD, architecture, roadmap, and decisions log.
- Add contribution workflow and release format.
- Add `.env.example` baseline.

### Definition of Done

- Documentation is complete and internally consistent.
- New contributor can run app locally from README instructions.

### Demo Artifact

- Screenshot of README + docs index in repository.

## Week 2: Ship One Visible Improvement

### Outcome

Project has deploy and release discipline visible to external reviewers.

### Issues

- Add CI workflow for build checks.
- Add issue templates and PR template.
- Ensure Vercel deployment is active and documented in README.
- Add changelog with first adoption entry.

### Definition of Done

- CI runs on pushes and pull requests.
- Vercel deployment URL is live and documented.
- Changelog updated with dated entry.

### Demo Artifact

- Screenshot or Loom of successful CI run and live Vercel deploy.

## Week 3: Add One Signal Feature

### Outcome

Users can see an additional quality/usage signal beyond existing KPIs.

### Issues

- Add a 7-day activity signal card.
- Add error boundary fallback for runtime failures.
- Improve metric explanation copy for probability output.

### Definition of Done

- Signal feature appears in dashboard/analytics.
- Error fallback path is testable manually.

### Demo Artifact

- Screenshot of new signal card and fallback state.

## Week 4: Data Trust and UX Hardening

### Outcome

Data entry errors decrease and destructive actions are safer.

### Issues

- Add stricter form validation and user feedback.
- Add undo path or delayed confirmation for delete.
- Add smoke tests for CRUD and stage movement.

### Definition of Done

- Invalid data entry paths are blocked.
- Manual smoke test checklist passes.

### Demo Artifact

- Loom showing validation and safe delete flow.

## Next 3 Months

## Month 2: Expand Capability

- Introduce backend persistence boundary.
- Add authentication for single-user account continuity.
- Support data sync across devices.

## Month 3: Proof-of-Work Expansion

- Publish structured demo narrative and case-study assets.
- Add import/export path for portability.
- Add release KPI snapshots for visible progress trend.
- Add first E2E suite for auth + CRUD + pipeline + refresh persistence.
- Add offline/connection UX polish for Firebase sync errors.

## Next Session Starting Point

1. Create issues for Month 3 scope (E2E baseline, import/export, case-study docs).
2. Implement E2E scaffolding first (Playwright + CI integration for a happy-path flow).
3. Ship one visible portfolio artifact update (case-study section in README with Loom link).

## Freeze List

- No framework migration.
- No large-scale component library refactor.
- No multi-user collaboration features.
- No ATS integrations before persistence/auth baseline.
