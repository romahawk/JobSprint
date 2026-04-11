import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
      <span>
        {from}–{to} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
