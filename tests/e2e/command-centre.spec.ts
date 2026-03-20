import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("Command Centre", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("renders Today's Actions panel", async ({ page }) => {
    await expect(page.getByText("Today's Actions")).toBeVisible();
  });

  test("renders Pipeline Snapshot panel", async ({ page }) => {
    await expect(page.getByText("Pipeline Snapshot")).toBeVisible();
  });

  test("renders Quick Actions", async ({ page }) => {
    await expect(page.getByText("Quick Actions")).toBeVisible();
  });

  test("Quick Actions contains all four nav links", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Add Company/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Log Application/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Tailor CV/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Browse Roles/i })).toBeVisible();
  });

  test("Probability Engine toggle expands the panel", async ({ page }) => {
    // Panel is collapsed by default — the body should not be visible
    await expect(page.getByText("Probability of ≥1 Offer")).not.toBeVisible();

    // Click the toggle
    await page.getByRole("button", { name: /Probability Engine/i }).click();

    // Body should now be visible
    await expect(page.getByText("Probability of ≥1 Offer")).toBeVisible();
  });
});
