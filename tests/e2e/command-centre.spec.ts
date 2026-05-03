import { test, expect } from "./fixtures";
import { signIn } from "./helpers";

test.describe("Command Centre", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("renders Focused Next Action panel", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "E2E Seed Co" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Add Role" })).toBeVisible();
  });

  test("renders Pipeline Snapshot panel", async ({ page }) => {
    await expect(page.getByText("Pipeline Snapshot")).toBeVisible();
  });

  test("renders Weekly Execution panel", async ({ page }) => {
    await expect(page.getByText("Weekly Execution")).toBeVisible();
  });

  test("renders Pipeline Snapshot stats", async ({ page }) => {
    await expect(page.getByText("To Apply")).toBeVisible();
    await expect(page.getByText("Applied")).toBeVisible();
  });

  test("Probability Engine toggle expands the panel", async ({ page }) => {
    const body = page.getByText("Log applications to see offer probability.");

    // Panel is collapsed by default
    await expect(body).not.toBeVisible();

    // Click the toggle
    await page.getByRole("button", { name: /Probability Engine/i }).click();

    // Body should now be visible (empty-pipeline state message)
    await expect(body).toBeVisible();
  });
});




