import { test as base, expect } from "@playwright/test";

/**
 * Extended test fixture that aborts all requests to external hosts so the
 * page load event fires even in DNS-restricted CI environments.
 *
 * The app is served from 127.0.0.1:4173. Any request to a different host
 * (Google Fonts, Firebase, GTM, CDNs, etc.) is aborted immediately to prevent
 * the browser's load event from stalling on an unresolvable DNS lookup.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== "127.0.0.1") {
        return route.abort();
      }
      return route.continue();
    });
    await use(page);
  },
});

export { expect };
