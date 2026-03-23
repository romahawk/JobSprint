import { test as base, expect } from "@playwright/test";

/**
 * Extended test fixture that aborts requests to external font hosts
 * (fonts.googleapis.com, fonts.gstatic.com) so the page load event fires
 * even in environments where external DNS is unavailable.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com/, (route) =>
      route.abort()
    );
    await use(page);
  },
});

export { expect };
