import { createContext, useContext } from "react";
import type { UseJobOsReturn } from "../hooks/useJobOs";

export const JobOsContext = createContext<UseJobOsReturn | null>(null);

export function useJobOsContext(): UseJobOsReturn {
  const ctx = useContext(JobOsContext);
  if (!ctx) throw new Error("useJobOsContext must be used inside JobOsLayout");
  return ctx;
}
