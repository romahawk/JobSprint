# Architecture

Last updated: 2026-04-29

## Overview

JobSprint is a client-side single-page application (SPA) built with Vite + React 18 + TypeScript. It
targets a solo job-search operator and provides a full execution OS: source management, qualification
queue, pipeline tracking, outreach, CV tailoring, AfA compliance, and analytics.

Persistence is Firebase Firestore (primary) with a `localStorage` fallback for offline or unauthenticated
sessions. Auth is Firebase email/password with a local email-session fallback.

---

## Source Layout

```
src/
  main.tsx                   # app entry, mounts router
  app/
    App.tsx                  # provider tree (theme, context)
    context.tsx              # useApp() — auth session, theme, sync
    context/
      JobOsContext.tsx        # JobOs state and CRUD actions
    routes.tsx               # createBrowserRouter, lazy-loaded pages
    routing.ts               # appPath() helper for /app/* prefix
    components/
      AppNavbar.tsx           # top nav — Action / Pipeline / System tabs
      AppErrorBoundary.tsx    # React error boundary with auto-reload
      ProtectedRoute.tsx      # auth guard
      SyncStatusBadge.tsx     # Firestore write-pending badge
      WeeklyExecutionPanel.tsx
      compliance/             # AfA modal, dashboard, report, table
      dashboard/              # Dashboard sub-components (NextAction, Pipeline, etc.)
      figma/                  # ImageWithFallback helper (rename candidate → ui/)
      job-os/                 # Core Job OS: layout, command center, import dialogs
      layout/                 # AppPageShell (page wrapper)
      ui/                     # Radix-based design system components (shadcn pattern)
    hooks/
      useAfaCompliance.ts     # AfA compliance derived state
      useJobOs.ts             # Full Job OS state hook (thin wrapper over JobOsContext)
      usePagination.ts        # Generic pagination
      useUnsavedChanges.ts    # Warn on unsaved edits
    pages/
      SignIn.tsx
      NotFound.tsx
      Analytics.tsx
      AfaCompliancePage.tsx
      dashboard/
        DashboardPage.tsx     # Command Centre: next-action engine, pipeline snapshot
      job-os/
        JobOsSourcesPage.tsx  # Source Hub (top-of-funnel)
        JobOsCompaniesPage.tsx
        JobOsRolesPage.tsx
        JobOsApplicationsPage.tsx
        JobOsOutreachPage.tsx
        JobOsAssetsPage.tsx   # CV Assets Vault
        JobOsSettingsPage.tsx # Import/export, data management
        JobOsAfaReportPage.tsx # Public-accessible AfA report
    services/
      auth.ts                 # Firebase + local session bootstrap
      firebase.ts             # Firebase app init
      storage.ts              # localStorage adapter
      jobOsState.ts           # Default state seeds, normalisation helpers
      jobOsSync.ts            # Firestore read/write sync layer
      jobOsApplications.ts    # Application status logic and sorting
      jobOsExport.ts          # JSON round-trip export/import
      jobOsTransfer.ts        # CSV company import
      jobOsExport.test.ts     # Unit tests — MIGRATION CANDIDATE → tests/unit/
      cvAssets.ts             # CV asset normalisation
      dashboardOnboarding.ts  # Getting Started checklist state
      analytics.ts            # Page view tracking
      execution/
        nextActionEngine.ts   # Pure TS next-action scoring
      ingestion/
        jobImportEnrichmentGateway.ts
        companyIngestionService.ts
        preprocessImportText.ts
        sourceAdapters/       # LinkedIn, Greenhouse, Ashby, Lever, Himalayas, Generic
        types.ts
        utils.ts
    types/
      jobOs.ts                # All Job OS entity types
      afa.ts                  # AfA compliance types
    types.ts                  # LEGACY — shared auth/session types; migration candidate → types/
    utils/
      afaDeadlineEngine.ts
      afaRiskEngine.ts
    utils.ts                  # LEGACY — metric/probability calculations; migration candidate → utils/
  features/
    cvOptimizer/              # CV Optimizer feature module (all self-contained)
      CvOptimizerPage.tsx
      CvProfileSelector.tsx
      FitAnalysisPanel.tsx
      JobDescriptionInput.tsx
      PortfolioSuggestions.tsx
      TailoredOutputPanel.tsx
      TailoringHistoryList.tsx
  marketing/
    LandingPage.tsx           # Public landing — redirects to /app if already signed in
  services/                   # CV tailoring services — SPLIT from src/app/services/
    cvFileImportService.ts    # mammoth + pdfjs file parsing
    cvOptimizerService.ts
    cvTailoringGateway.ts     # OpenAI API gateway
  styles/
    index.css
    tailwind.css
    theme.css
    fonts.css
```

---

## Data Model

Primary state container: `JobOsState` (defined in `src/app/types/jobOs.ts`).

| Entity | Key fields | Purpose |
|---|---|---|
| `JobSource` | id, name, url, category, priority, cadence | Source Hub — where to find jobs |
| `SavedSearch` | id, name, url, sourceId, track | Saved search URLs per source |
| `JobOsCompany` | id, name, sector, size, notes | Company engine |
| `JobOsRole` | id, companyId, title, track, status, nextAction | Roles pipeline |
| `JobOsApplication` | id, roleId, companyId, status, cvAssetId, interviews | Applications log |
| `JobOsScriptAsset` | id, name, body | Reusable outreach scripts |
| `JobOsTemplateAsset` | id, name, body | Reusable email templates |
| `JobOsCvAsset` | id, name, text, isDefault | CV text snapshots |
| `CvProfile` | id, targetTrack, headline, summary, skills | CV tailoring profiles |
| `CvTailoringRun` | id, cvProfileId, jobDescriptionId, output | Tailoring history |

Auth/session types are in `src/app/types.ts` (legacy root file, migration candidate).

---

## Navigation Structure

```
/ (public landing)
  → redirects to /app if session exists

/signin

/app (ProtectedRoute)
  /app                          Dashboard (Command Centre)
  /app/analytics                Analytics
  /app/compliance/afa           AfA Compliance
  /app/cv-optimizer             CV Optimizer
  /app/job-os/sources           Source Hub        ← top of funnel
  /app/job-os/companies         Companies
  /app/job-os/roles             Roles
  /app/job-os/applications      Applications
  /app/job-os/outreach          Outreach
  /app/job-os/assets            Assets Vault
  /app/job-os/settings          Settings

/app/job-os/afa-report          Public AfA report (no auth required)
```

Top nav groups: **Action** (dashboard + analytics) | **Pipeline** (applications + outreach) | **System** (assets, companies, roles, cv-optimizer, compliance, settings)

---

## Data Flow

1. User triggers UI action.
2. Component calls action from `useJobOs()` or `useApp()`.
3. Hook optimistically updates React state.
4. State is written to `localStorage` via `storage.ts`.
5. If Firebase is configured, `jobOsSync.ts` mirrors the change to Firestore.
6. `SyncStatusBadge` reflects pending/synced/error state.

---

## Persistence Modes

| Mode | Trigger | Scope |
|---|---|---|
| Local only | No `VITE_FIREBASE_*` env vars | All data in `localStorage` per user key |
| Firebase | `VITE_FIREBASE_*` env vars present | Auth: Firebase email/password; data: Firestore per-user |
| CV tailoring API | `VITE_JSPRINT_REMOTE_API_URL` set | `POST /cv-tailor` to local Express server (`server/`) |

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| Vite + React 18 + TypeScript | Fast feedback; full type safety across the growing codebase |
| Tailwind CSS v4 + Radix UI | No duplicate styling systems; accessible primitives |
| Firebase Auth + Firestore | Zero-ops persistence with real-time sync; localStorage fallback for offline |
| React Router v7 lazy routes | Code-split by page; avoids loading all feature code upfront |
| Pure-TS next-action engine | Deterministic, unit-testable scoring without a backend round-trip |
| Local-first + Firestore mirror | Fast UI, eventual sync; works offline |
| `appPath()` prefix helper | Keeps all app routes under `/app/*`, allowing `/*` for public pages |

---

## Known Structure Issues (migration backlog)

| Issue | Location | Risk | Fix |
|---|---|---|---|
| Parallel root types file | `src/app/types.ts` alongside `src/app/types/` | Confusion about which file to add to | Merge `types.ts` into `types/session.ts` or `types/index.ts` |
| Parallel root utils file | `src/app/utils.ts` alongside `src/app/utils/` | Same confusion | Move helpers to `utils/metrics.ts` |
| Parallel root context file | `src/app/context.tsx` alongside `src/app/context/` | Two context patterns | Consolidate; `context.tsx` can re-export from `context/` |
| CV services outside app/ | `src/services/` vs `src/app/services/` | Mental model split | Move to `src/app/services/cv/` or `src/features/cvOptimizer/services/` |
| Test file in services/ | `src/app/services/jobOsExport.test.ts` | Breaks colocation convention | Move to `tests/unit/jobOsExport.test.ts` |
| `figma/` component folder | `src/app/components/figma/ImageWithFallback.tsx` | Misleading name | Rename folder to `ui/` or move file to `components/ui/` |
| Source Hub not in features/ | `src/app/pages/job-os/JobOsSourcesPage.tsx` | Mixed feature/app concerns | Create `src/features/source-hub/` as issues mature |

Do not perform a mass file migration without a dedicated issue. Document the target and migrate incrementally.

---

## Target Directory Structure (next 3-6 months)

```
src/
  app/                  # routing, shell, shared components, shared state
  features/
    cv-optimizer/       # already exists
    source-hub/         # Sources + SavedSearches (extract from job-os pages)
    afa-compliance/     # AfA module (extract from compliance pages/components)
  services/             # MERGE into src/app/services/ or src/features/*/services/
  styles/
tests/
  unit/
  e2e/
```
