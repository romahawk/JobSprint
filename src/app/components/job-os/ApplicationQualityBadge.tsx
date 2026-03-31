import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import type { CvTailoringRun, JobOsApplication } from "../../types/jobOs";

type QualityLevel = "strong" | "partial" | "generic";

interface QualityInfo {
  level: QualityLevel;
  label: string;
  fitScore: number | null;
  tailoredAt: string | null;
}

export function getApplicationQuality(
  application: JobOsApplication,
  cvTailoringRuns: CvTailoringRun[]
): QualityInfo {
  const run = application.latestCvTailoringRunId
    ? cvTailoringRuns.find((r) => r.id === application.latestCvTailoringRunId)
    : null;

  if (!run || run.fitScore == null) {
    return { level: "generic", label: "Generic", fitScore: null, tailoredAt: null };
  }

  const level: QualityLevel = run.fitScore >= 4 ? "strong" : run.fitScore >= 2 ? "partial" : "generic";
  return {
    level,
    label: level === "strong" ? "Strong" : level === "partial" ? "Partial" : "Generic",
    fitScore: run.fitScore,
    tailoredAt: run.createdAt,
  };
}

const LEVEL_CLASSES: Record<QualityLevel, string> = {
  strong: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  partial: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  generic: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700",
};

interface ApplicationQualityBadgeProps {
  application: JobOsApplication;
  cvTailoringRuns: CvTailoringRun[];
}

export function ApplicationQualityBadge({
  application,
  cvTailoringRuns,
}: ApplicationQualityBadgeProps) {
  const { level, label, fitScore, tailoredAt } = getApplicationQuality(
    application,
    cvTailoringRuns
  );

  const tooltipText =
    fitScore != null && tailoredAt
      ? `Fit score: ${fitScore}/5 · Tailored ${new Date(tailoredAt).toLocaleDateString()}`
      : "No CV tailoring run linked";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${LEVEL_CLASSES[level]}`}
        >
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltipText}</TooltipContent>
    </Tooltip>
  );
}
