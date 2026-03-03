# Changelog

All notable changes to this project are documented in this file.

The format follows Keep a Changelog principles and this project uses date-based release notes during MVP stage.

## [Unreleased]

### Added

- Added 7-day activity signal card with prior-week comparison on dashboard.
- Added app-level error boundary fallback with reload and return-to-dashboard actions.
- Added repository/service boundary for persistence with local fallback and optional remote API mode.
- Added local session auth bootstrap with sign-in page and protected routes.
- Added sync status badge with manual refresh action.
- Added safe delete flow with undo window.
- Added smoke tests for CRUD and pipeline movement.
- Added cross-device sync checklist doc.
- Added optional Firebase integration (email/password auth + Firestore state persistence).

### Fixed

- Hardened application form validation (required fields, URL validation, date validity, future-date guard, inline errors).

### Docs

- Added AI Production OS v1 documentation pack in `docs/`.
- Added reusable workflow setup guide: `docs/WORKFLOW_AUTOMATION_PLAYBOOK.md`.
- Added README screenshots using committed assets and removed duplicate image blocks.
- Updated roadmap Week 2 deployment references from generic static hosting to Vercel.

### Infra

- Added CI workflow (`.github/workflows/ci.yml`).
- Added issue templates and PR template for disciplined delivery.
- Added PR policy enforcement workflow (`.github/workflows/policy-check.yml`).
- Added issue triage automation workflow (`.github/workflows/issue-triage.yml`).
- CI now runs smoke tests before build.

### Changed

- Removed GitHub Pages deploy workflow in favor of Vercel deploy path.

## [2026-03-02] - Retroactive OS Adoption Baseline

### Added

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/DECISIONS_LOG.md`
- `CONTRIBUTING.md`

### Changed

- Replaced template README with product-focused project README.
