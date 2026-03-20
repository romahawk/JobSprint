import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Signs in using the local (no-Firebase) auth path.
 * In local mode the password field is validated by the browser (minLength=6)
 * but the auth service only uses the email. Any 6+ character password works.
 */
export async function signIn(page: Page, email = "e2e@example.com"): Promise<void> {
  await page.goto("/signin");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("password123");
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL("/");
}
