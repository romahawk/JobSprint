# Roadmap

## Completion Snapshot (as of 2026-03-19)

- Week 1 complete: baseline docs and repo clarity.
- Week 2 complete: workflow governance and release discipline.
- Week 3 complete: 7-day activity signal + app-level error boundary.
- Week 4 complete: form hardening, safe delete with undo, smoke tests.
- Month 2 complete: persistence boundary, migration helper, auth/session, sync status, Firebase integration.
- Post-Month 2 UX hardening in progress: dashboard compression, clearer next actions, safer Role-to-Application handoff, and a stronger Assets Vault workflow.

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

## Current Focus (March 2026)

- Improve dashboard density so the primary cards fit within a single desktop viewport more often.
- Make Today's Actions resilient to data gaps, especially when a role is marked progressed but no application row exists yet.
- Reduce accidental duplicate records by tightening Job OS handoff flows and surfacing explicit success/error feedback.
- Turn Assets Vault into a compact CV constructor with stable CV-to-application linking, import/export support, reusable script/template editing, and explicit file-import feedback.
- Publish proof-of-work artifacts and keep trimming initial bundle cost as richer Job OS surfaces are added.

## Next Session Starting Point

1. Turn the case study into a more shareable demo page or lightweight hosted story.
2. Continue bundle-size reduction beyond route/vendor splitting, especially around the heaviest shared dependencies.
3. Add CI and reporting polish for the growing Playwright suite so failures are easier to inspect.

## Freeze List

- No framework migration.
- No large-scale component library refactor.
- No multi-user collaboration features.
- No ATS integrations before persistence/auth baseline.
