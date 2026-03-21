import React, { useRef, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import type { ImportResult } from "../services/jobImportOrchestrator";
import { importJobFromUrl } from "../services/jobImportOrchestrator";
import { useApp } from "../context";

interface Props {
  onImportComplete: (result: ImportResult) => void;
}

function isLinkedInUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes("linkedin.com");
  } catch {
    return false;
  }
}

export function PasteJobUrlPanel({ onImportComplete }: Props) {
  const { userProfileSignals } = useApp();
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const needsPastedText = isLinkedInUrl(url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const result = await importJobFromUrl(
        url.trim(),
        needsPastedText ? pastedText : undefined,
        userProfileSignals ?? undefined
      );
      onImportComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="job-url"
          className="block text-sm font-medium text-foreground"
        >
          Job posting URL
        </label>
        <Input
          id="job-url"
          ref={inputRef}
          type="url"
          placeholder="https://boards.greenhouse.io/company/jobs/…"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          disabled={loading}
          autoFocus
          className="h-11 text-base"
        />
      </div>

      {needsPastedText && (
        <div className="space-y-2">
          <label
            htmlFor="pasted-text"
            className="block text-sm font-medium text-foreground"
          >
            Paste job description{" "}
            <span className="text-muted-foreground font-normal">
              (required for LinkedIn)
            </span>
          </label>
          <Textarea
            id="pasted-text"
            placeholder="Copy the full job description from LinkedIn and paste it here…"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            disabled={loading}
            className="min-h-32"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading || !url.trim()}
        className="w-full h-11"
      >
        {loading ? "Importing…" : "Import job"}
      </Button>
    </form>
  );
}
