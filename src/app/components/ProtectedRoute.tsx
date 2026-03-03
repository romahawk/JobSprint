import { Navigate, Outlet } from "react-router";
import { useApp } from "../context";

export function ProtectedRoute() {
  const { session, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100">
        <div className="text-sm text-neutral-500 dark:text-neutral-400">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
}

