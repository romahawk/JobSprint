import { useCallback, useMemo, useState } from "react";

export interface UsePaginationReturn<T> {
  page: number;
  totalPages: number;
  pageItems: T[];
  setPage: (page: number) => void;
  resetPage: () => void;
}

export function usePagination<T>(
  items: T[],
  pageSize = 10
): UsePaginationReturn<T> {
  const [page, setPageRaw] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Clamp page if items shrink
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  const setPage = useCallback(
    (next: number) => {
      setPageRaw(Math.max(1, Math.min(next, totalPages)));
    },
    [totalPages]
  );

  const resetPage = useCallback(() => {
    setPageRaw(1);
  }, []);

  return { page: safePage, totalPages, pageItems, setPage, resetPage };
}
