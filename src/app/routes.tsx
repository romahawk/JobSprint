import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import { ProtectedRoute } from "./components/ProtectedRoute";

const AfaCompliancePage = lazy(() => import("./pages/AfaCompliancePage"));

function AfaComplianceFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen text-neutral-400 dark:text-neutral-600 text-sm">
      Loading session…
    </div>
  );
}

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
        element: (
          <Suspense fallback={<AfaComplianceFallback />}>
            <AfaCompliancePage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
