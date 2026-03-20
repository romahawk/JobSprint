import { toImportResult } from "./cvImportShared";
import type { CvImportResult } from "./cvFileImportService";

type MammothBrowserModule = {
  extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
};

let mammothPromise: Promise<MammothBrowserModule> | null = null;

async function loadMammoth() {
  mammothPromise ??= import("mammoth/mammoth.browser.min.js").then(
    (module) => module as MammothBrowserModule
  );
  return mammothPromise;
}

export async function extractTextFromDocx(file: File): Promise<CvImportResult> {
  const mammoth = await loadMammoth();
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });

  return toImportResult(
    result.value,
    "DOCX upload",
    "No readable text could be extracted from this DOCX file."
  );
}
