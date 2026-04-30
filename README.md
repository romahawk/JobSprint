
# JobSprint

JobSprint is a job-search execution OS for solo operators. It replaces the
spreadsheet/browser-tabs/email-thread patchwork with a software-grade production system that
lets you run your search like a measurable pipeline.

## What It Does

| Module | What you do there |
|---|---|
| **Source Hub** | Track job boards and company career pages; manage saved searches |
| **Companies** | Build your target company list; import via CSV |
| **Roles** | Manage open role opportunities linked to companies |
| **Applications** | Log applications with status, CV used, and next action |
| **Outreach** | Track recruiter and direct outreach messages |
| **CV Assets Vault** | Store CV text snapshots, scripts, and templates; link to applications |
| **CV Optimizer** | Tailor your CV to a specific role using AI (optional OpenAI key) |
| **Command Centre** | Daily view: most urgent next actions, pipeline snapshot, probability engine |
| **Analytics** | Funnel conversion, application rate, and offer probability trends |
| **AfA Compliance** | Track Arbeitsförderungsgesetz application obligations (German job-seekers) |

## Who It Is For

A single job-search operator — typically a product manager, TPM, or implementation specialist —
who wants to run a structured search with visible pipeline metrics and daily execution focus.

## Current Status

- Stage: MVP+ (Firebase auth + Firestore persistence enabled)
- Production URL: **https://job-sprint-ten.vercel.app/**
- Canonical branch: `main`

## Tech Stack

| Concern | Choice |
|---|---|
| Bundler | Vite |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS v4 + Radix UI |
| Routing | React Router v7 |
| Persistence | Firebase Firestore (primary) / localStorage (fallback) |
| Auth | Firebase email/password (primary) / local email session (fallback) |
| Testing | Vitest (unit) + Playwright (E2E) |
| CI | GitHub Actions |
| Hosting | Vercel |

## Setup

```bash
npm install
npm run dev       # start dev server on http://localhost:5173
npm run lint      # must exit 0 before any commit
npm run build     # must pass before any commit
npm run test      # Vitest unit tests
npm run test:e2e  # Playwright E2E (requires a running build: npm run preview)
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Without Firebase vars the app runs in local-session mode (localStorage only, no cross-device sync).

## Live CV Tailoring (optional)

To enable AI-powered CV rewriting:

```bash
cp .env.server.example .env.server
# set OPENAI_API_KEY in .env.server

npm run dev:api          # starts Express server on port 8787
```

Then in `.env`:
```bash
VITE_JSPRINT_REMOTE_API_URL=http://localhost:8787
```

See [docs/CV_TAILORING_API.md](./docs/CV_TAILORING_API.md) for the full API contract.

## Branch Policy

- `main` is the canonical production branch
- Feature branches: `feat/{issue-number}-short-slug`
- Fix branches: `fix/{issue-number}-short-slug`
- One issue = one branch = one PR
- All PRs require `npm run lint && npm run build` to pass
- Direct pushes to `main` are not allowed

See [CLAUDE.md](./CLAUDE.md) and [CONTRIBUTING.md](./CONTRIBUTING.md) for full governance rules.

## Case Study

**Problem:** Running a serious job search is a full-time operational problem. Most candidates track
across a mix of spreadsheets, LinkedIn saved jobs, browser tabs, and email threads. There is no
single place to see which companies are in-flight, what the next action is, what the interview
conversion rate looks like, or whether the current pace will produce an offer.

**Solution:** JobSprint replaces that patchwork with a software-grade execution system: a Source Hub
that anchors the top of the funnel, a Command Centre that surfaces the three most urgent actions
every day, a probability engine that models offer likelihood from actual funnel data, a CV tailoring
workflow, and an AfA compliance module for German job-seekers.

**Live demo:** https://job-sprint-ten.vercel.app/

**Walkthrough:** _(Loom walkthrough coming soon)_

| Decision | Rationale |
|---|---|
| Vite + React 18 + TypeScript | Fast feedback; type safety across a growing codebase |
| Tailwind v4 + Radix UI | No duplicate styling systems; accessible primitives |
| Firebase Auth + Firestore | Zero-ops persistence; localStorage fallback for offline |
| Pure-TS next-action engine | Deterministic, testable scoring without a backend round-trip |
| Source Hub as top-of-funnel | Anchors the search to a manageable set of vetted sources |

## Screenshots

### Dashboard
![JobSprint Dashboard](./docs/assets/dashboard.png)

### Analytics
![JobSprint Analytics](./docs/assets/analytics.png)

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Roadmap](./docs/ROADMAP.md)
- [Sprint Backlog](./docs/SPRINT_BACKLOG.md)
- [Next Session Start](./docs/NEXT_SESSION_START.md)
- [PRD](./docs/PRD.md)
- [Decisions Log](./docs/DECISIONS_LOG.md)
- [CV Tailoring API](./docs/CV_TAILORING_API.md)
- [AI Import Schema](./docs/AI_IMPORT_SCHEMA_V1.md)
- [Case Study — Assets Vault](./docs/CASE_STUDY_ASSETS_VAULT.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
