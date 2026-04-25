import { Outlet } from "react-router";
import { useApp } from "../../context";
import { JobOsContext } from "../../context/JobOsContext";
import { useJobOs } from "../../hooks/useJobOs";

const DEFAULT_AFA_REPORT_USER_ID = "JeUm6rAA1XOZrfqHtFPPXCtXpZ2";

const PUBLIC_AFA_REPORT_USER_ID = (
  import.meta.env.VITE_PUBLIC_AFA_REPORT_USER_ID || ""
).trim() || DEFAULT_AFA_REPORT_USER_ID;

export function PublicJobOsReportProvider() {
  const { session } = useApp();
  const reportUserId = session?.userId ?? (PUBLIC_AFA_REPORT_USER_ID || null);
  const jobOsData = useJobOs(reportUserId);

  return (
    <JobOsContext.Provider value={jobOsData}>
      <Outlet />
    </JobOsContext.Provider>
  );
}
