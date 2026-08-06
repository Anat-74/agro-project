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
      // hydration: flood предупреждений о SSR/клиент-расхождениях из-за
      // пре-экзистинг паттернов (viewport, localStorage, корзина). Это
      // dev-диагностика; исправление требует глобального рефакторинга
      // компонентов под SSR-стабильность. Отключено для чистого консоль-вывода.
      hydration: false,
      lazyLoad: true,
      // webVitals: dev-замер LCP на dev-сервере нерепрезентативен (обработка
      // _ipx на лету). Реальные оптимизации сделаны в коде (fetchPriority="high"
      // на hero), preload сознательно не используется (не совпадает со srcset).
      webVitals: false,
      thirdPartyScripts: true,
      // htmlValidate: валидировал HTML на каждом рендере (nitro-плагин),
      // все найденные замечания уже исправлены. Исполнение валидатора даёт
      // Long Task в dev ([Violation] 'setTimeout' handler took ...ms) и
      // замедляет SSR. При необходимости фичу можно включить снова.
      htmlValidate: false,
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
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Organick",
      short_name: "Organick",
      description: "Магазин агро-продуктов",
      theme_color: "#274C5B",
      background_color: "#ffffff",
      display: "standalone",
      scope: "/",
      start_url: "/ru",
      lang: "ru",
      icons: [
        { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
        { src: "apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      navigateFallback: "/ru",
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
  },
  ssr: true,
  routeRules: {
    // === SSG (Static prerender) ===
    "/": { redirect: "/ru" },
    "/sitemap.xml": { static: true },
    "/**/about": { prerender: true },
    "/**/contacts": { prerender: true },
    "/**/services": { prerender: true },

    // === SWR (Stale-while-revalidate) ===
    "/**/blog": { swr: 3600 },
    "/**/news": { swr: 3600 },
    "/**/products/**": { swr: 300 },

    // === CSR (Client-side only — no SEO, user-specific) ===
    "/**/cartshopping": { ssr: false },
    "/**/auth/**": { ssr: false },
    "/**/cabinet/**": { ssr: false },
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
      cookie: {
        maxAge: 60 * 60 * 24 * 30,
      },
    },
    strapiAdmin: {
      token: process.env.STRAPI_ADMIN_TOKEN,
    },
    public: {
      siteUrl: process.env.SITE_URL || process.env.NUXT_PUBLIC_SITE_URL,
      strapi: {
        url: process.env.NUXT_PUBLIC_STRAPI_URL,
        cookieName: "strapi_jwt",
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
      scan: {
        // Иконки из .ts-файлов (например, флаги в app/composables/useLocale.ts)
        globInclude: ["**/*.{vue,js,jsx,ts,tsx,md,mdc,mdx,yml,yaml}"],
        // Коллекция `et` отсутствует в известном списке iconify → сканер её не матчит
        additionalCollections: ["et"],
      },
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