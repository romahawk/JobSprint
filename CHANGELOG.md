# Changelog

All notable changes to this project are documented in this file.

The format follows Keep a Changelog principles and this project uses date-based release notes during MVP stage.

## [Unreleased]

### Added

- Wave 2 UX feedback loops: empty states, loading skeletons, unsaved-changes guard.
- `Analytics`: "No data yet" empty state (BarChart2 icon + CTA) when both Job OS and legacy applications are empty.
- `Analytics`: Tailwind pulse skeletons (funnel card + two chart cards) shown while data hydrates, replacing blank chart axes.
- `AfaCompliancePage`: Shield icon + "Add First Case" CTA when `cases.length === 0`.
- `useUnsavedChanges(isDirty)` hook: returns `confirmDiscard()` — no-op when clean, `window.confirm` when dirty.
- Discard-changes guard wired into `ApplicationModal`, `AfaCaseModal`, Job OS create/detail dialogs (`JobOsApplicationsPage`), and the add-role form toggle (`JobOsRolesPage`).

### Changed

- Repo audit: removed 4 orphaned packages (`@popperjs/core`, `react-popper`, `react-slick`, `react-responsive-masonry`).
- `.gitignore` extended with `.DS_Store`, `*.local`, `coverage/`, `.vercel`.
- `docs/DEV_WORKFLOW.md` created: full day-to-day developer guide covering setup, dev loop, branch naming, commit format, CI, testing, env vars, and stack reference.
- `README.md`: replaced TODO placeholder comments with prose; linked DEV_WORKFLOW.md in Documentation section.
- `CLAUDE.md`: added PR Creation section mandating all template fields be populated with real content when using `gh pr create`.

## [2026-03-20]

### Added

- Command Centre replaces legacy Dashboard as the primary surface: next-action engine, pipeline snapshot, probability engine panel (collapsible, closed by default with headline % visible), and hot opportunities.
- Quick Actions pinned to top of Command Centre right column for always-accessible navigation.
- Recruiter-origin flag (`origin: "self_sourced" | "recruiter"`) on roles: picker in Add Role form, inline edit support, violet "Recruiter" badge in roles table.
- Probability engine extended with `responseRate`, `interviewRate`, `offerRate` derived from Job OS application data.
- Paste Link import engine for companies (AI-assisted extraction from job posting URLs).
- Case-study section added to README (problem, solution, key decisions, live link, Loom placeholder) â€” closes #39.
- Playwright E2E baseline: 11 specs across auth, Command Centre, and Job OS navigation; CI `e2e` job added â€” closes #37.
- JSON export/import at `/job-os/settings`: full pipeline backup (companies, roles, applications, outreach) with schema validation and 9 Vitest unit tests â€” closes #38.
### Added

- Added collapsible `Probability Engine` panel, collapsed `Add Role` form by default, and sticky `Quick Actions` placement to compress dashboard and Job OS vertical space.
- Added `Log Application` next action when a role has progressed past `to_apply` but no linked application row exists.
- Added Job OS import/export from the shared settings panel with validation and full-state replace support.
- Added Playwright E2E baseline for role-to-application logging, duplicate prevention, and refresh persistence.
- Added Playwright coverage for the Assets Vault CV constructor, including rename persistence, duplicate flow, and default CV behavior.
- Added Playwright coverage for Job OS import/export, CV file import, and reusable script/template editing plus delete-confirmation flows.
- Added Assets Vault CV constructor with up to 5 managed CV variants, one default CV, and application linkage visibility.
- Added `docs/CASE_STUDY_ASSETS_VAULT.md` as an outward-facing product story for the Assets Vault upgrade.
- Added screenshot-backed demo context to the Assets Vault case study and linked it from the README as the main proof-of-work artifact.

### Fixed

- Fixed silent application creation from the Roles page by showing explicit success/error feedback and preventing duplicate applications for the same role.
- Fixed fragile CV selection by linking applications to stable `cvAssetId` values while preserving backward compatibility with older name-based records.
- Fixed Assets delete flows by replacing browser confirms with proper modal confirmation and explicit toast feedback.
- Fixed the dashboard right rail overlap by making the full context column sticky instead of only the Quick Actions card.

### Changed

- Started bundle-size reduction with route-level lazy loading plus manual chunk splitting for Firebase, PDF.js, charts, and shared vendor code.
- Continued bundle-size reduction with focused manual chunks for Radix, motion, and shared UI support dependencies, plus lazy loading of CV file import tooling from the Assets page.

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
