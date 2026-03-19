import { Flame } from "lucide-react";
import type { HotOpportunity } from "../../services/execution/nextActionEngine";
import { OpportunityCard } from "./OpportunityCard";

interface HotOpportunitiesProps {
  opportunities: HotOpportunity[];
  isLoading?: boolean;
}

export function HotOpportunities({ opportunities, isLoading }: HotOpportunitiesProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-orange-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
          Hot Opportunities
        </h2>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800"
            />
          ))}
        </div>
      )}

      {!isLoading && opportunities.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800 p-4 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No unapplied roles yet. Add roles via Companies.
          </p>
        </div>
      )}

      {!isLoading && opportunities.length > 0 && (
        <div className="space-y-2">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.roleId} opportunity={opp} />
          ))}
        </div>
      )}
    </section>
  );
}
