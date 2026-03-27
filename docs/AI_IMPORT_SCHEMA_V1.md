# AI Import Schema V1

## Purpose
AI Import Enrichment v1 adds an optional enrichment layer on top of the existing Paste Link ingestion flow.

The deterministic pipeline stays responsible for:
- source detection
- HTML/text parsing
- rule-based normalization
- duplicate matching
- review and save

The AI layer is additive. It can suggest structured fields, confidence, and review flags without blocking the current import path.

## Design Principles
- Backward-compatible: existing company and role drafts still work unchanged.
- Optional: all AI fields live under `aiEnrichment`.
- Review-first: AI output is advisory until accepted by the user or downstream logic.
- Source-aware: keep raw extracted values separate from normalized and enriched values.

## Top-Level Shape
`aiEnrichment` uses schema version `ai_import_v1` and may appear on:
- `ParsedImportResult`
- `NormalizedImportResult`
- `NormalizedCompanyDraft`
- `NormalizedRoleDraft`
- persisted `JobOsCompany`
- persisted `JobOsRole`
- persisted `JobOsApplication`

## Data Layers

### 1. Raw Extracted Fields
These are directly parsed from HTML, meta tags, JSON blobs, pasted JD text, or source adapters.

Company-oriented fields:
- `companyName`
- `website`
- `careersUrl`
- `industryHint`
- `sizeHint`
- `locationHint`
- `remotePolicyHint`
- `englishFirstHint`

Role-oriented fields:
- `roleTitle`
- `roleUrl`
- `roleLocation`
- `seniorityHint`
- `jobDescription`
- `notes`

These fields are lossy and source-shaped. They should not be treated as final canonical data.

### 2. Normalized Fields
These represent the deterministic JobSprint-ready draft after rule-based cleanup.

Normalized company fields:
- `name`
- `industry`
- `size`
- `remotePolicy`
- `location`
- `englishFirst`

Normalized role fields:
- `title`
- `url`
- `location`
- `seniority`
- `track`
- `fitScore`
- `status`
- `nextAction`

These fields remain the primary save payload for v1.

### 3. AI-Enriched Fields
These are optional structured suggestions intended to improve downstream workflows.

Company enrichment:
- `industry`
- `sizeBand`
- `companyStage`
- `hiringSignal`
- `operatingRegion`

Role enrichment:
- `track`
- `seniority`
- `nextBestAction`
- `applicationReadiness`
- `keyRequirements`

## Enums

### Role Track
- `TPM`
- `Product Engineer`
- `Systems PM`
- `Unknown`

### Seniority
- `Junior`
- `Middle`
- `Senior`
- `Lead`
- `Staff`
- `Principal`
- `Director`
- `VP`
- `Executive`
- `Unknown`

### Industry
- `AI / Data`
- `Cybersecurity`
- `Developer Tools`
- `E-Commerce / Marketplace`
- `EdTech`
- `Fintech / Finance`
- `Healthcare`
- `HR / Talent`
- `Logistics`
- `Media / Content`
- `PropTech`
- `SaaS / Software`
- `Unknown`

### Company Size Band
- `1-10`
- `11-50`
- `51-200`
- `201-500`
- `501-1000`
- `1001-5000`
- `5000+`
- `Unknown`

### Company Stage
- `Pre-seed`
- `Seed`
- `Series A`
- `Series B`
- `Series C+`
- `Private Growth`
- `Bootstrapped`
- `Public`
- `Enterprise`
- `Unknown`

### Next Best Action
- `Research`
- `Tailor CV`
- `Apply`
- `Follow up`
- `Network`
- `Archive`

## Confidence Model
Confidence is modeled separately from the values themselves.

`overall`
- one confidence object for the full enrichment package

`fields`
- keyed map of per-field confidence objects
- examples:
  - `company.industry`
  - `company.sizeBand`
  - `role.track`
  - `role.nextBestAction`

Each confidence object contains:
- `score`: numeric `0..1`
- `level`: `low | medium | high`
- `evidence?`: optional supporting phrases or extracted snippets
- `source?`: `rules | model | human`

## Review Flags
Review flags are explicit reasons to pause, verify, or route to user review.

Current flag codes:
- `missing_company_name`
- `missing_role_title`
- `missing_job_description`
- `unclear_location`
- `unclear_seniority`
- `unclear_track`
- `unclear_industry`
- `unclear_company_size`
- `unclear_company_stage`
- `duplicate_company_match`
- `low_confidence_parse`
- `manual_review_recommended`

Each flag includes:
- `code`
- `severity`: `info | review | warning`
- `message`
- `fieldPath?`

## Backward Compatibility Strategy
- Existing top-level company and role fields remain unchanged.
- `aiEnrichment` is optional and ignored by old callers.
- The review UI can continue reading `result.company` and `result.role`.
- The save path can persist `aiEnrichment` without requiring UI changes.
- Future backend/model work can populate `ParsedImportResult.aiEnrichment` without rewriting the current adapters first.

## Initial Persistence Plan
In v1, `aiEnrichment` is allowed on:
- company records
- role records
- application records

This keeps the schema flexible enough for:
- import-time suggestions
- post-import enrichment
- later review workflows

## Out Of Scope For V1
- live AI backend calls
- UI changes for editing AI fields
- automated overwrite of normalized deterministic values
- mandatory migration of existing data
