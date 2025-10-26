require('dotenv').config()

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
   devtools: {
      enabled: true,
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
    "@nuxtjs/dotenv",
  ],
  nitro: {
    storage: {
      // Кэширование оптимизированных изображений
      'cache:nuxt-image': {
        driver: 'fs',
        base: './node_modules/.cache/nuxt-image'
      }
    },
    prerender: {
      ignore: ['/sitemap.xml']
    }
  },
   // @ts-ignore
   site: {
     url: process.env.SITE_URL,
     name: 'Awesome Site',
     description: 'Welcome to my awesome site!'
   },
   // @ts-ignore
   sitemap: {
     sources: ['/api/__sitemap__/urls']
   },
   // @ts-ignore
   robots: {
     blockAiBots: true,
     disallow: ['/admin'],
     groups: [
       {
         userAgent: ['Yandex'],
         cleanParam: ['sort', 'filter', 'page', 'search']
       }
     ]
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

    // Главная страница - ISR с кэшем 30 мин на CDN
    "/ru": { isr: 1800 },

    // Статические страницы
    "/ru/about": { prerender: true },
    "/ru/services": { prerender: true },
    "/ru/contacts": { prerender: true },

    // Категории - ISR для баланса скорости и свежести
    "/ru/**": { isr: 3600 },

    // Товары - SWR для обновления в фоне при изменениях
    "/ru/*/*": {
      cache: {
        maxAge: 600,
        swr: true,
        staleMaxAge: 3600,
      },
    },

    // Описание товара - как товары
    "/ru/*/*/*": {
      cache: {
        maxAge: 600,
        swr: true,
        staleMaxAge: 3600,
      },
    },
    
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
    public: {
      siteUrl: process.env.SITE_URL,
      strapi: {
        url: process.env.NUXT_PUBLIC_STRAPI_URL,
      },
    },
  },
  image: {
      domains: ["api.vh324.by3020.ihb.by"],
         // domains: ["127.0.0.1:1337"],
    screens: {
      xs: 320,
      sm: 480,
      md: 768,
      lg: 1024,
      xl: 1630,
    },
    quality: 85,
    densities: [1, 2],
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
    //    collections: [
    //       'material-symbols',
    //       'eos-icons',
    //       'ph',
    //       'cil',
    //       'fa-brands',
    //       'emojione',
    //       'emojione-v1',
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
  css: ["~/assets/scss/styles.scss"],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
             @use "@/assets/scss/base/_container.scss" as *;
             @use "@/assets/scss/base/_fonts.scss" as *;
             @use "@/assets/scss/base/_functions.scss" as *;
             @use "@/assets/scss/base/_globals.scss" as *;
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
});
