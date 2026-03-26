import type { ReactNode } from "react";
import { cn } from "../ui/utils";

interface AppPageShellProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  scrollContent?: boolean;
}

export function AppPageShell({
  title,
  subtitle,
  actions,
  toolbar,
  children,
  className,
  headerClassName,
  contentClassName,
  scrollContent = false,
}: AppPageShellProps) {
  const showHeader = title || subtitle || actions;

  return (
    <section className={cn("min-w-0 space-y-5", className)}>
      {showHeader ? (
        <header
          className={cn(
            "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
            headerClassName
          )}
        >
          <div className="min-w-0 space-y-1">
            {title ? (
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}

      {toolbar ? <div className="flex min-w-0 flex-col gap-3">{toolbar}</div> : null}

      <div
        className={cn(
          "min-w-0",
          scrollContent && "min-h-0 overflow-auto",
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
