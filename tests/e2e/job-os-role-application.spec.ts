import { expect, test } from "@playwright/test";

const E2E_EMAIL = "e2e@example.com";
const E2E_USER_ID = "user_e2e_example_com";
const SESSION_KEY = "jobsprint_session_v1";
const JOB_OS_KEY = `job_os_v1_${E2E_USER_ID}`;

const SEEDED_JOB_OS_STATE = {
  assets: { cvs: [], scripts: [], templates: [] },
  companies: [
    {
      id: "company-apheris",
      name: "Apheris",
      industry: "HealthTech",
      size: "51-200",
      remotePolicy: "Remote",
      priority: "B",
      status: "Target",
      notes: "",
      createdAt: "2026-03-19T09:00:00.000Z",
      updatedAt: "2026-03-19T09:00:00.000Z"
    }
  ],
  roles: [
    {
      id: "role-apheris-chief-of-staff",
      companyId: "company-apheris",
      title: "Technical Chief of Staff (to the CTO)",
      url: "",
      location: "Remote",
      seniority: "Senior",
      track: "Systems PM",
      fitScore: 3,
      status: "applied",
      origin: "self_sourced",
      jobDescription: "",
      createdAt: "2026-03-19T09:00:00.000Z",
      updatedAt: "2026-03-19T09:00:00.000Z"
    }
  ],
  applications: [],
  outreach: [],
  cvProfiles: [],
  jobDescriptions: [],
  cvTailoringRuns: [],
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ sessionKey, session, jobOsKey, jobOsState }) => {
      if (!window.localStorage.getItem(sessionKey)) {
        window.localStorage.clear();
        window.localStorage.setItem(sessionKey, JSON.stringify(session));
        window.localStorage.setItem(jobOsKey, JSON.stringify(jobOsState));
      }
    },
    {
      sessionKey: SESSION_KEY,
      session: {
        userId: E2E_USER_ID,
        email: E2E_EMAIL,
        provider: "local",
      },
      jobOsKey: JOB_OS_KEY,
      jobOsState: SEEDED_JOB_OS_STATE,
    }
  );
});

test("logs one application from Roles, prevents duplicates, and persists after refresh", async ({
  page,
}) => {
  await page.goto("/job-os/roles");

  await expect(page.getByText("Technical Chief of Staff (to the CTO)")).toBeVisible();
  await page.getByRole("button", { name: "Add application" }).click();

  await expect(
    page.getByText("Application created for Technical Chief of Staff (to the CTO).")
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Application logged" })).toBeDisabled();

  await page.reload();

  await expect(page.getByText("Technical Chief of Staff (to the CTO)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Application logged" })).toBeDisabled();

  await page.goto("/job-os/applications");
  await expect(page.getByText("Apheris")).toBeVisible();
  await expect(page.getByText("Technical Chief of Staff (to the CTO)")).toBeVisible();
  await expect(page.getByText("Company Site")).toBeVisible();
});
