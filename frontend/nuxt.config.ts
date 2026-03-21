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
  ],
  nitro: {
    storage: {
      // Кэширование оптимизированных изображений
      // "cache:nuxt-image": {
      //   driver: "fs",
      //   base: "./node_modules/.cache/nuxt-image",
      // },
    },
    prerender: {
      ignore: ["/sitemap.xml"],
    },
  },
  // @ts-ignore
  site: {
    url: process.env.SITE_URL || process.env.NUXT_PUBLIC_SITE_URL,
    name: "Awesome Site",
    description: "Welcome to my awesome site!",
  },
  // @ts-ignore
  sitemap: {
    sources: ["/api/__sitemap__/urls"],
  },
  // @ts-ignore
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
    // Редирект с корня
    "/": {
      redirect: "/ru",
      // cache: {
      //   maxAge: 86400, // 24 часа
      //   swr: true
      // }
    },
    // Делаем sitemap.xml доступным
    "/sitemap.xml": { static: true },

    // Главная страница - ISR с кэшем 30 мин на CDN
    //  "/ru": { isr: 1800 },

    // Статические страницы
    //  "/ru/about": { prerender: true },
    //  "/ru/services": { prerender: true },
    //  "/ru/contacts": { prerender: true },

    // Категории - ISR для баланса скорости и свежести
    //  "/ru/**": { isr: 3600 },

    // Товары - SWR для обновления в фоне при изменениях
    //  "/ru/*/*": {
    //    cache: {
    //      maxAge: 600,
    //      swr: true,
    //      staleMaxAge: 3600,
    //    },
    //  },

    // Описание товара - как товары
    //  "/ru/*/*/*": {
    //    cache: {
    //      maxAge: 600,
    //      swr: true,
    //      staleMaxAge: 3600,
    //    },
    //  },
  },
  runtimeConfig: {
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
    //  domains: ["api.vh324.by3020.ihb.by"],
    domains: ["http://127.0.0.1:1337"],
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
    // Автоматически добавлять иконки из компонентов в клиентский бандл
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
    // serverBundle: {
    //   scan: true,
    //   sizeLimitKb: 100,
    //   collections: [
    //       'carbon',
    //       'et',
    //       'mingcute',
    //       'entypo',
    //       'mdi',
    //       'qlementine-icons',
    //       'pixelarticons'
    //    ]
    // }
  },
  colorMode: {
    preference: "system",
    fallback: "light",
  },
  //   pwa: {
  //     manifest: {
  //       name: "Agro Market",
  //       short_name: "Agro",
  //       description: "Интернет-магазин сельхозпродукции",
  //       theme_color: "#4299e1",
  //       background_color: "#ffffff",
  //       display: "standalone",
  //       icons: [
  //         {
  //           src: "/icons/icon-192x192.svg",
  //           sizes: "192x192",
  //           type: "image/svg+xml",
  //           purpose: "any maskable",
  //         },
  //         {
  //           src: "/icons/icon-512x512.svg",
  //           sizes: "512x512",
  //           type: "image/svg+xml",
  //           purpose: "any maskable",
  //         },
  //       ],
  //     },
  //     workbox: {
  //       // Кэширование основных ресурсов приложения для оффлайн-режима
  //       globPatterns: [
  //         "**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp,woff2,woff,ttf,eot,json,xml,txt}",
  //       ],

  //       runtimeCaching: [
  //         // Кэширование API-запросов к Strapi
  //         {
  //           urlPattern: /^https?:\/\/.*\.strapi\.io\/.*/i,
  //           handler: "NetworkFirst",
  //           options: {
  //             cacheName: "strapi-api-cache",
  //             expiration: {
  //               maxEntries: 50,
  //               maxAgeSeconds: 60 * 60 * 24, // 24 часа
  //             },
  //           },
  //         },
  //         // Кэширование изображений
  //         {
  //           urlPattern: /^https?:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|avif)/i,
  //           handler: "CacheFirst",
  //           options: {
  //             cacheName: "image-cache",
  //             expiration: {
  //               maxEntries: 100,
  //               maxAgeSeconds: 60 * 60 * 24 * 7, // 7 дней
  //             },
  //           },
  //         },
  //       ],
  //     },
  //   },
  css: ["@/assets/scss/styles.scss"],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
             @use "@/assets/scss/base/_settings.scss" as *;
             @use "@/assets/scss/base/_fonts.scss" as *;
             @use "@/assets/scss/base/_functions.scss" as *;
             @use "@/assets/scss/base/_globals.scss" as *;
             @use "@/assets/scss/base/_utils.scss" as *;
             @use "@/assets/scss/base/_mixins.scss" as *;
             @use "@/assets/scss/base/_normalize.scss" as *;
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
});
