# Architecture

## High-Level Overview

JobSprint is a client-side single-page application built with Vite + React + TypeScript. It uses React Router for page navigation, a sign-in gate, and a global context provider for application state. Persistence is handled behind a repository boundary with local fallback and optional remote API mode.

## Key Components

- `src/app/context.tsx`
  - Central state container for auth session, applications, weekly goals, theme mode, sync state, and delete-undo queue.
- `src/app/services/storage.ts`
  - Repository interface and adapters (local + optional remote API).
  - Includes legacy local-data migration helper.
- `src/app/services/auth.ts`
  - Session bootstrap and local email-based sign-in/sign-out.
- `src/app/pages/Dashboard.tsx`
  - Main execution page containing KPI strip, pipeline board, and weekly/probability panels.
- `src/app/pages/Analytics.tsx`
  - Trend charts and conversion funnel visualizations.
- `src/app/components/*`
  - Domain components for application cards, modals, and panels.
- `src/app/utils.ts`
  - Metric and probability calculations.

## Data Model

Primary entity:

- `Application` (company, role, date, status, priority, notes, etc.)

Supporting entities:

- `WeeklyGoals`
- `WeeklyChecklistItem`

All data types are declared in `src/app/types.ts`.

## Data Flow

1. User triggers UI action (create/edit/delete/move application).
2. Component calls context action from `useApp()`.
3. Context updates in-memory React state.
4. Derived metrics are recalculated in utility functions.
5. Updated state is persisted via repository adapter (`local` or `remote`).
6. UI rerenders with updated KPI/pipeline/chart values.

## Storage and Auth Choices

- Storage: repository adapter
  - Local mode: user-scoped `localStorage` keys.
  - Remote mode: API calls to `VITE_JSPRINT_REMOTE_API_URL`.
- Authentication: local email session bootstrap (MVP), designed to swap with hosted auth provider.

## Key Tradeoffs

- Chosen: local-first simplicity and speed
  - Pros: fast iteration, no backend complexity
  - Cons: no cross-device sync, weak durability
- Chosen: context-based state
  - Pros: low ceremony for MVP
  - Cons: less scalable for complex async flows

## Future Scaling Notes

- Introduce a persistence boundary (repository/service layer) before adding backend.
- Add schema validation at input boundaries.
- Add API-backed persistence and auth once test and CI baseline is stable.
- Add instrumentation for funnel events to improve metric trust.
