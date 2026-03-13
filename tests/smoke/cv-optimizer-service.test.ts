import { describe, expect, it } from "vitest";
import {
  analyzeFit,
  extractKeywords,
  generateFullTailor,
  generateQuickTailor,
  suggestPortfolioProjects,
} from "../../src/services/cvOptimizerService";
import type { CvProfile } from "../../src/app/types/jobOs";

const profile: CvProfile = {
  id: "profile-1",
  name: "TPM Core",
  targetTrack: "TPM",
  headline: "Technical Product and Delivery Leader",
  summary: "Lead implementation delivery, workflow design, and stakeholder alignment across digital products.",
  experience: [
    {
      company: "Portfolio Work",
      role: "Product Builder",
      bullets: [
        "Led implementation planning across cross-functional stakeholders.",
        "Built workflow systems to improve delivery visibility and operations execution.",
      ],
    },
  ],
  skills: ["Stakeholder management", "Implementation", "Workflow optimization"],
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
};

describe("cv optimizer service", () => {
  it("extracts keywords and only maps projects named in the selected source", () => {
    const jobDescription = "Technical Program Manager role for a digital health platform focused on clinical workflow, stakeholder management, and implementation.";
    const cvSourceText = "Recent projects include LiveSurgery and FlowLogix.";
    expect(extractKeywords(jobDescription)).toContain("Implementation");
    expect(suggestPortfolioProjects(jobDescription, profile, cvSourceText)).toContain("LiveSurgery");
    expect(suggestPortfolioProjects(jobDescription, profile, cvSourceText)).not.toContain("Supply Tracker");
  });

  it("analyzes fit against the imported cv text snapshot when provided", () => {
    const jobDescription = "Own implementation, roadmap, and stakeholder management for a product operations team.";
    const result = analyzeFit(profile, jobDescription, "This CV highlights roadmap ownership and stakeholder management.");
    expect(result.fitScore).toBeGreaterThan(45);
    expect(result.strengths.join(" ")).toMatch(/roadmap|stakeholder|implementation/i);
  });

  it("generates quick and full tailor outputs with only allowed project evidence", () => {
    const jobDescription = "Fintech product role focused on risk workflows, operations, and implementation.";
    const cvSourceText = "Selected projects: AlphaRhythm and FlowLogix.";
    const quick = generateQuickTailor(profile, jobDescription, cvSourceText);
    const full = generateFullTailor(profile, jobDescription, cvSourceText);

    expect(quick.summary).toMatch(/text snapshot/i);
    expect(quick.portfolioRecommendations).toEqual(["AlphaRhythm", "FlowLogix"]);
    expect(quick.portfolioRecommendations).not.toContain("Supply Tracker");
    expect(full.fullCvText).toContain("Projects");
    expect(full.fullCvText).toContain("AlphaRhythm");
    expect(full.fullCvText).not.toContain("Supply Tracker");
  });
});
