import { defineVitestConfig } from "@nuxt/test-utils/config"

export default defineVitestConfig({
  test: {
    environment: "nuxt",
    globals: true,
    // Nuxt-окружение поднимается дольше дефолтных 10с (setupNuxt)
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
})
