import type { CvImportResult } from "./cvFileImportService";

export function normalizeExtractedText(value: string): string {
  return value
    .split(String.fromCharCode(0))
    .join(" ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function toImportResult(
  text: string,
  sourceLabel: string,
  emptyMessage: string
): CvImportResult {
  const normalized = normalizeExtractedText(text);
  if (!normalized) {
    throw new Error(emptyMessage);
  }

  return {
    text: normalized,
    sourceLabel,
  };
}
