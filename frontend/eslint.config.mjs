// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      // Strapi v5 API динамичен и типы @nuxtjs/strapi слишком строгие для
      // произвольных populate/filters (см. app/stores/useSearchStore.ts).
      // Код осознанно использует any для payload-ов Strapi.
      '@typescript-eslint/no-explicit-any': 'off',
      // Vue 3 поддерживает фрагменты (несколько корневых элементов) в шаблонах.
      'vue/no-multiple-template-root': 'off',
    },
  },
)
