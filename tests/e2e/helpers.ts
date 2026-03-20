import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const ONBOARDING_SKIPPED_KEY = "jobsprint_onboarding_skipped";

/**
 * Signs in using the local (no-Firebase) auth path.
 * In local mode the password field is validated by the browser (minLength=6)
 * but the auth service only uses the email. Any 6+ character password works.
 *
 * Also sets the onboarding skip flag via addInitScript so the first-run
 * screen never blocks subsequent dashboard assertions.
 */
export async function signIn(page: Page, email = "e2e@example.com"): Promise<void> {
  // Set the onboarding-skip flag before any page script runs so the
  // FirstRunScreen is never shown for the empty-pipeline test user.
  await page.addInitScript((key) => {
    localStorage.setItem(key, "1");
  }, ONBOARDING_SKIPPED_KEY);

  await page.goto("/signin");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("password123");
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL("/");
}
