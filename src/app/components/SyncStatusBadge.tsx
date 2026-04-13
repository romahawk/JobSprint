import { CheckCircle2, CloudOff, Loader2, WifiOff } from "lucide-react";
import { useJobOsSyncSnapshot } from "../services/jobOsSync";

type SyncStatus = "synced" | "pending" | "local-only" | "error";

function getSyncStatus(
  pendingWrites: number,
  storageMode: "firebase" | "local",
  syncNotice: string | null
): SyncStatus {
  if (syncNotice) return "error";
  if (storageMode === "local") return "local-only";
  if (pendingWrites > 0) return "pending";
  return "synced";
}

const STATUS_CONFIG: Record<
  SyncStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  synced: {
    label: "Synced",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: "text-emerald-400 dark:text-emerald-500",
  },
  pending: {
    label: "Saving…",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    className: "text-amber-400 dark:text-amber-500",
  },
  "local-only": {
    label: "Local only",
    icon: <WifiOff className="h-3.5 w-3.5" />,
    className: "text-neutral-400 dark:text-neutral-500",
  },
  error: {
    label: "Sync error",
    icon: <CloudOff className="h-3.5 w-3.5" />,
    className: "text-red-400 dark:text-red-500",
  },
};

export function SyncStatusBadge() {
  const { pendingWrites, storageMode, syncNotice, lastSyncedAt } =
    useJobOsSyncSnapshot();

  const status = getSyncStatus(pendingWrites, storageMode, syncNotice);
  const { label, icon, className } = STATUS_CONFIG[status];

  const lastSyncedLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${className}`}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {status === "synced" && lastSyncedLabel && (
        <span className="hidden lg:inline text-neutral-500 dark:text-neutral-500 font-normal">
          · {lastSyncedLabel}
        </span>
      )}
      {status === "pending" && pendingWrites > 1 && (
        <span className="hidden lg:inline font-normal opacity-70">
          ({pendingWrites})
        </span>
      )}
      {status === "error" && syncNotice && (
        <span
          className="hidden lg:inline font-normal opacity-70 max-w-[160px] truncate"
          title={syncNotice}
        >
          · {syncNotice}
        </span>
      )}
    </div>
  );
}
