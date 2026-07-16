import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: {
    enabled: false,
  },
  modules: [
    "@nuxt/image",
    "@nuxt/icon",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
    "@nuxtjs/color-mode",
    "@nuxtjs/strapi",
    "@nuxtjs/mdc",
    "@nuxtjs/seo",
    "@vite-pwa/nuxt",
    "@nuxtjs/mcp-toolkit",
    "nuxt-spyglass",
    "@nuxt/fonts",
    "@nuxt/eslint",
    "@nuxt/hints",
    "@nuxt/a11y",
  ],
  fonts: {
    families: [
      { name: 'Roboto', provider: 'local' },
      { name: 'Open Sans', provider: 'local' },
      { name: 'Yellowtail', provider: 'local' },
    ],
  },
  hints: {
    devtools: true,
    features: {
      hydration: true,
      lazyLoad: true,
      webVitals: true,
      thirdPartyScripts: true,
      htmlValidate: true,
    },
  },
  nitro: {
    preset: "node-server",
    prerender: {
      ignore: ["/sitemap.xml"],
    },
  },

  site: {
    url: process.env.SITE_URL || process.env.NUXT_PUBLIC_SITE_URL,
    name: "Awesome Site",
    description: "Welcome to my awesome site!",
  },

  sitemap: {
    sources: ["/api/__sitemap__/urls"],
  },

  robots: {
    blockAiBots: true,
    disallow: ["/admin"],
    groups: [
      {
        userAgent: ["Yandex"],
        cleanParam: ["sort", "filter", "page", "search"],
      },
    ],
  },
  ssr: true,
  routeRules: {
    "/": {
      redirect: "/ru",
    },
    "/sitemap.xml": { static: true },
  },
  runtimeConfig: {
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    strapi: {
      url: process.env.NUXT_STRAPI_URL,
      token: process.env.NUXT_STRAPI_TOKEN,
      prefix: "/api",
      admin: "/admin",
      version: "v5",
      cookieName: "strapi_jwt",
    },
    strapiAdmin: {
      token: process.env.STRAPI_ADMIN_TOKEN,
    },
    public: {
      siteUrl: process.env.SITE_URL || process.env.NUXT_PUBLIC_SITE_URL,
      strapi: {
        url: process.env.NUXT_PUBLIC_STRAPI_URL,
      },
    },
  },
  image: {
    domains: ["http://127.0.0.1:1337", "api.vh324.by3020.ihb.by"],
    screens: {
      xs: 320,
      sm: 480,
      md: 768,
      lg: 1024,
      xl: 1630,
    },
    quality: 85,
    densities: [1, 2],
    format: ["avif", "webp", "png", "jpeg"],
  },
  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 100,
    },
    customCollections: [
      {
        prefix: "my-icon",
        dir: "./public/my-icons",
        normalizeIconName: false,
      },
    ],
  },
  colorMode: {
    preference: "system",
    fallback: "light",
  },
  css: ["@/assets/scss/styles.scss"],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
           additionalData: `
              @use "@/assets/scss/foundation/_settings.scss" as *;
              @use "@/assets/scss/foundation/_functions.scss" as *;
              @use "@/assets/scss/foundation/_mixins.scss" as *;
              `,
        },
      },
      preprocessorMaxWorkers: true,
      devSourcemap: true,
    },
    build: {
      cssCodeSplit: true,
      cssMinify: true,
    },
    optimizeDeps: {
      include: ["sass"],
    },
    assetsInclude: ["**/*.avif"],
  },
  imports: {
    dirs: ["shared/types/**", "shared/utils/**"],
  },
  mcp: {
    name: "Agro Market MCP Server",
    version: "1.0.0",
    route: "/mcp",
    browserRedirect: "/",
    dir: "mcp",
    autoImports: true,
  },
});