export const STRATEGIC_RESET_ARCHIVE_REASON = "Strategic reset";

export interface ArchiveMetadata {
  archived?: boolean;
  archivedAt?: string;
  archivedReason?: string;
}

export function isArchived<T extends ArchiveMetadata>(item: T): boolean {
  return item.archived === true;
}

export function isActiveArchiveRecord<T extends ArchiveMetadata>(item: T): boolean {
  return !isArchived(item);
}

export function buildArchiveUpdates(reason = STRATEGIC_RESET_ARCHIVE_REASON): Required<ArchiveMetadata> {
  return {
    archived: true,
    archivedAt: new Date().toISOString(),
    archivedReason: reason,
  };
}

export function buildRestoreUpdates(): {
  archived: false;
  archivedAt: undefined;
  archivedReason: undefined;
} {
  return {
    archived: false,
    archivedAt: undefined,
    archivedReason: undefined,
  };
}
