import { defineVitestConfig } from "@nuxt/test-utils/config"

export default defineVitestConfig({
  test: {
    environment: "./node_modules/@nuxt/test-utils/vitest-environment",
    globals: true,
  },
})
