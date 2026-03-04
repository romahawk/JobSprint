export type AfaSource = "paper" | "portal" | "email";
export type AfaRfbPresent = "yes" | "no" | "unknown";
export type AfaPortalFeedbackRequired = "yes" | "no" | "unknown";
export type AfaMatchLevel = "high" | "medium" | "low";

export type AfaActionStatus =
  | "received"
  | "reviewing"
  | "applied"
  | "feedback_submitted"
  | "closed"
  | "justified_non_application";

export type AfaEmployerResponse =
  | "pending"
  | "rejected"
  | "interview"
  | "offer"
  | "hired"
  | "no_response";

export type AfaRiskStatus = "HIGH" | "MEDIUM" | "SAFE" | "LOW" | "CHECK";

export type AfaDeadlineStatus =
  | "OVERDUE"
  | "URGENT"
  | "UPCOMING"
  | "SAFE"
  | "NO_DEADLINE";

export interface AfaEvidence {
  folder_url: string;
  letter_file_url: string;
  application_proof_url: string;
  portal_feedback_proof_url: string;
}

export interface AfaComputed {
  risk_status: AfaRiskStatus;
  days_left: number | null;
  deadline_status: AfaDeadlineStatus;
}

export interface AfaVorschlag {
  id: string;
  case_id: string;
  source: AfaSource;
  received_date: string; // ISO date YYYY-MM-DD
  deadline_date: string | null; // ISO date YYYY-MM-DD
  rfb_present: AfaRfbPresent;
  portal_feedback_required: AfaPortalFeedbackRequired;
  employer_name: string;
  position_title: string;
  location: string;
  posting_url: string;
  match_level: AfaMatchLevel;
  action_status: AfaActionStatus;
  applied_date: string | null; // ISO date YYYY-MM-DD
  portal_feedback_date: string | null; // ISO date YYYY-MM-DD
  employer_response: AfaEmployerResponse;
  evidence: AfaEvidence;
  notes: string;
  computed: AfaComputed;
  audit: {
    created_at: string; // ISO datetime
    updated_at: string; // ISO datetime
  };
}

export type AfaVorschlagFormData = Omit<
  AfaVorschlag,
  "id" | "case_id" | "computed" | "audit"
>;
