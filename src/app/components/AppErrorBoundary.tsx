import { Component, type ReactNode } from "react";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("Unhandled app error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-950 p-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-semibold">Something went wrong</h1>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            A runtime error interrupted this screen. You can reload the app or
            return to the dashboard.
          </p>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/";
              }}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

