import { createBrowserRouter } from "react-router";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import AfaCompliancePage from "./pages/AfaCompliancePage";
import JobOsAssetsPage from "./pages/job-os/JobOsAssetsPage";
import JobOsCompaniesPage from "./pages/job-os/JobOsCompaniesPage";
import JobOsRolesPage from "./pages/job-os/JobOsRolesPage";
import JobOsApplicationsPage from "./pages/job-os/JobOsApplicationsPage";
import JobOsOutreachPage from "./pages/job-os/JobOsOutreachPage";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/signin",
    Component: SignIn,
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: Dashboard,
      },
      {
        path: "/analytics",
        Component: Analytics,
      },
      {
        path: "/compliance/afa",
        Component: AfaCompliancePage,
      },
      {
        path: "/job-os",
        Component: JobOsApplicationsPage,
      },
      {
        path: "/job-os/dashboard",
        Component: JobOsApplicationsPage,
      },
      {
        path: "/job-os/assets",
        Component: JobOsAssetsPage,
      },
      {
        path: "/job-os/companies",
        Component: JobOsCompaniesPage,
      },
      {
        path: "/job-os/roles",
        Component: JobOsRolesPage,
      },
      {
        path: "/job-os/applications",
        Component: JobOsApplicationsPage,
      },
      {
        path: "/job-os/outreach",
        Component: JobOsOutreachPage,
      },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
