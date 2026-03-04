import { createBrowserRouter } from "react-router";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import AfaCompliancePage from "./pages/AfaCompliancePage";
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
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
