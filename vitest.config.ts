import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    // Exclude both Playwright test directories from the Vitest runner.
    // tests/e2e/ is the primary E2E dir; e2e/ holds auth/command-centre specs.
    exclude: ['tests/e2e/**', 'e2e/**', 'node_modules/**', 'dist/**'],
  },
}))
