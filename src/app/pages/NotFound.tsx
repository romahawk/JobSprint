import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          404
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Page not found
        </p>
        <Link to="/">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
