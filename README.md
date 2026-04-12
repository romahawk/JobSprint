
# JobSprint

JobSprint is a job-search execution dashboard for solo operators: track applications, monitor funnel conversion, and focus weekly effort on actions that improve your odds of getting an offer.

## 30-Second Pitch

Most job searches fail from inconsistent execution, not lack of talent. JobSprint gives you a visible pipeline, weekly execution targets, and analytics so you can run your search like a measurable production system.

## Case Study

**Problem**

Running a serious job search is a full-time operational problem. Most candidates track across a mix of spreadsheets, LinkedIn saved jobs, browser tabs, and email threads. There is no single place to see: which companies are in-flight, what the next action is, what the interview conversion rate looks like, or whether the current pace will realistically produce an offer.

**Solution**

JobSprint replaces that patchwork with a software-grade production system. It has a Command Centre that surfaces the three most urgent actions every day, a probability engine that models offer likelihood from actual funnel data, a Job OS (company engine, roles pipeline, applications log, outreach tracker), a CV tailoring workflow backed by an OpenAI API, and an AfA compliance module for German job-seekers.

**Key Decisions**

| Decision | Rationale |
|---|---|
| Vite + React 18 + TypeScript | Fast feedback loop; type safety across a growing codebase |
| Tailwind CSS v4 + Radix UI | No duplicate styling systems; accessible primitives out of the box |
| Firebase Auth + Firestore | Zero-ops persistence with real-time sync; local-storage fallback for offline |
| Next-action engine (pure TS) | Deterministic, testable scoring without a backend round-trip |
| Recruiter-origin flag on roles | Lets the probability engine separate inbound vs. outbound funnel rates |
| Command Centre as primary surface | Forces daily review of the most important actions, not just passive tracking |

**Live demo:** https://job-sprint-ten.vercel.app/

**Walkthrough:** _(Loom walkthrough coming soon)_

## Current Status

- Stage: MVP+ (Firebase auth + Firestore persistence enabled)
- Scope: dashboard, pipeline tracking, analytics, weekly execution panel, sync status, safe delete undo, Job OS role/application guardrails
- Adoption: AI Production OS v1 process active since March 2, 2026
- Milestone checkpoint: Month 2 foundation completed on March 3, 2026

## Tech Stack

- Vite + React + TypeScript
- React Router
- Tailwind CSS
- Recharts
- Radix UI primitives

## Setup

```bash
npm install   # install dependencies
npm run dev   # start dev server
npm run build # production build
npm run test  # run smoke tests
```

## Live CV Tailoring

To enable live CV tailoring with OpenAI:

```bash
cp .env.server.example .env.server
# set OPENAI_API_KEY and optional OPENAI_MODEL
npm run dev:api
```

Then point the frontend at the API in `.env`:

```bash
VITE_JSPRINT_REMOTE_API_URL=http://localhost:8787
```

The frontend will call `POST /cv-tailor` for live full-CV rewriting. See `docs/CV_TAILORING_API.md`.

App access requires sign-in. If the `VITE_FIREBASE_*` env vars are configured, auth uses Firebase email/password + Google sign-in.

## Deploy

- Current production URL: https://job-sprint-ten.vercel.app/
- Hosting: Vercel
- Optional remote persistence can be configured with `VITE_JSPRINT_REMOTE_API_URL`.
- Firebase mode (Auth + Firestore) is enabled automatically when `VITE_FIREBASE_*` variables are set.

## Screenshots

### Dashboard
![JobSprint Dashboard](./docs/assets/dashboard.png)

### Analytics
![JobSprint Analytics](./docs/assets/analytics.png)

## Demo Artifact

- [Assets Vault Case Study](./docs/CASE_STUDY_ASSETS_VAULT.md)

This is the clearest current proof-of-work artifact for JobSprint's product direction: turning a job-search tracker into an execution system with stable CV assets, reusable scripts, and linked application context.

## Documentation

- [PRD](./docs/PRD.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Roadmap](./docs/ROADMAP.md)
- [Decisions Log](./docs/DECISIONS_LOG.md)
- [Workflow Automation Playbook](./docs/WORKFLOW_AUTOMATION_PLAYBOOK.md)
- [Cross-Device Sync Checklist](./docs/CROSS_DEVICE_SYNC_CHECKLIST.md)
- [Next Session Start](./docs/NEXT_SESSION_START.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Developer Workflow](./docs/DEV_WORKFLOW.md)
- [Changelog](./CHANGELOG.md)

