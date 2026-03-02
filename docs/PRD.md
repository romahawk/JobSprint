# Product Requirements Document (PRD)

## Product

JobSprint

## Problem

Job seekers often track applications in scattered notes and spreadsheets, which makes execution inconsistent and outcomes hard to improve. Without visible funnel metrics, it is difficult to know which weekly actions increase interview and offer probability.

## Target User

- Solo job seeker in product or engineering roles
- Transitioning to remote-first opportunities
- Needs an execution-oriented system, not a passive tracker

## Killer Feature

Offer probability engine connected to real pipeline conversion data so daily actions map to expected outcome movement.

## Core Loop

1. Add/update application entries.
2. Move applications through pipeline stages.
3. Review weekly target and checklist completion.
4. Inspect analytics and probability trends.
5. Adjust next-week application strategy.

## MVP Scope

- Application CRUD (create, edit, delete)
- Drag-and-drop pipeline by status
- KPI strip (applications, response, interviews, offers, probability)
- Weekly execution panel (target + checklist)
- Analytics page for weekly and funnel trends
- Local persistence in browser storage

## Non-Goals

- Multi-user collaboration
- ATS/job-board integrations
- Native mobile app
- Advanced ML predictions

## Acceptance Criteria (MVP)

- Users can create, edit, delete, and stage-shift applications.
- Dashboard metrics update immediately after any application change.
- Analytics page renders weekly and funnel charts with no runtime errors.
- Weekly target progress and checklist state persist across refresh.
- App remains usable on desktop and mobile screen sizes.

## Risks

- Local-only persistence can cause data loss across devices.
- Probability model can be misunderstood without contextual explanation.
- Scope creep from UI/system refactors can block visible shipping.

