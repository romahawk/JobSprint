# Changelog

All notable changes to this project are documented in this file.

The format follows Keep a Changelog principles and this project uses date-based release notes during MVP stage.

## [Unreleased]

### Added

- Added collapsible `Probability Engine` panel, collapsed `Add Role` form by default, and sticky `Quick Actions` placement to compress dashboard and Job OS vertical space.
- Added `Log Application` next action when a role has progressed past `to_apply` but no linked application row exists.
- Added Job OS import/export from the shared settings panel with validation and full-state replace support.
- Added Playwright E2E baseline for role-to-application logging, duplicate prevention, and refresh persistence.
- Added Playwright coverage for the Assets Vault CV constructor, including rename persistence, duplicate flow, and default CV behavior.
- Added Assets Vault CV constructor with up to 5 managed CV variants, one default CV, and application linkage visibility.
- Added `docs/CASE_STUDY_ASSETS_VAULT.md` as an outward-facing product story for the Assets Vault upgrade.

### Fixed

- Fixed silent application creation from the Roles page by showing explicit success/error feedback and preventing duplicate applications for the same role.
- Fixed fragile CV selection by linking applications to stable `cvAssetId` values while preserving backward compatibility with older name-based records.
- Fixed Assets delete flows by replacing browser confirms with proper modal confirmation and explicit toast feedback.
- Fixed the dashboard right rail overlap by making the full context column sticky instead of only the Quick Actions card.

### Changed

- Started bundle-size reduction with route-level lazy loading plus manual chunk splitting for Firebase, PDF.js, charts, and shared vendor code.

## [2026-03-06]

### Added

- Added AfA Vermittlungsvorschlag compliance module (`/compliance/afa`) with case table, risk engine, deadline engine, and full CRUD backed by Firestore.
- Added rocket SVG favicon replacing the previous lightning bolt (conflict with MagicKick branding).

### Fixed

- Fixed blank dashboard and disappearing cases on AfA compliance page during Firebase auth bootstrap and after in-app navigation: hook now resets `loading` before subscribing to Firestore, and page gates on `authLoading` from context.

### Infra

- Added weekly roadmap sync workflow (`.github/workflows/weekly-sync.yml`) — opens a Monday issue automatically.
- Aligned `@eslint/js` to v9 to match ESLint 9; CI now gates on lint.
- Added `claude/*` branch pattern to PR policy allowlist for automation branches.
- Lazy-loaded AfA compliance page via `React.lazy` to reduce initial bundle size.

## [2026-03-03] - Month 2 Foundation

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
- Added Firebase Google sign-in support in the sign-in screen when Firebase is configured.

### Fixed

- Hardened application form validation (required fields, URL validation, date validity, future-date guard, inline errors).

### Docs

- Added AI Production OS v1 documentation pack in `docs/`.
- Added reusable workflow setup guide: `docs/WORKFLOW_AUTOMATION_PLAYBOOK.md`.
- Added README screenshots using committed assets and removed duplicate image blocks.
- Updated roadmap Week 2 deployment references from generic static hosting to Vercel.
- Updated roadmap/readme status to reflect completed Month 2 and added `docs/NEXT_SESSION_START.md`.

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
