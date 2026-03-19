import { expect, test } from "@playwright/test";

const E2E_EMAIL = "e2e@example.com";
const E2E_USER_ID = "user_e2e_example_com";
const SESSION_KEY = "jobsprint_session_v1";
const JOB_OS_KEY = `job_os_v1_${E2E_USER_ID}`;

const SEEDED_JOB_OS_STATE = {
  assets: {
    cvs: [
      {
        id: "cv-base",
        name: "Base TPM CV",
        version: "v1.0",
        fileUrl: "https://example.com/base-cv",
        sourceText: "Base CV snapshot",
        sourceTextUpdatedAt: "2026-03-19T09:00:00.000Z",
        linkedProfileId: "cv-profile-tpm-core",
        isDefault: true,
        createdAt: "2026-03-19T09:00:00.000Z",
        updatedAt: "2026-03-19T09:00:00.000Z",
      },
    ],
    scripts: [],
    templates: [],
  },
  companies: [
    {
      id: "company-apheris",
      name: "Apheris",
      industry: "HealthTech",
      size: "51-200",
      remotePolicy: "Remote",
      priority: "B",
      status: "Active",
      notes: "",
      createdAt: "2026-03-19T09:00:00.000Z",
      updatedAt: "2026-03-19T09:00:00.000Z",
    },
  ],
  roles: [
    {
      id: "role-apheris-chief-of-staff",
      companyId: "company-apheris",
      title: "Technical Chief of Staff (to the CTO)",
      url: "",
      location: "Remote",
      seniority: "Senior",
      track: "TPM",
      fitScore: 4,
      status: "applied",
      origin: "self_sourced",
      jobDescription: "",
      createdAt: "2026-03-19T09:00:00.000Z",
      updatedAt: "2026-03-19T09:00:00.000Z",
    },
  ],
  applications: [
    {
      id: "application-1",
      companyId: "company-apheris",
      roleId: "role-apheris-chief-of-staff",
      dateApplied: "2026-03-20",
      channel: "Company Site",
      cvAssetId: "cv-base",
      cvVersion: "Base TPM CV",
      status: "sent",
      nextAction: "Follow up in 5 days",
      notes: "",
      createdAt: "2026-03-20T09:00:00.000Z",
      updatedAt: "2026-03-20T09:00:00.000Z",
    },
  ],
  outreach: [],
  cvProfiles: [
    {
      id: "cv-profile-tpm-core",
      name: "TPM Core Profile",
      targetTrack: "TPM",
      headline: "Technical Product and Delivery Leader",
      summary: "Bridge product strategy and execution.",
      experience: [],
      skills: ["Stakeholder management"],
      createdAt: "2026-03-19T09:00:00.000Z",
      updatedAt: "2026-03-19T09:00:00.000Z",
    },
  ],
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

test("manages CV variants and keeps application links stable after rename", async ({ page }) => {
  await page.goto("/job-os/assets");

  await expect(page.getByText("CV Constructor")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Base TPM CV" })).toBeVisible();

  const nameInput = page.getByPlaceholder("CV name");
  await nameInput.fill("Renamed Base CV");
  await expect(nameInput).toHaveValue("Renamed Base CV");
  await expect(page.getByRole("heading", { name: "Renamed Base CV" })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((jobOsKey) => {
        const raw = window.localStorage.getItem(jobOsKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed.assets?.cvs?.find((cv: { id: string; name: string }) => cv.id === "cv-base")?.name ?? null;
      }, JOB_OS_KEY)
    )
    .toBe("Renamed Base CV");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Renamed Base CV" })).toBeVisible();

  await page.goto("/job-os/applications");
  await expect(page.getByRole("cell", { name: "Renamed Base CV" })).toBeVisible();

  await page.goto("/job-os/assets");
  await page.getByRole("button", { name: "Duplicate" }).click();
  await expect(page.getByText("CV duplicated")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Renamed Base CV Copy" })).toBeVisible();

  await page.getByPlaceholder("CV name").fill("Platform CV Variant");
  await page.getByRole("button", { name: "Set Default" }).click();
  await expect(page.getByText("Default CV updated")).toBeVisible();
  await expect(page.getByRole("button", { name: /Platform CV Variant.*Default/ })).toBeVisible();

  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("CV deleted")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Platform CV Variant" })).not.toBeVisible();
});









