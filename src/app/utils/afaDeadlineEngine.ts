import { differenceInCalendarDays } from "date-fns";
import type { AfaDeadlineStatus, AfaVorschlag } from "../types/afa";

export function computeDeadline(deadline_date: string | null): {
  deadline_status: AfaDeadlineStatus;
  days_left: number | null;
} {
  if (!deadline_date) return { deadline_status: "NO_DEADLINE", days_left: null };

  const days = differenceInCalendarDays(new Date(deadline_date), new Date());

  if (days < 0) return { deadline_status: "OVERDUE", days_left: days };
  if (days <= 2) return { deadline_status: "URGENT", days_left: days };
  if (days <= 5) return { deadline_status: "UPCOMING", days_left: days };
  return { deadline_status: "SAFE", days_left: days };
}

export function recomputeDeadline(v: AfaVorschlag): AfaVorschlag {
  const { deadline_status, days_left } = computeDeadline(v.deadline_date);
  return { ...v, computed: { ...v.computed, deadline_status, days_left } };
}

/** Apply both risk and deadline recomputation. */
export function recomputeAll(v: AfaVorschlag): AfaVorschlag {
  const { deadline_status, days_left } = computeDeadline(v.deadline_date);
  return { ...v, computed: { ...v.computed, deadline_status, days_left } };
}
