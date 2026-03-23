import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const ONBOARDING_STATUS_KEY_PREFIX = "jobsprint_dashboard_onboarding_v1";

function toUserId(email: string) {
  return `user_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}

/**
 * Signs in using the local (no-Firebase) auth path.
 * In local mode the password field is validated by the browser (minLength=6)
 * but the auth service only uses the email. Any 6+ character password works.
 *
 * Also sets the onboarding status to "completed" via addInitScript so the
 * first-run screen never blocks subsequent dashboard assertions.
 */
export async function signIn(page: Page, email = "e2e@example.com"): Promise<void> {
  // Set the onboarding status to "completed" before any page script runs so
  // the FirstRunScreen is never shown for the empty-pipeline test user.
  const onboardingKey = `${ONBOARDING_STATUS_KEY_PREFIX}_${toUserId(email)}`;
  await page.addInitScript((key) => {
    localStorage.setItem(key, "completed");
  }, onboardingKey);

  await page.goto("/signin");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("password123");
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL("/");
}
