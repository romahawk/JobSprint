import { Buffer } from "node:buffer";
import { expect, test } from "@playwright/test";

const E2E_EMAIL = "e2e@example.com";
const E2E_USER_ID = "user_e2e_transfer_example_com";
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
  companies: [],
  roles: [],
  applications: [],
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

test("edits scripts/templates and round-trips import export from settings", async ({ page }) => {
  await page.goto("/job-os/assets");
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "cv.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Imported CV snapshot from text file"),
  });
  await expect(page.getByText("Base TPM CV snapshot updated")).toBeVisible();
  await expect(page.getByText(/Text upload imported/).first()).toBeVisible();

  await page.getByRole("tab", { name: "Scripts" }).click();

  await page.getByPlaceholder("Script title").fill("Warm intro");
  await page.getByPlaceholder("tags: referral, recruiter").fill("intro, recruiter");
  await page.getByPlaceholder("Write outreach script...").fill("Hi {{name}}, I would love to connect.");
  await page.getByRole("button", { name: "Save Script" }).click();
  await expect(page.getByText("Script saved")).toBeVisible();

  await page.locator('input[placeholder="Script title"]').nth(1).fill("Warm intro updated");
  await page.locator('textarea[placeholder="Write outreach script..."]').nth(1).fill("Updated outreach body");
  await expect(page.locator('input[placeholder="Script title"]').nth(1)).toHaveValue("Warm intro updated");
  await page.getByRole("button", { name: "Delete" }).first().click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.getByText("Delete Warm intro updated?")).toBeVisible();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Script deleted")).toBeVisible();
  await expect(page.getByText("No scripts yet")).toBeVisible();

  await page.getByRole("tab", { name: "Templates" }).click();
  await page.getByPlaceholder("Template title").fill("Cover note");
  await page.getByPlaceholder("tags").fill("cover, cv");
  await page.getByPlaceholder("Reusable template...").fill("I am excited to apply.");
  await page.getByRole("button", { name: "Save Template" }).click();
  await expect(page.getByText("Template saved")).toBeVisible();

  await page.locator('input[placeholder="Template title"]').nth(1).fill("Cover note updated");
  await page.locator('textarea[placeholder="Reusable template..."]').nth(1).fill("Updated reusable template body");
  await expect(page.locator('input[placeholder="Template title"]').nth(1)).toHaveValue("Cover note updated");
  await page.getByRole("button", { name: "Delete" }).first().click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.getByText("Delete Cover note updated?")).toBeVisible();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Template deleted")).toBeVisible();
  await expect(page.getByText("No templates yet")).toBeVisible();

  await page.getByRole("button", { name: "Open settings" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  expect(await download.path()).toBeTruthy();
  await expect(page.getByText(/Exported Job OS state to jobsprint-export-/)).toBeVisible();

  const importPayload = {
    kind: "jobsprint.job-os.export",
    version: 1,
    exportedAt: "2026-03-19T12:00:00.000Z",
    state: {
      ...SEEDED_JOB_OS_STATE,
      assets: {
        ...SEEDED_JOB_OS_STATE.assets,
        scripts: [
          {
            id: "script-imported",
            title: "Imported Script",
            scriptText: "Imported outreach script",
            tags: ["imported"],
            lastUpdated: "2026-03-19T12:00:00.000Z",
            createdAt: "2026-03-19T12:00:00.000Z",
            updatedAt: "2026-03-19T12:00:00.000Z",
          },
        ],
        templates: [
          {
            id: "template-imported",
            title: "Imported Template",
            templateText: "Imported reusable template",
            tags: ["imported"],
            createdAt: "2026-03-19T12:00:00.000Z",
            updatedAt: "2026-03-19T12:00:00.000Z",
          },
        ],
      },
    },
  };

  page.once("dialog", (dialog) => dialog.accept());
  await page.locator('input[type="file"]').setInputFiles({
    name: "jobsprint-import.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(importPayload, null, 2)),
  });

  await expect(page.getByText("Imported Job OS state successfully.")).toBeVisible();
  await page.reload();

  await page.getByRole("tab", { name: "Scripts" }).click();
  await expect(page.locator('input[value="Imported Script"]').first()).toBeVisible();

  await page.getByRole("tab", { name: "Templates" }).click();
  await expect(page.locator('input[value="Imported Template"]').first()).toBeVisible();
});
