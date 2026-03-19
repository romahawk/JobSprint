import { RouterProvider } from "react-router";
import { AppProvider } from "./context";
import { router } from "./routes";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </AppProvider>
    </AppErrorBoundary>
  );
}
