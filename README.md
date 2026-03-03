
# JobSprint

JobSprint is a job-search execution dashboard for solo operators: track applications, monitor funnel conversion, and focus weekly effort on actions that improve your odds of getting an offer.

## 30-Second Pitch

Most job searches fail from inconsistent execution, not lack of talent. JobSprint gives you a visible pipeline, weekly execution targets, and analytics so you can run your search like a measurable production system.

## Current Status

- Stage: MVP+ (Firebase auth + Firestore persistence enabled)
- Scope: dashboard, pipeline tracking, analytics, weekly execution panel, sync status, safe delete undo
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
npm install
npm run dev
```

App access requires sign-in. If Firebase env vars are configured, auth uses Firebase email/password + Google sign-in.
If Firebase env vars are configured, sign-in uses Firebase email/password auth.

Build for production:

```bash
npm run build
```

Run smoke tests:

```bash
npm run test
```

## Deploy

- Current production URL: https://job-sprint-ten.vercel.app/
- Hosting: Vercel
- Optional remote persistence can be configured with `VITE_JSPRINT_REMOTE_API_URL`.
- Firebase mode (Auth + Firestore) is enabled automatically when required `VITE_FIREBASE_*` variables are set.
- Firebase mode (auth + Firestore) is enabled when required `VITE_FIREBASE_*` values are set.

## Screenshots

### Dashboard
![JobSprint Dashboard](./docs/assets/dashboard.png)

### Analytics
![JobSprint Analytics](./docs/assets/analytics.png)

## Documentation

- [PRD](./docs/PRD.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Roadmap](./docs/ROADMAP.md)
- [Decisions Log](./docs/DECISIONS_LOG.md)
- [Workflow Automation Playbook](./docs/WORKFLOW_AUTOMATION_PLAYBOOK.md)
- [Cross-Device Sync Checklist](./docs/CROSS_DEVICE_SYNC_CHECKLIST.md)
- [Next Session Start](./docs/NEXT_SESSION_START.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
  
