import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: {
    enabled: false,
  },
  experimental: {
    // View Transitions API (нативно, opt-in на страницах через definePageMeta)
    viewTransition: true,
    // appManifest — в Nuxt 4 включён ПО УМОЛЧАНИЮ (доки: "enabled by default"), отдельный флаг
    // не нужен. @vite-pwa/nuxt это видит (nuxt.options.experimental.appManifest) и сам добавляет
    // `_nuxt/builds/**/*.json` в precache со снятым revision — нативная per-build изоляция кэша.
  },
  app: {
    // Глобальный дефолт VT — выключен; включается точечно (лёгкие CSR-страницы)
    viewTransition: false,
    // Vue Transitions — глобальный кроссфейд для всех страниц (SSR-дефолт)
    pageTransition: {
      name: "page-fade",
      mode: "out-in",
    },
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
    // В тестах (vitest) PWA-виртуальный модуль конфликтует с @nuxt/test-utils
    ...(process.env.VITEST ? [] : ["@vite-pwa/nuxt"]),
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
      // Рукописный аналог Comic Sans с кириллицей (Comic Neue/Comic Sans MS не поддерживают ru)
      { name: 'Neucha', provider: 'google' },
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
    // `selfDestroying` включали 15.10 (снять SW + очистить кэши), 16.10 СНЯТ — PWA
    // возвращена. Кэш-стратегия безопасна по свежести: навигации в NetworkOnly
    // (ниже, в workbox), `html` не в precache → старый HTML подменить нельзя.
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
      // HTML в precache НЕ кладём: навигации уходят в сеть (см. NetworkOnly ниже)
      globPatterns: ["**/*.{js,css,png,svg,ico}"],
      // Навигации — ТОЛЬКО сеть. NetworkFirst с таймаутом отдавал закэшированный
      // HTML (со старым бандлом и payload) на холодной сети, и приложение
      // продолжало работать старой версией до ручной перезагрузки.
      // Офлайн отдаст браузерную заглушку (для магазина это приемлемо).
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === "navigate",
          handler: "NetworkOnly",
        },
      ],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
  },
  ssr: true,
  routeRules: {
    // === SSG (Static prerender) — статичные страницы ===
    "/": { redirect: "/ru" },
    // /sitemap.xml больше НЕ static: генерируется на запрос → новые товары/статьи
    // попадают в карту сайта сразу (раньше требовалась пересборка).
    "/**/about": { prerender: true },
    "/**/contacts": { prerender: true },
    "/**/services": { prerender: true },

    // === SWR — ТОЛЬКО контентные разделы (свежесть ≤5 мин) ===
    // Паттерн без хвостового /** матчит сам список (/ru/blog), с /** — вложенные.
    "/**/blog": { swr: 300 },
    "/**/blog/**": { swr: 300 },
    "/**/news": { swr: 300 },
    "/**/news/**": { swr: 300 },

    // Каталог (products / [categorySlug]/products / карточки товаров) — БЕЗ SWR:
    // данные и так кэшируются useCachedAsyncData (1 мин), SSR дешёвый, страницы
    // всегда свежие. Прежний "/**/products/**" не матчился (хвостовой /** требует
    // сегмент) и не работал.

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
        // `et` — стандартная коллекция вне известного списка iconify. Свои файловые
        // иконки идут через UIconLocal (CSS-маска из /public/my-icons), в бандл
        // iconify их класть не нужно.
        additionalCollections: ["et"],
      },
      sizeLimitKb: 100,
    },
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