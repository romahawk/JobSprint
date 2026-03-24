import { test as base, expect } from "@playwright/test";

/**
 * Extended test fixture that aborts all requests to external hosts so the
 * page load event fires even in DNS-restricted CI environments.
 *
 * The app is served from 127.0.0.1:4173. Any http/https request to a different
 * host (Google Fonts, Firebase, GTM, CDNs, etc.) is aborted immediately to
 * prevent the browser's load event from stalling on an unresolvable DNS lookup.
 *
 * Non-http(s) URLs (blob:, data:, chrome-extension:, etc.) are always allowed
 * through so that Vite's chunked assets and browser internals are unaffected.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("**/*", (route) => {
      const requestUrl = route.request().url();
      // Only intercept plain http/https requests — blob:, data:, etc. must pass.
      if (!requestUrl.startsWith("http://") && !requestUrl.startsWith("https://")) {
        return route.continue();
      }
      let hostname: string;
      try {
        hostname = new URL(requestUrl).hostname;
      } catch {
        return route.continue();
      }
      if (hostname !== "127.0.0.1") {
        return route.abort();
      }
      return route.continue();
    });
    await use(page);
  },
});

export { expect };
