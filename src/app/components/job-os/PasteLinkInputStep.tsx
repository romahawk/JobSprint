import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import type { ImportMode } from "../../services/ingestion/types";

interface PasteLinkInputStepProps {
  isAnalyzing: boolean;
  error: string | null;
  onAnalyze: (url: string, pastedText: string, mode: ImportMode) => void;
  onCancel: () => void;
}

export function PasteLinkInputStep({
  isAnalyzing,
  error,
  onAnalyze,
  onCancel,
}: PasteLinkInputStepProps) {
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [mode, setMode] = useState<ImportMode>("company_and_role");

  function handleSubmit() {
    const trimmed = url.trim();
    if (!trimmed) return;
    onAnalyze(trimmed, pastedText.trim(), mode);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="paste-link-url">Job or Company URL</Label>
        <Input
          id="paste-link-url"
          placeholder="https://boards.greenhouse.io/acme/jobs/12345"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          disabled={isAnalyzing}
          autoFocus
        />
        <p className="text-xs text-neutral-500">
          Supports Greenhouse, Lever, Ashby, Himalayas, and generic career
          pages.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Import Mode</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="paste-link-mode"
              value="company_only"
              checked={mode === "company_only"}
              onChange={() => setMode("company_only")}
              className="accent-primary"
              disabled={isAnalyzing}
            />
            Company only
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="paste-link-mode"
              value="company_and_role"
              checked={mode === "company_and_role"}
              onChange={() => setMode("company_and_role")}
              className="accent-primary"
              disabled={isAnalyzing}
            />
            Company + Role
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paste-link-text">
          Job Description Text{" "}
          <span className="text-neutral-400 font-normal">
            (optional — helps when URL is blocked)
          </span>
        </Label>
        <Textarea
          id="paste-link-text"
          placeholder="Paste the full job description here for richer extraction..."
          rows={5}
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          disabled={isAnalyzing}
        />
        <p className="text-xs text-neutral-500">
          Required for LinkedIn — LinkedIn blocks direct URL fetching.
        </p>
      </div>

      {error && (
        <div className="rounded border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="outline" onClick={onCancel} disabled={isAnalyzing}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!url.trim() || isAnalyzing}
        >
          {isAnalyzing ? "Analyzing…" : "Analyze"}
        </Button>
      </div>
    </div>
  );
}
