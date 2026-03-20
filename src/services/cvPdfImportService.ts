import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { toImportResult } from "./cvImportShared";
import type { CvImportResult } from "./cvFileImportService";

let pdfJsPromise: Promise<typeof import("pdfjs-dist/build/pdf.mjs")> | null = null;

async function loadPdfJs() {
  pdfJsPromise ??= import("pdfjs-dist/build/pdf.min.mjs").then((module) => {
    const pdfjs = module as typeof import("pdfjs-dist/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    return pdfjs;
  });

  return pdfJsPromise;
}

export async function extractTextFromPdf(file: File): Promise<CvImportResult> {
  const pdfjsLib = await loadPdfJs();
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

  return toImportResult(
    pages.join("\n\n"),
    "PDF upload",
    "No readable text could be extracted from this PDF."
  );
}
