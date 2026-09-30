<script setup lang="ts">
import CalcPage from "~/components/CalcPage.vue";
import { gardenTranslations } from "~/locales/garden";
import { GARDEN_SECTION } from "~/utils/calcSections";
import { GARDEN_MODES } from "~~/shared/utils/garden-modes";

// Хаб-страница раздела «Всё для посадки и урожая»: разметка и SEO — в CalcPage,
// здесь только конфигурация «Посадки»
const { currentLocale } = useLocale();

// ≤ $tablet: калькулятор открывается в панели каталога (вкладка «Посадка»),
// а не дублируется на странице — запрос обрабатывает AppHeader
const { requestOpen } = useGardenDialog();

const modeKeys = GARDEN_MODES.map((mode) => mode.key);
</script>

<template>
  <CalcPage
    page-endpoint="calculator-page"
    :section="GARDEN_SECTION"
    :texts="gardenTranslations[currentLocale]"
    items-endpoint="crops"
    articles-relation="crops"
    :mode-keys="modeKeys"
    :request-panel="requestOpen"
    items-link-base="/posadka-i-urozhay"
  />
</template>
