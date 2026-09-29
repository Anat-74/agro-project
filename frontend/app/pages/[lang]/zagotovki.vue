<script setup lang="ts">
import CalcPage from "~/components/CalcPage.vue";
import { preservesTranslations } from "~/locales/garden";
import { PRESERVES_SECTION } from "~/utils/calcSections";
import { usePreservesDialog } from "~/composables/useGardenDialog";
import { PRESERVES_MODES } from "~~/shared/utils/preserves-modes";

// Хаб-страница раздела «Заготовки»: разметка и SEO — в CalcPage, здесь только
// конфигурация заготовок
const { currentLocale } = useLocale();

// ≤ $tablet: калькулятор открывается в панели каталога на слайде «Заготовки»
const { requestOpen } = usePreservesDialog();

const modeKeys = PRESERVES_MODES.map((mode) => mode.key);
</script>

<template>
  <CalcPage
    page-endpoint="preserve-page"
    :section="PRESERVES_SECTION"
    :texts="preservesTranslations[currentLocale]"
    items-endpoint="preserves"
    articles-relation="preserves"
    :mode-keys="modeKeys"
    :request-panel="requestOpen"
  />
</template>
