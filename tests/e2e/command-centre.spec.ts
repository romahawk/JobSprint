import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("Command Centre", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("renders empty-state description", async ({ page }) => {
    await expect(page.getByText(/score the opportunity/)).toBeVisible();
  });

  test("renders empty-state heading", async ({ page }) => {
    await expect(page.getByText("Paste a job URL to begin")).toBeVisible();
  });

  test("renders Job posting URL input", async ({ page }) => {
    await expect(page.getByLabel("Job posting URL")).toBeVisible();
  });

  test("renders Import job button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Import job" })).toBeVisible();
  });

  test("shows paste-text area for LinkedIn URLs", async ({ page }) => {
    const input = page.getByLabel("Job posting URL");
    await input.fill("https://www.linkedin.com/jobs/view/123456789");
    await expect(page.getByLabel(/Paste job description/i)).toBeVisible();
  });
});
