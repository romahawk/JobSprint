import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import mammoth from "mammoth/mammoth.browser";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface CvImportResult {
  text: string;
  sourceLabel: string;
}

function normalizeExtractedText(value: string): string {
  return value.replace(/\u0000/g, " ").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
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

  const text = normalizeExtractedText(await response.text());
  if (!text) {
    throw new Error("The linked Google Doc returned no readable text.");
  }

  return {
    text,
    sourceLabel: "Google Doc export",
  };
}

async function extractTextFromPdf(file: File): Promise<CvImportResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  const text = normalizeExtractedText(pages.join("\n\n"));
  if (!text) {
    throw new Error("No readable text could be extracted from this PDF.");
  }

  return {
    text,
    sourceLabel: "PDF upload",
  };
}

async function extractTextFromDocx(file: File): Promise<CvImportResult> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = normalizeExtractedText(result.value);
  if (!text) {
    throw new Error("No readable text could be extracted from this DOCX file.");
  }

  return {
    text,
    sourceLabel: "DOCX upload",
  };
}

async function extractTextFromPlainText(file: File): Promise<CvImportResult> {
  const text = normalizeExtractedText(await file.text());
  if (!text) {
    throw new Error("The uploaded text file is empty.");
  }

  return {
    text,
    sourceLabel: "Text upload",
  };
}

export async function extractTextFromCvFile(file: File): Promise<CvImportResult> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".docx")) {
    return extractTextFromDocx(file);
  }
  if (name.endsWith(".pdf")) {
    return extractTextFromPdf(file);
  }
  if (name.endsWith(".txt") || file.type.startsWith("text/")) {
    return extractTextFromPlainText(file);
  }

  throw new Error("Unsupported file type. Upload a .docx, .pdf, or .txt CV.");
}
