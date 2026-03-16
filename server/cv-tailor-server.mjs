import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_PORT = 8787;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const MAX_BODY_BYTES = 2 * 1024 * 1024;

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
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userPrompt }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "cv_tailoring_response",
          schema,
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
  const parsed = parseModelJson(outputText);
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
