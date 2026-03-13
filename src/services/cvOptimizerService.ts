import type {
  CvProfile,
  CvTailoringMode,
  JobDescription,
  JobOsApplication,
  JobOsCompany,
  JobOsRole,
} from "../app/types/jobOs";

export interface PortfolioProject {
  id: string;
  name: string;
  themes: string[];
  summary: string;
  bullets: string[];
}

export interface FitAnalysisResult {
  fitScore: number;
  strengths: string[];
  gaps: string[];
  keywords: string[];
  recruiterRisks: string[];
  recommendedPositioning: string;
  portfolioRecommendations: string[];
}

export interface QuickTailorResult {
  headline: string;
  summary: string;
  rewrittenBullets: string[];
  portfolioRecommendations: string[];
}

export interface FullTailorResult extends QuickTailorResult {
  fullCvText: string;
}

export interface CvOptimizerContext {
  application?: JobOsApplication | null;
  role?: JobOsRole | null;
  company?: JobOsCompany | null;
  jobDescription?: JobDescription | null;
}

const KEYWORD_LIBRARY = [
  "product management",
  "product owner",
  "product operations",
  "technical program management",
  "stakeholder management",
  "cross-functional",
  "roadmap",
  "product discovery",
  "requirements",
  "implementation",
  "solutions",
  "onboarding",
  "workflow",
  "operations",
  "process improvement",
  "healthtech",
  "digital health",
  "clinical",
  "hospital",
  "fintech",
  "trading",
  "risk",
  "analytics",
  "delivery",
  "program management",
  "customer success",
  "integration",
  "enablement",
  "data-driven",
  "metrics",
];

export const CV_OPTIMIZER_PROMPTS: Record<CvTailoringMode, string> = {
  analysis: [
    "You are a CV fit analyst.",
    "Compare the provided base CV with the job description.",
    "Maintain factual integrity. Do not invent experience, employers, metrics, technologies, or industries.",
    "Return strict JSON with keys: fitScore, strengths, gaps, keywords, recruiterRisks, recommendedPositioning.",
  ].join(" "),
  quickTailor: [
    "You are tailoring a CV for a fast application workflow.",
    "Use only facts already present in the base CV and approved portfolio projects.",
    "Return strict JSON with keys: headline, summary, rewrittenBullets.",
  ].join(" "),
  fullTailor: [
    "You are generating a full structured CV draft.",
    "Preserve factual integrity and only rephrase or reorder existing material.",
    "Return strict JSON with key: fullCvText.",
  ].join(" "),
};

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: "livesurgery",
    name: "LiveSurgery",
    themes: ["health", "hospital", "clinical", "medtech", "digital health"],
    summary: "Healthcare collaboration system for clinical coordination.",
    bullets: [
      "Built LiveSurgery, a healthcare collaboration system centered on clinical coordination and shared workflows.",
      "Position LiveSurgery as evidence of working on health-focused product delivery with multiple stakeholders.",
    ],
  },
  {
    id: "alpharhythm",
    name: "AlphaRhythm",
    themes: ["trading", "fintech", "crypto", "risk", "markets"],
    summary: "Trading discipline system focused on execution discipline and risk visibility.",
    bullets: [
      "Built AlphaRhythm, a trading discipline system focused on risk visibility and decision support.",
      "Use AlphaRhythm to demonstrate fintech-adjacent product thinking, workflow design, and execution rigor.",
    ],
  },
  {
    id: "flowlogix",
    name: "FlowLogix",
    themes: ["operations", "workflow", "process", "implementation"],
    summary: "Operations workflow system for process orchestration and team coordination.",
    bullets: [
      "Built FlowLogix, an operations workflow system designed to improve process orchestration and handoff clarity.",
      "Highlight FlowLogix for roles that value operational design, implementation planning, and scalable workflows.",
    ],
  },
  {
    id: "supply-tracker",
    name: "Supply Tracker",
    themes: ["logistics", "workflow", "operations", "dashboard", "supply"],
    summary: "Logistics dashboard for shipment visibility and operational monitoring.",
    bullets: [
      "Built Supply Tracker, a logistics dashboard focused on visibility, monitoring, and operational reporting.",
      "Use Supply Tracker when the role emphasizes dashboards, logistics, workflow visibility, or operations execution.",
    ],
  },
];

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s/-]+/g, " ").replace(/\s+/g, " ").trim();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function collectProfileText(profile: CvProfile): string {
  return [
    profile.headline,
    profile.summary,
    profile.skills.join(" "),
    profile.experience
      .map((item) => `${item.company} ${item.role} ${item.bullets.join(" ")}`)
      .join(" "),
  ]
    .join(" ")
    .trim();
}

function buildComparisonText(profile: CvProfile, cvSourceText?: string): string {
  return [cvSourceText ?? "", collectProfileText(profile)].join(" ").trim();
}

function inferIndustryLabel(jobDescriptionText: string): string | null {
  const normalized = normalizeText(jobDescriptionText);
  if (/(health|clinical|hospital|digital health|medtech)/.test(normalized)) {
    return "HealthTech / Digital Health";
  }
  if (/(fintech|trading|crypto|risk|markets)/.test(normalized)) {
    return "FinTech / Trading";
  }
  if (/(operations|workflow|logistics|implementation)/.test(normalized)) {
    return "Operations-heavy product environment";
  }
  return null;
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getAvailablePortfolioProjects(profile: CvProfile, cvSourceText?: string): PortfolioProject[] {
  const comparisonText = normalizeText(buildComparisonText(profile, cvSourceText));
  return PORTFOLIO_PROJECTS.filter((project) => comparisonText.includes(normalizeText(project.name)));
}

export function extractKeywords(jobDescriptionText: string): string[] {
  const normalized = normalizeText(jobDescriptionText);
  const libraryMatches = KEYWORD_LIBRARY.filter((keyword) => normalized.includes(keyword));
  const longTerms = normalized
    .split(" ")
    .filter((token) => token.length >= 7)
    .slice(0, 16)
    .map(titleCase);
  return unique([...libraryMatches.map(titleCase), ...longTerms]).slice(0, 12);
}

export function suggestPortfolioProjects(jobDescriptionText: string, profile?: CvProfile, cvSourceText?: string): string[] {
  const normalized = normalizeText(jobDescriptionText);
  const availableProjects = profile ? getAvailablePortfolioProjects(profile, cvSourceText) : PORTFOLIO_PROJECTS;
  return availableProjects
    .filter((project) => project.themes.some((theme) => normalized.includes(theme)))
    .map((project) => project.name);
}

export function analyzeFit(profile: CvProfile, jobDescriptionText: string, cvSourceText?: string): FitAnalysisResult {
  const comparisonText = normalizeText(buildComparisonText(profile, cvSourceText));
  const keywords = extractKeywords(jobDescriptionText);
  const keywordMatches = keywords.filter((keyword) => comparisonText.includes(keyword.toLowerCase()));
  const skillsMatches = profile.skills.filter((skill) =>
    normalizeText(jobDescriptionText).includes(normalizeText(skill))
  );
  const portfolioRecommendations = suggestPortfolioProjects(jobDescriptionText, profile, cvSourceText);

  const fitScore = Math.max(
    28,
    Math.min(
      96,
      42 +
        keywordMatches.length * 8 +
        skillsMatches.length * 5 +
        Math.min(portfolioRecommendations.length, 2) * 4 -
        Math.max(keywords.length - keywordMatches.length - 4, 0) * 3
    )
  );

  const strengths = unique([
    ...keywordMatches.map((keyword) => `${keyword} alignment`),
    ...skillsMatches.map((skill) => `${skill} appears in the selected CV source`),
    ...portfolioRecommendations.map((project) => `${project} appears in the selected CV source and supports role relevance`),
  ]).slice(0, 5);

  const gaps = keywords.filter((keyword) => !keywordMatches.includes(keyword)).slice(0, 6);
  const roleHasIndustrySignals = /(health|clinical|hospital|fintech|trading|risk|operations|workflow|logistics)/.test(
    normalizeText(jobDescriptionText)
  );

  const recruiterRisks = unique([
    !cvSourceText && profile.experience.length === 0
      ? "No imported CV text snapshot is attached yet, so tailoring is limited to the internal profile summary, skills, experience bullets, and named projects."
      : "",
    gaps.some((gap) => /roadmap|discovery/i.test(gap))
      ? "Job description emphasizes product strategy language that may need explicit positioning."
      : "",
    roleHasIndustrySignals && portfolioRecommendations.length === 0
      ? "No matching portfolio project was detected in the selected CV source, so industry proof points may be underrepresented."
      : "",
  ]).slice(0, 4);

  const trackLabel =
    profile.targetTrack === "TPM"
      ? "Technical product and delivery leader"
      : profile.targetTrack === "PO"
        ? "Product operations and ownership partner"
        : "Implementation and solutions lead";
  const industryLabel = inferIndustryLabel(jobDescriptionText);
  const recommendedPositioning = industryLabel
    ? `${trackLabel} with evidence drawn from the selected CV source for ${industryLabel}`
    : trackLabel;

  return {
    fitScore,
    strengths,
    gaps,
    keywords,
    recruiterRisks,
    recommendedPositioning,
    portfolioRecommendations,
  };
}

function buildProjectBullets(profile: CvProfile, projectNames: string[], cvSourceText?: string): string[] {
  const availableProjects = getAvailablePortfolioProjects(profile, cvSourceText);
  return projectNames.flatMap((name) => {
    const project = availableProjects.find((item) => item.name === name);
    return project ? project.bullets : [];
  });
}

function buildSummary(profile: CvProfile, analysis: FitAnalysisResult, usesSnapshot: boolean): string {
  const firstSentence = profile.summary || analysis.recommendedPositioning;
  const emphasis = analysis.keywords.slice(0, 3).join(", ").toLowerCase();
  const sourceLabel = usesSnapshot ? "selected CV text snapshot" : "selected CV profile";
  const secondSentence = emphasis
    ? `Tailor the profile around ${emphasis} while keeping the story grounded in facts already present in the ${sourceLabel}.`
    : `Tailor the profile around facts already present in the ${sourceLabel}.`;
  return `${firstSentence} ${secondSentence}`.trim();
}

function selectRelevantBullets(profile: CvProfile, portfolioRecommendations: string[], cvSourceText?: string): string[] {
  const experienceBullets = profile.experience.flatMap((item) =>
    item.bullets.map((bullet) => `${item.role}: ${bullet}`)
  );
  return unique([...experienceBullets, ...buildProjectBullets(profile, portfolioRecommendations, cvSourceText)]).slice(0, 8);
}

export function generateQuickTailor(
  profile: CvProfile,
  jobDescriptionText: string,
  cvSourceText?: string
): QuickTailorResult {
  const analysis = analyzeFit(profile, jobDescriptionText, cvSourceText);
  const industryLabel = inferIndustryLabel(jobDescriptionText);
  const headline = industryLabel
    ? `${profile.headline || analysis.recommendedPositioning} | ${industryLabel}`
    : profile.headline || analysis.recommendedPositioning;
  const summary = buildSummary(profile, analysis, Boolean(cvSourceText));
  const rewrittenBullets = selectRelevantBullets(profile, analysis.portfolioRecommendations, cvSourceText);

  return {
    headline,
    summary,
    rewrittenBullets,
    portfolioRecommendations: analysis.portfolioRecommendations,
  };
}

export function generateFullTailor(
  profile: CvProfile,
  jobDescriptionText: string,
  cvSourceText?: string
): FullTailorResult {
  const quick = generateQuickTailor(profile, jobDescriptionText, cvSourceText);
  const experienceSection =
    profile.experience.length > 0
      ? profile.experience
          .map(
            (item) =>
              `${item.role} | ${item.company}\n${item.bullets.map((bullet) => `- ${bullet}`).join("\n")}`
          )
          .join("\n\n")
      : "Experience details not added to this base profile yet.";
  const projectSection = quick.portfolioRecommendations.length > 0
    ? quick.portfolioRecommendations
        .map((name) => {
          const project = getAvailablePortfolioProjects(profile, cvSourceText).find((item) => item.name === name);
          if (!project) {
            return `- ${name}`;
          }
          return `${project.name}\n- ${project.summary}\n${project.bullets.map((bullet) => `- ${bullet}`).join("\n")}`;
        })
        .join("\n\n")
    : "No named portfolio projects from the selected CV source were used.";

  const fullCvText = [
    quick.headline,
    "",
    "Summary",
    quick.summary,
    "",
    "Experience",
    experienceSection,
    "",
    "Projects",
    projectSection,
    "",
    "Skills",
    profile.skills.join(", "),
  ].join("\n");

  return {
    ...quick,
    fullCvText,
  };
}

export function buildOptimizerSeed(
  context: CvOptimizerContext
): Pick<JobDescription, "applicationId" | "roleId" | "company" | "title" | "rawText" | "sourceUrl"> {
  const role = context.role;
  const application = context.application;
  const company = context.company;
  const jobDescription = context.jobDescription;

  return {
    applicationId: application?.id,
    roleId: role?.id,
    company: jobDescription?.company || company?.name || "",
    title: jobDescription?.title || role?.title || "",
    rawText: jobDescription?.rawText || role?.jobDescription || "",
    sourceUrl: jobDescription?.sourceUrl || role?.url || "",
  };
}
