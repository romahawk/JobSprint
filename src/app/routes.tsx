import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import LandingPage from "../marketing/LandingPage";
import SignIn from "./pages/SignIn";
import { JobOsRouteProvider } from "./components/job-os/JobOsRouteProvider";
import JobOsSettingsPage from "./pages/job-os/JobOsSettingsPage";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { appPath } from "./routing";

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
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/signin",
    element: <SignIn />,
  },
  {
    path: "/app",
    Component: ProtectedRoute,
    children: [
      {
        index: true,
        element: lazyElement(<DashboardPage />),
      },
      {
        path: "overview",
        element: <Navigate to="/app" replace />,
      },
      {
        path: "analytics",
        element: lazyElement(<Analytics />),
      },
      {
        path: "compliance/afa",
        element: lazyElement(<AfaCompliancePage />),
      },
      {
        Component: JobOsRouteProvider,
        children: [
          {
            path: "job-os",
            element: lazyElement(<JobOsApplicationsPage />),
          },
          {
            path: "job-os/assets",
            element: lazyElement(<JobOsAssetsPage />),
          },
          {
            path: "job-os/companies",
            element: lazyElement(<JobOsCompaniesPage />),
          },
          {
            path: "job-os/roles",
            element: lazyElement(<JobOsRolesPage />),
          },
          {
            path: "job-os/applications",
            element: lazyElement(<JobOsApplicationsPage />),
          },
          {
            path: "job-os/outreach",
            element: lazyElement(<JobOsOutreachPage />),
          },
          {
            path: "job-os/settings",
            element: lazyElement(<JobOsSettingsPage />),
          },
        ],
      },
      {
        path: "cv-optimizer",
        element: lazyElement(<CvOptimizerPage />),
      },
    ],
  },
  {
    path: "/overview",
    element: <Navigate to="/app" replace />,
  },
  {
    path: "/analytics",
    element: <Navigate to={appPath("/analytics")} replace />,
  },
  {
    path: "/compliance/afa",
    element: <Navigate to={appPath("/compliance/afa")} replace />,
  },
  {
    path: "/cv-optimizer",
    element: <Navigate to={appPath("/cv-optimizer")} replace />,
  },
  {
    path: "/job-os",
    element: <Navigate to={appPath("/job-os")} replace />,
  },
  {
    path: "/job-os/assets",
    element: <Navigate to={appPath("/job-os/assets")} replace />,
  },
  {
    path: "/job-os/companies",
    element: <Navigate to={appPath("/job-os/companies")} replace />,
  },
  {
    path: "/job-os/roles",
    element: <Navigate to={appPath("/job-os/roles")} replace />,
  },
  {
    path: "/job-os/applications",
    element: <Navigate to={appPath("/job-os/applications")} replace />,
  },
  {
    path: "/job-os/outreach",
    element: <Navigate to={appPath("/job-os/outreach")} replace />,
  },
  {
    path: "/job-os/settings",
    element: <Navigate to={appPath("/job-os/settings")} replace />,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
