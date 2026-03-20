import { normalizeExtractedText, toImportResult } from "./cvImportShared";

export interface CvImportResult {
  text: string;
  sourceLabel: string;
}

export function buildGoogleDocTextExportUrl(value: string): string | null {
  const match = value.match(/docs\.google\.com\/document\/d\/([^/]+)/i);
  if (!match) return null;
  return `https://docs.google.com/document/d/${match[1]}/export?format=txt`;
}

export async function importGoogleDocText(fileUrl: string): Promise<CvImportResult> {
  const exportUrl = buildGoogleDocTextExportUrl(fileUrl);
  if (!exportUrl) {
    throw new Error("Google Docs text import requires a docs.google.com/document link.");
  }

  const response = await fetch(exportUrl, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Import failed (${response.status})`);
  }

  return toImportResult(
    await response.text(),
    "Google Doc export",
    "The linked Google Doc returned no readable text."
  );
}

async function extractTextFromPlainText(file: File): Promise<CvImportResult> {
  return toImportResult(
    await file.text(),
    "Text upload",
    "The uploaded text file is empty."
  );
}

export async function extractTextFromCvFile(file: File): Promise<CvImportResult> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".docx")) {
    const { extractTextFromDocx } = await import("./cvDocxImportService");
    return extractTextFromDocx(file);
  }

  if (name.endsWith(".pdf")) {
    const { extractTextFromPdf } = await import("./cvPdfImportService");
    return extractTextFromPdf(file);
  }

  if (name.endsWith(".txt") || file.type.startsWith("text/")) {
    return extractTextFromPlainText(file);
  }

  throw new Error("Unsupported file type. Upload a .docx, .pdf, or .txt CV.");
}

export { normalizeExtractedText };
