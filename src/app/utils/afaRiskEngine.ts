import type { AfaRfbPresent, AfaRiskStatus, AfaVorschlag } from "../types/afa";

export function computeRiskStatus(
  rfb_present: AfaRfbPresent,
  applied_date: string | null,
  portal_feedback_date: string | null
): AfaRiskStatus {
  if (rfb_present === "yes" && !applied_date) return "HIGH";
  if (rfb_present === "yes" && applied_date && !portal_feedback_date)
    return "MEDIUM";
  if (rfb_present === "yes" && applied_date && portal_feedback_date)
    return "SAFE";
  if (rfb_present === "no") return "LOW";
  return "CHECK";
}

export function recomputeVorschlag(v: AfaVorschlag): AfaVorschlag {
  const risk_status = computeRiskStatus(
    v.rfb_present,
    v.applied_date,
    v.portal_feedback_date
  );
  return { ...v, computed: { ...v.computed, risk_status } };
}
