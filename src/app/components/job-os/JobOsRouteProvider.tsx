import { Outlet } from "react-router";
import { useApp } from "../../context";
import { JobOsContext } from "../../context/JobOsContext";
import { useJobOs } from "../../hooks/useJobOs";

export function JobOsRouteProvider() {
  const { session } = useApp();
  const jobOsData = useJobOs(session?.userId ?? null);

  return (
    <JobOsContext.Provider value={jobOsData}>
      <Outlet />
    </JobOsContext.Provider>
  );
}
