import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import JobOsSettingsPage from "./pages/job-os/JobOsSettingsPage";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const DashboardPage = lazy(() =>
  import("./pages/dashboard/DashboardPage").then((module) => ({ default: module.DashboardPage }))
);
const Analytics = lazy(() => import("./pages/Analytics"));
const JobOsAssetsPage = lazy(() => import("./pages/job-os/JobOsAssetsPage"));
const JobOsCompaniesPage = lazy(() => import("./pages/job-os/JobOsCompaniesPage"));
const JobOsRolesPage = lazy(() => import("./pages/job-os/JobOsRolesPage"));
const JobOsApplicationsPage = lazy(() => import("./pages/job-os/JobOsApplicationsPage"));
const JobOsOutreachPage = lazy(() => import("./pages/job-os/JobOsOutreachPage"));
const CvOptimizerPage = lazy(() => import("../features/cvOptimizer/CvOptimizerPage"));
const SignIn = lazy(() => import("./pages/SignIn"));
const AfaCompliancePage = lazy(() => import("./pages/AfaCompliancePage"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-neutral-400 dark:text-neutral-600">
      Loading session...
    </div>
  );
}

function lazyElement(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/signin",
    element: lazyElement(<SignIn />),
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        element: lazyElement(<DashboardPage />),
      },
      {
        path: "/overview",
        element: <Navigate to="/" replace />,
      },
      {
        path: "/analytics",
        element: lazyElement(<Analytics />),
      },
      {
        path: "/compliance/afa",
        element: lazyElement(<AfaCompliancePage />),
      },
      {
        path: "/job-os",
        element: lazyElement(<JobOsApplicationsPage />),
      },
      {
        path: "/job-os/assets",
        element: lazyElement(<JobOsAssetsPage />),
      },
      {
        path: "/job-os/companies",
        element: lazyElement(<JobOsCompaniesPage />),
      },
      {
        path: "/job-os/roles",
        element: lazyElement(<JobOsRolesPage />),
      },
      {
        path: "/job-os/applications",
        element: lazyElement(<JobOsApplicationsPage />),
      },
      {
        path: "/job-os/outreach",
        element: lazyElement(<JobOsOutreachPage />),
      },
      {
        path: "/cv-optimizer",
        element: lazyElement(<CvOptimizerPage />),
      },
      {
        path: "/job-os/settings",
        Component: JobOsSettingsPage,
      },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
