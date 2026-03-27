# AI Import API

JobSprint can enrich imported job links through a backend endpoint that keeps the OpenAI API key server-side and returns strict structured output.

## Endpoint

`POST /job-import-enrich`

This endpoint is implemented in the existing server at [cv-tailor-server.mjs](/d:/WORK/IT_Projects/JobSprint/server/cv-tailor-server.mjs).

## Why a backend is required

The frontend is a browser-based Vite SPA. The OpenAI API key must stay on the server, so the frontend should call this endpoint and the server should call OpenAI.

## Request shape

The request must be JSON and include `rawExtracted`.

```json
{
  "sourceUrl": "https://boards.greenhouse.io/acme/jobs/12345",
  "sourcePlatform": "greenhouse",
  "sourceType": "job",
  "importConfidence": 0.78,
  "rawExtracted": {
    "companyName": "Acme",
    "website": "https://acme.com",
    "careersUrl": "https://acme.com/careers",
    "industryHint": "Developer tools",
    "sizeHint": "201-500 employees",
    "locationHint": "Berlin, Germany",
    "remotePolicyHint": "Hybrid",
    "roleTitle": "Senior Technical Product Manager",
    "roleUrl": "https://boards.greenhouse.io/acme/jobs/12345",
    "roleLocation": "Berlin, Germany",
    "seniorityHint": "Senior",
    "jobDescription": "Full job description text...",
    "notes": "Imported from ATS page"
  },
  "normalized": {
    "company": {
      "name": "Acme",
      "industry": "Developer tools",
      "size": "201-500 employees",
      "remotePolicy": "Hybrid",
      "location": "Berlin, Germany",
      "englishFirst": "Unknown"
    },
    "role": {
      "title": "Senior Technical Product Manager",
      "url": "https://boards.greenhouse.io/acme/jobs/12345",
      "location": "Berlin, Germany",
      "seniority": "Senior",
      "track": "TPM",
      "fitScore": 3,
      "status": "to_apply",
      "nextAction": "Apply"
    }
  }
}
```

Validation rules:
- request body must be a JSON object
- `rawExtracted` must be present
- at least one of `rawExtracted.companyName`, `rawExtracted.roleTitle`, or `rawExtracted.jobDescription` must be present
- `importConfidence`, if provided, must be between `0` and `1`

## Response shape

```json
{
  "schemaVersion": "ai_import_v1",
  "canonicalTitle": "Senior Technical Product Manager",
  "roleTrack": "TPM",
  "seniority": "Senior",
  "industry": "Developer Tools",
  "companyStage": "Unknown",
  "companySizeBand": "201-500",
  "workplaceMode": "Hybrid",
  "fitScore": 4,
  "priorityBand": "B",
  "nextBestAction": "Tailor CV",
  "confidence": {
    "overall": {
      "score": 0.78,
      "level": "medium",
      "evidence": ["Senior Technical Product Manager", "Hybrid", "201-500 employees"],
      "source": "model"
    },
    "fields": {
      "canonicalTitle": {
        "score": 0.93,
        "level": "high",
        "evidence": ["Senior Technical Product Manager"],
        "source": "model"
      },
      "roleTrack": {
        "score": 0.88,
        "level": "high",
        "evidence": ["Technical Product Manager"],
        "source": "model"
      },
      "seniority": {
        "score": 0.95,
        "level": "high",
        "evidence": ["Senior"],
        "source": "model"
      },
      "industry": {
        "score": 0.61,
        "level": "medium",
        "evidence": ["Developer tools"],
        "source": "model"
      },
      "companyStage": {
        "score": 0.15,
        "level": "low",
        "evidence": [],
        "source": "model"
      },
      "companySizeBand": {
        "score": 0.86,
        "level": "high",
        "evidence": ["201-500 employees"],
        "source": "model"
      },
      "workplaceMode": {
        "score": 0.91,
        "level": "high",
        "evidence": ["Hybrid"],
        "source": "model"
      },
      "fitScore": {
        "score": 0.67,
        "level": "medium",
        "evidence": ["complete JD present", "structured title present"],
        "source": "model"
      },
      "priorityBand": {
        "score": 0.32,
        "level": "low",
        "evidence": [],
        "source": "model"
      },
      "nextBestAction": {
        "score": 0.76,
        "level": "medium",
        "evidence": ["full job description present"],
        "source": "model"
      }
    }
  },
  "reviewFlags": [
    {
      "code": "unclear_company_stage",
      "severity": "review",
      "message": "The source does not provide reliable company stage evidence.",
      "fieldPath": "companyStage"
    }
  ],
  "model": "gpt-4.1-mini"
}
```

## Enforced enums

The endpoint only allows the following structured classifications:

- `roleTrack`: `TPM | Product Engineer | Systems PM | Unknown`
- `seniority`: `Junior | Middle | Senior | Lead | Staff | Principal | Director | VP | Executive | Unknown`
- `industry`: `AI / Data | Cybersecurity | Developer Tools | E-Commerce / Marketplace | EdTech | Fintech / Finance | Healthcare | HR / Talent | Logistics | Media / Content | PropTech | SaaS / Software | Unknown`
- `companyStage`: `Pre-seed | Seed | Series A | Series B | Series C+ | Private Growth | Bootstrapped | Public | Enterprise | Unknown`
- `companySizeBand`: `1-10 | 11-50 | 51-200 | 201-500 | 501-1000 | 1001-5000 | 5000+ | Unknown`
- `workplaceMode`: `Remote | Hybrid | On-site | Unknown`
- `priorityBand`: `A | B | C | Unknown`
- `nextBestAction`: `Research | Tailor CV | Apply | Follow up | Network | Archive`

## Hallucination safeguards

The server prompt explicitly tells the model to:
- classify only from the supplied import payload
- never invent unsupported facts
- return `Unknown` when evidence is weak or absent
- keep normalized fields as secondary context, not as permission to infer new facts
- add review flags for anything a human should verify

The server also enforces strict JSON schema output with `strict: true`, so the model can only return the allowed fields and enums.
