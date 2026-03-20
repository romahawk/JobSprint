import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("Job OS navigation", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("navigates to Companies page", async ({ page }) => {
    await page.goto("/job-os/companies");
    await expect(page.getByRole("heading", { name: /Company Engine/i })).toBeVisible();
  });

  test("navigates to Roles page", async ({ page }) => {
    await page.goto("/job-os/roles");
    await expect(page.getByText("Roles Pipeline")).toBeVisible();
  });

  test("navigates to Applications page", async ({ page }) => {
    await page.goto("/job-os/applications");
    await expect(page.getByRole("heading", { name: /Applications/i })).toBeVisible();
  });

  test("AppNavbar contains all top-level navigation links", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Command Centre/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Job OS/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /CV Optimizer/i })).toBeVisible();
  });
});
