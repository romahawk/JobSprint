interface ImportConfidenceBadgeProps {
  confidence: number; // 0–1
  platform: string;
}

export function ImportConfidenceBadge({
  confidence,
  platform,
}: ImportConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);

  let colorClass: string;
  if (pct >= 75) {
    colorClass =
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  } else if (pct >= 50) {
    colorClass =
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  } else {
    colorClass =
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-neutral-500">
        Source:{" "}
        <span className="capitalize font-medium text-foreground">
          {platform}
        </span>
      </span>
      <span className={`px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
        {pct}% confidence
      </span>
    </div>
  );
}
