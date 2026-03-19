interface DuplicateMatchAlertProps {
  existingCompanyName: string;
  selectedAction: "update" | "create_new";
  onUpdateExisting: () => void;
  onCreateNew: () => void;
}

export function DuplicateMatchAlert({
  existingCompanyName,
  selectedAction,
  onUpdateExisting,
  onCreateNew,
}: DuplicateMatchAlertProps) {
  const baseBtn =
    "text-xs px-3 py-1.5 rounded border transition-colors";
  const activeBtn =
    "bg-yellow-700 text-white border-yellow-700 dark:bg-yellow-600 dark:border-yellow-600";
  const inactiveBtn =
    "border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30";

  return (
    <div className="rounded border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-950/30 px-3 py-3 space-y-2">
      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
        Possible duplicate: &ldquo;{existingCompanyName}&rdquo; already exists.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onUpdateExisting}
          className={`${baseBtn} ${selectedAction === "update" ? activeBtn : inactiveBtn}`}
        >
          Update existing (recommended)
        </button>
        <button
          type="button"
          onClick={onCreateNew}
          className={`${baseBtn} ${selectedAction === "create_new" ? activeBtn : inactiveBtn}`}
        >
          Create new anyway
        </button>
      </div>
    </div>
  );
}
