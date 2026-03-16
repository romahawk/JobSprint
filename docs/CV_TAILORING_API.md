# CV Tailoring API

JobSprint can run live CV tailoring when `VITE_JSPRINT_REMOTE_API_URL` points to a backend that exposes `POST /cv-tailor`.

## Why a backend is required

This app is a browser-based Vite SPA. OpenAI API keys must stay server-side, so the frontend should call your backend, and the backend should call OpenAI.

Official docs:
- Responses API: https://platform.openai.com/docs/api-reference/responses
- Structured outputs: https://platform.openai.com/docs/guides/structured-outputs
- API key safety: https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety

## Frontend request shape

`POST /cv-tailor`

```json
{
  "mode": "fullTailor",
  "cvName": "CV - Technical Product Manager",
  "cvVersion": "v1.0",
  "cvSourceText": "Full plain-text CV snapshot from Assets Vault...",
  "profile": {
    "id": "cv-profile-tpm-core",
    "name": "TPM Core Profile",
    "targetTrack": "TPM",
    "headline": "Technical Product and Delivery Leader",
    "summary": "...",
    "experience": [],
    "skills": ["Stakeholder management"]
  },
  "analysis": {
    "fitScore": 72,
    "strengths": ["Product Management alignment"],
    "gaps": ["Roadmap"],
    "keywords": ["Product Management", "Roadmap"],
    "recruiterRisks": [],
    "recommendedPositioning": "Technical product and delivery leader...",
    "portfolioRecommendations": ["LiveSurgery"]
  },
  "jobDescriptionText": "Role description...",
  "company": "Invoca",
  "roleTitle": "Senior Research Engineer"
}
```

## Expected response shape

```json
{
  "headline": "Technical Product and Delivery Leader | Privacy and Attribution",
  "summary": "...",
  "rewrittenBullets": ["...", "..."],
  "portfolioRecommendations": ["LiveSurgery"],
  "fullCvText": "Full tailored CV preserving the selected Asset CV structure.",
  "changedLineIndices": [0, 4, 5, 12],
  "changedWordSpans": [
    { "lineIndex": 0, "startWord": 5, "endWord": 8 },
    { "lineIndex": 5, "startWord": 0, "endWord": 6 }
  ],
  "model": "gpt-5"
}
```

## Backend behavior

1. Accept the selected Asset CV text as the source of truth.
2. Preserve the CV section order and structure.
3. Tailor wording to the selected role using only facts already present in the CV/profile payload.
4. Return JSON only.
5. For `fullTailor`, always return `fullCvText`.
6. Return `changedLineIndices` so the UI can highlight exact changed lines against the original Asset CV.
7. Return `changedWordSpans` so the UI can highlight the exact changed words inside each changed line.

## Prompting notes

A good server prompt should tell the model to:
- treat `cvSourceText` as the canonical base document
- preserve section order and avoid inventing employers, dates, tools, or metrics
- rewrite summary and bullets for relevance to the role
- keep output machine-parseable via structured JSON
