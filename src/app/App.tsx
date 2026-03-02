import { RouterProvider } from "react-router";
import { AppProvider } from "./context";
import { router } from "./routes";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </AppErrorBoundary>
  );
}
