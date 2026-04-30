import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const JOB_OS_KEY_PREFIX = "job_os_v1";

function toUserId(email: string) {
  return `user_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}

/**
 * Signs in using the local (no-Firebase) auth path.
 * In local mode the password field is validated by the browser (minLength=6)
 * but the auth service only uses the email. Any 6+ character password works.
 *
 * Seeds a minimal job-os state (one placeholder company) so the dashboard
 * `isEmpty` flag is false and the FirstRunScreen never blocks subsequent
 * dashboard assertions.
 */
export async function signIn(page: Page, email = "e2e@example.com"): Promise<void> {
  const userId = toUserId(email);
  const jobOsKey = `${JOB_OS_KEY_PREFIX}_${userId}`;
  // Seed a minimal workspace so isEmpty=false and FirstRunScreen is skipped.
  const minimalJobOs = {
    assets: { cvs: [], scripts: [], templates: [] },
    companies: [
      {
        id: "e2e-seed-company",
        name: "E2E Seed Co",
        industry: "",
        size: "",
        remotePolicy: "",
        priority: "B",
        status: "Active",
        notes: "",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    roles: [],
    applications: [],
    outreach: [],
    cvProfiles: [],
    jobDescriptions: [],
    cvTailoringRuns: [],
  };
  await page.addInitScript(
    ({ key, state }) => {
      if (!window.localStorage.getItem(key)) {
        window.localStorage.setItem(key, JSON.stringify(state));
      }
    },
    { key: jobOsKey, state: minimalJobOs }
  );

  await page.goto("/signin");

  await page.locator("#email").fill(email);
  await page.locator("#password").fill("password123");
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL("/app");
}
