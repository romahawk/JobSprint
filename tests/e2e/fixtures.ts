import { test as base, expect } from "@playwright/test";

/**
 * Extended test fixture that aborts requests to external font hosts.
 *
 * Google Fonts is no longer imported in the CSS but this interceptor stays as
 * a safety net for CI environments where external DNS is unavailable. It uses a
 * targeted pattern (not a catch-all) so that normal app requests — including
 * localhost assets, blob: workers, and data: URLs — are never touched by the
 * handler and flow through to the server without any Playwright overhead.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(
      /fonts\.googleapis\.com|fonts\.gstatic\.com/,
      (route) => route.abort()
    );
    await use(page);
  },
});

export { expect };
