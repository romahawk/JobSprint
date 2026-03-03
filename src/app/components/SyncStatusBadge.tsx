import { Loader2, RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";
import { useApp } from "../context";

export function SyncStatusBadge() {
  const { syncState, refreshData } = useApp();

  const lastSyncedLabel = syncState.lastSyncedAt
    ? new Date(syncState.lastSyncedAt).toLocaleTimeString()
    : "never";

  return (
    <div className="flex items-center gap-2">
      <div className="hidden md:block text-xs text-neutral-500 dark:text-neutral-400">
        <span className="font-medium uppercase mr-1">{syncState.storageMode}</span>
        <span>Sync: {syncState.isSyncing ? "in progress" : "ok"}</span>
        <span className="mx-1">|</span>
        <span>Last: {lastSyncedLabel}</span>
        {syncState.error && (
          <>
            <span className="mx-1">|</span>
            <span className="text-red-600 dark:text-red-400">{syncState.error}</span>
          </>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          void refreshData();
        }}
        className="gap-2"
      >
        {syncState.isSyncing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCcw className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">Refresh</span>
      </Button>
    </div>
  );
}

