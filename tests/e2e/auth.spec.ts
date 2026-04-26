import { test, expect } from "./fixtures";

test.describe("Authentication", () => {
  test("sign-in page renders correctly", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByRole("heading", { name: "Sign in to JobSprint" })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("local sign-in navigates to Command Centre", async ({ page }) => {
    await page.goto("/signin");
    await page.locator("#email").fill("e2e@example.com");
    await page.locator("#password").fill("password123");
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL("/app");
  });

  test("protected route redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL("/signin");
  });
});
