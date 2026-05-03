import { test, expect } from "./fixtures";
import { signIn } from "./helpers";

test.describe("Job OS navigation", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("navigates to Companies page", async ({ page }) => {
    await page.goto("/job-os/companies");
    await expect(page.getByRole("heading", { name: "Companies" })).toBeVisible();
  });

  test("navigates to Roles page", async ({ page }) => {
    await page.goto("/job-os/roles");
    await expect(page.getByText("Roles Pipeline")).toBeVisible();
  });

  test("navigates to Applications page", async ({ page }) => {
    await page.goto("/job-os/applications");
    await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();
  });

  test("AppNavbar contains all top-level navigation links", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Action", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pipeline", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Companies & System", exact: true })).toBeVisible();
  });
});


