import { expect, test } from "./fixtures";

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
  await expect(page.getByRole("button", { name: "Application already logged" })).toBeVisible();

  await page.reload();

  await expect(page.getByText("Technical Chief of Staff (to the CTO)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Application already logged" })).toBeVisible();

  await page.goto("/job-os/applications");
  await expect(page.getByRole("cell", { name: "Apheris" })).toBeVisible();
  await expect(page.getByText("Technical Chief of Staff (to the CTO)")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((jobOsKey) => {
        const raw = window.localStorage.getItem(jobOsKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const application = parsed.applications?.find(
          (item: { roleId: string; channel: string }) =>
            item.roleId === "role-apheris-chief-of-staff"
        );
        return application?.channel ?? null;
      }, JOB_OS_KEY)
    )
    .toBe("Company Site");
});





test("syncs role status changes into Applications and dashboard metrics", async ({
  page,
}) => {
  await page.goto("/job-os/roles");

  await expect(page.getByText("Technical Chief of Staff (to the CTO)")).toBeVisible();
  await page.getByRole("button", { name: "Add application" }).click();
  await expect(
    page.getByText("Application created for Technical Chief of Staff (to the CTO).")
  ).toBeVisible();

  await page
    .locator("tr", { has: page.getByText("Technical Chief of Staff (to the CTO)") })
    .getByRole("combobox")
    .first()
    .click();
  await page.getByRole("option", { name: "interview" }).click({ force: true });

  await page.goto("/job-os/applications");
  await page.getByRole("tab", { name: /Interviewing/i }).click();
  await expect(page.getByText("Technical Chief of Staff (to the CTO)")).toBeVisible();
  await expect(
    page
      .locator("tr", { has: page.getByText("Technical Chief of Staff (to the CTO)") })
      .getByRole("combobox")
  ).toContainText("Interview");

  await page.goto("/app");
  await expect(page.getByText("Pipeline Snapshot")).toBeVisible();
  await expect(
    page
      .locator("section")
      .filter({ has: page.getByText("Pipeline Snapshot") })
      .getByText("1")
      .first()
  ).toBeVisible();
});


