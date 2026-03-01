import { createBrowserRouter } from "react-router";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Dashboard,
  },
  {
    path: "/analytics",
    Component: Analytics,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);