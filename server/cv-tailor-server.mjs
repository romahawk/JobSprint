import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_PORT = 8787;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const JOB_IMPORT_SCHEMA_VERSION = "ai_import_v1";
const JOB_IMPORT_ENUMS = {
  roleTrack: ["TPM", "Product Engineer", "Systems PM", "Unknown"],
  seniority: ["Junior", "Middle", "Senior", "Lead", "Staff", "Principal", "Director", "VP", "Executive", "Unknown"],
  industry: [
    "AI / Data",
    "Cybersecurity",
    "Developer Tools",
    "E-Commerce / Marketplace",
    "EdTech",
    "Fintech / Finance",
    "Healthcare",
    "HR / Talent",
    "Logistics",
    "Media / Content",
    "PropTech",
    "SaaS / Software",
    "Unknown"
  ],
  companyStage: ["Pre-seed", "Seed", "Series A", "Series B", "Series C+", "Private Growth", "Bootstrapped", "Public", "Enterprise", "Unknown"],
  companySizeBand: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+", "Unknown"],
  workplaceMode: ["Remote", "Hybrid", "On-site", "Unknown"],
  priorityBand: ["A", "B", "C", "Unknown"],
  nextBestAction: ["Research", "Tailor CV", "Apply", "Follow up", "Network", "Archive"],
  confidenceLevel: ["low", "medium", "high"],
  reviewFlagCode: [
    "missing_company_name",
    "missing_role_title",
    "missing_job_description",
    "unclear_location",
    "unclear_seniority",
    "unclear_track",
    "unclear_industry",
    "unclear_company_size",
    "unclear_company_stage",
    "duplicate_company_match",
    "low_confidence_parse",
    "manual_review_recommended"
  ],
  reviewSeverity: ["info", "review", "warning"]
};

loadEnvFiles();

const port = Number(process.env.CV_TAILOR_PORT || DEFAULT_PORT);
const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
const openAiApiKey = process.env.OPENAI_API_KEY || "";
const corsOrigin = process.env.CV_TAILOR_CORS_ORIGIN || "*";

const server = createServer(async (request, response) => {
  try {
    setCorsHeaders(response, corsOrigin);

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.url === "/health") {
      writeJson(response, 200, {
        ok: true,
        service: "cv-tailor",
        model,
        configured: Boolean(openAiApiKey),
      });
      return;
    }

    if (request.method === "POST" && request.url === "/cv-tailor") {
      if (!openAiApiKey) {
        writeJson(response, 500, {
          error: "OPENAI_API_KEY is missing on the server. Configure it in .env.server or your runtime environment.",
        });
        return;
      }

      const body = await readJsonBody(request);
      validateTailoringRequest(body);
      const result = await tailorCvWithOpenAi(body, { apiKey: openAiApiKey, model });
      writeJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && request.url === "/job-import-enrich") {
      if (!openAiApiKey) {
        writeJson(response, 500, {
          error: "OPENAI_API_KEY is missing on the server. Configure it in .env.server or your runtime environment.",
        });
        return;
      }

      const body = await readJsonBody(request);
      validateJobImportEnrichmentRequest(body);
      const result = await enrichJobImportWithOpenAi(body, { apiKey: openAiApiKey, model });
      writeJson(response, 200, result);
      return;
    }

    writeJson(response, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    writeJson(response, 500, { error: message });
  }
});

server.listen(port, () => {
  console.log(`[cv-tailor] listening on http://localhost:${port}`);
});

function setCorsHeaders(response, origin) {
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_BODY_BYTES) {
      throw new Error("Request body is too large.");
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    throw new Error("Request body is empty.");
  }

  return JSON.parse(raw);
}

function validateTailoringRequest(body) {
  if (!body || typeof body !== "object") {
    throw new Error("Tailoring request must be a JSON object.");
  }

  if (body.mode !== "quickTailor" && body.mode !== "fullTailor") {
    throw new Error("Tailoring request mode must be quickTailor or fullTailor.");
  }

  if (typeof body.jobDescriptionText !== "string" || !body.jobDescriptionText.trim()) {
    throw new Error("Tailoring request is missing jobDescriptionText.");
  }

  if (typeof body.cvName !== "string" || !body.cvName.trim()) {
    throw new Error("Tailoring request is missing cvName.");
  }

  if (typeof body.cvSourceText !== "string" || !body.cvSourceText.trim()) {
    throw new Error("Tailoring request is missing cvSourceText from Assets.");
  }

  if (!body.profile || typeof body.profile !== "object") {
    throw new Error("Tailoring request is missing the linked profile.");
  }
}

function validateJobImportEnrichmentRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Job import enrichment request must be a JSON object.");
  }

  if (!body.rawExtracted || typeof body.rawExtracted !== "object" || Array.isArray(body.rawExtracted)) {
    throw new Error("Job import enrichment request is missing rawExtracted.");
  }

  const hasCompanySignal = typeof body.rawExtracted.companyName === "string" && body.rawExtracted.companyName.trim();
  const hasRoleSignal = typeof body.rawExtracted.roleTitle === "string" && body.rawExtracted.roleTitle.trim();
  const hasJobDescription = typeof body.rawExtracted.jobDescription === "string" && body.rawExtracted.jobDescription.trim();

  if (!hasCompanySignal && !hasRoleSignal && !hasJobDescription) {
    throw new Error(
      "Job import enrichment requires at least one of rawExtracted.companyName, rawExtracted.roleTitle, or rawExtracted.jobDescription."
    );
  }

  if (
    body.importConfidence != null &&
    (typeof body.importConfidence !== "number" || Number.isNaN(body.importConfidence) || body.importConfidence < 0 || body.importConfidence > 1)
  ) {
    throw new Error("Job import enrichment importConfidence must be a number between 0 and 1.");
  }

  if (body.normalized != null && (typeof body.normalized !== "object" || Array.isArray(body.normalized))) {
    throw new Error("Job import enrichment normalized must be an object when provided.");
  }
}

async function tailorCvWithOpenAi(payload, config) {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      headline: { type: "string" },
      summary: { type: "string" },
      rewrittenBullets: {
        type: "array",
        items: { type: "string" },
      },
      portfolioRecommendations: {
        type: "array",
        items: { type: "string" },
      },
      fullCvText: { type: "string" },
    },
    required: ["headline", "summary", "rewrittenBullets", "portfolioRecommendations", "fullCvText"],
  };

  const systemPrompt = [
    "You are an expert CV tailoring assistant.",
    "Treat cvSourceText as the canonical base CV document.",
    "Preserve the section order and overall structure of the base CV.",
    "Tailor wording to the target role, but do not invent employers, dates, metrics, tools, projects, industries, achievements, or responsibilities not already supported by the supplied context.",
    "You may rewrite the headline, summary, and bullet phrasing for relevance.",
    "Return valid JSON only matching the provided schema.",
    "For fullCvText, return the entire tailored CV, not a partial diff.",
  ].join(" ");

  const userPrompt = JSON.stringify(
    {
      task: payload.mode,
      targetRole: {
        company: payload.company || "",
        roleTitle: payload.roleTitle || "",
        jobDescriptionText: payload.jobDescriptionText,
      },
      selectedCv: {
        name: payload.cvName,
        version: payload.cvVersion || "",
        cvSourceText: payload.cvSourceText,
      },
      linkedProfile: payload.profile,
      fitAnalysis: payload.analysis,
      outputRules: {
        rewrittenBulletsLimit: 8,
        keepFactsGroundedInSource: true,
      },
    },
    null,
    2
  );

  const parsed = await callOpenAiWithJsonSchema(
    {
      apiKey: config.apiKey,
      model: config.model,
      schemaName: "cv_tailoring_response",
      schema,
      systemPrompt,
      userPrompt,
    }
  );
  const changedLineIndices = getChangedLineIndices(payload.cvSourceText, parsed.fullCvText);
  const changedWordSpans = getChangedWordSpans(payload.cvSourceText, parsed.fullCvText, changedLineIndices);

  return {
    headline: parsed.headline,
    summary: parsed.summary,
    rewrittenBullets: Array.isArray(parsed.rewrittenBullets) ? parsed.rewrittenBullets : [],
    portfolioRecommendations: Array.isArray(parsed.portfolioRecommendations) ? parsed.portfolioRecommendations : [],
    fullCvText: parsed.fullCvText,
    changedLineIndices,
    changedWordSpans,
    model: config.model,
  };
}

async function enrichJobImportWithOpenAi(payload, config) {
  const schema = createJobImportEnrichmentSchema();
  const systemPrompt = [
    "You are a job import enrichment assistant for JobSprint.",
    "Your job is to classify and normalize only from the supplied import payload.",
    "Never invent unsupported facts about the company, role, funding stage, size, work mode, or hiring process.",
    "If the evidence is weak, ambiguous, or absent, return the enum value Unknown instead of guessing.",
    "Use the supplied rawExtracted fields as the primary evidence.",
    "Use normalized fields only as secondary context, not as license to hallucinate.",
    "canonicalTitle must be concise and grounded in the supplied role title or job description. If no reliable title exists, return Unknown.",
    "fitScore must be 1 through 5 and should represent import usefulness and workflow readiness, not candidate-job match quality.",
    "priorityBand must be conservative. Use Unknown when the signal is weak.",
    "nextBestAction must recommend the safest immediate workflow step based on the supplied evidence.",
    "reviewFlags should explain what a human should verify before trusting the enrichment.",
    "confidence must reflect the certainty of each field, and low-confidence fields should usually pair with Unknown values or review flags.",
    "When a review flag is not tied to a single field, use an empty string for fieldPath.",
    "Return valid JSON only matching the provided schema.",
  ].join(" ");

  const userPrompt = JSON.stringify(
    {
      task: "job_import_enrichment_v1",
      schemaVersion: JOB_IMPORT_SCHEMA_VERSION,
      payload,
      outputRules: {
        unknownWhenUnclear: true,
        doNotInventUnsupportedFacts: true,
        allowOnlyEnumeratedValues: true,
        keepReviewFlagsActionable: true,
      },
    },
    null,
    2
  );

  const parsed = await callOpenAiWithJsonSchema({
    apiKey: config.apiKey,
    model: config.model,
    schemaName: "job_import_enrichment_response",
    schema,
    systemPrompt,
    userPrompt,
  });

  return {
    ...parsed,
    model: config.model,
  };
}

async function callOpenAiWithJsonSchema(config) {
  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: config.systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: config.userPrompt }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: config.schemaName,
          schema: config.schema,
          strict: true,
        },
      },
    }),
  });

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    throw new Error(`OpenAI request failed: ${apiResponse.status} ${errorText}`);
  }

  const responseJson = await apiResponse.json();
  const outputText = extractOutputText(responseJson);
  return parseModelJson(outputText);
}

function createJobImportEnrichmentSchema() {
  const confidenceField = {
    type: "object",
    additionalProperties: false,
    properties: {
      score: { type: "number", minimum: 0, maximum: 1 },
      level: { type: "string", enum: JOB_IMPORT_ENUMS.confidenceLevel },
      evidence: {
        type: "array",
        items: { type: "string" },
      },
      source: { type: "string", enum: ["model"] },
    },
    required: ["score", "level", "evidence", "source"],
  };

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      schemaVersion: { type: "string", const: JOB_IMPORT_SCHEMA_VERSION },
      canonicalTitle: { type: "string" },
      roleTrack: { type: "string", enum: JOB_IMPORT_ENUMS.roleTrack },
      seniority: { type: "string", enum: JOB_IMPORT_ENUMS.seniority },
      industry: { type: "string", enum: JOB_IMPORT_ENUMS.industry },
      companyStage: { type: "string", enum: JOB_IMPORT_ENUMS.companyStage },
      companySizeBand: { type: "string", enum: JOB_IMPORT_ENUMS.companySizeBand },
      workplaceMode: { type: "string", enum: JOB_IMPORT_ENUMS.workplaceMode },
      fitScore: { type: "integer", enum: [1, 2, 3, 4, 5] },
      priorityBand: { type: "string", enum: JOB_IMPORT_ENUMS.priorityBand },
      nextBestAction: { type: "string", enum: JOB_IMPORT_ENUMS.nextBestAction },
      confidence: {
        type: "object",
        additionalProperties: false,
        properties: {
          overall: confidenceField,
          fields: {
            type: "object",
            additionalProperties: false,
            properties: {
              canonicalTitle: confidenceField,
              roleTrack: confidenceField,
              seniority: confidenceField,
              industry: confidenceField,
              companyStage: confidenceField,
              companySizeBand: confidenceField,
              workplaceMode: confidenceField,
              fitScore: confidenceField,
              priorityBand: confidenceField,
              nextBestAction: confidenceField,
            },
            required: [
              "canonicalTitle",
              "roleTrack",
              "seniority",
              "industry",
              "companyStage",
              "companySizeBand",
              "workplaceMode",
              "fitScore",
              "priorityBand",
              "nextBestAction",
            ],
          },
        },
        required: ["overall", "fields"],
      },
      reviewFlags: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            code: { type: "string", enum: JOB_IMPORT_ENUMS.reviewFlagCode },
            severity: { type: "string", enum: JOB_IMPORT_ENUMS.reviewSeverity },
            message: { type: "string" },
            fieldPath: { type: "string" },
          },
          required: ["code", "severity", "message", "fieldPath"],
        },
      },
    },
    required: [
      "schemaVersion",
      "canonicalTitle",
      "roleTrack",
      "seniority",
      "industry",
      "companyStage",
      "companySizeBand",
      "workplaceMode",
      "fitScore",
      "priorityBand",
      "nextBestAction",
      "confidence",
      "reviewFlags",
    ],
  };
}

function normalizeLines(value) {
  return String(value || "").replace(/\r\n/g, "\n").split("\n");
}

function normalizeWords(line) {
  return String(line || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function getChangedLineIndices(originalText, tailoredText) {
  const originalLines = normalizeLines(originalText);
  const tailoredLines = normalizeLines(tailoredText);
  const max = Math.max(originalLines.length, tailoredLines.length);
  const changed = [];

  for (let index = 0; index < max; index += 1) {
    const originalLine = (originalLines[index] || "").trim();
    const tailoredLine = (tailoredLines[index] || "").trim();
    if (originalLine !== tailoredLine) {
      changed.push(index);
    }
  }

  return changed;
}

function getChangedWordSpans(originalText, tailoredText, changedLineIndices) {
  const originalLines = normalizeLines(originalText);
  const tailoredLines = normalizeLines(tailoredText);

  return changedLineIndices.map((lineIndex) => {
    const originalWords = normalizeWords(originalLines[lineIndex] || "");
    const tailoredWords = normalizeWords(tailoredLines[lineIndex] || "");

    let prefix = 0;
    while (
      prefix < originalWords.length &&
      prefix < tailoredWords.length &&
      originalWords[prefix] === tailoredWords[prefix]
    ) {
      prefix += 1;
    }

    let originalSuffix = originalWords.length - 1;
    let tailoredSuffix = tailoredWords.length - 1;
    while (
      originalSuffix >= prefix &&
      tailoredSuffix >= prefix &&
      originalWords[originalSuffix] === tailoredWords[tailoredSuffix]
    ) {
      originalSuffix -= 1;
      tailoredSuffix -= 1;
    }

    const startWord = Math.min(prefix, tailoredWords.length);
    const endWord = Math.max(startWord, tailoredSuffix + 1);

    return {
      lineIndex,
      startWord,
      endWord,
    };
  });
}

function extractOutputText(responseJson) {
  if (typeof responseJson?.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text;
  }

  const outputs = Array.isArray(responseJson?.output) ? responseJson.output : [];
  for (const item of outputs) {
    const contentItems = Array.isArray(item?.content) ? item.content : [];
    for (const content of contentItems) {
      if (typeof content?.text === "string" && content.text.trim()) {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response did not include output text.");
}

function parseModelJson(value) {
  const trimmed = value.trim().replace(/^```json\s*/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return JSON.parse(trimmed);
}

function loadEnvFiles() {
  const files = [".env.server.local", ".env.server", ".env.local", ".env"];
  for (const file of files) {
    const fullPath = resolve(process.cwd(), file);
    if (!existsSync(fullPath)) continue;
    const content = readFileSync(fullPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}
