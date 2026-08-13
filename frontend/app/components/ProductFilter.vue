<script setup lang="ts">
import { productFilterTranslations } from '~/locales/productFilter'
const { currentLocale } = useLocale()
const t = computed(() => productFilterTranslations[currentLocale.value])
const route = useRoute()
const searchStore = useSearchStore()
const { products, status, hasSearched } = storeToRefs(searchStore)

// Функция для форматирования каждого слова с заглавной буквы
const capitalizeEachWord = (str: string) => {
  if (!str) return ''
  
  return str
    .split(/\s+/) // Разбиваем по любому количеству пробелов
    .map(word => {
      if (!word) return ''
      
      // Обработка составных слов через дефис
      if (word.includes('-')) {
        return word.split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join('-')
      }
      
      // Обычные слова
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

// Полная синхронизация с хранилищем
const searchName = computed({
  get: () => searchStore.filters.name,
  set: value => {
    // Автоматически делаем первую букву заглавной
    if (value.length > 0) {
      searchStore.filters.name = capitalizeEachWord(value)
    } else {
      searchStore.filters.name = value
    }
  }
})

const sortBy = computed({
  get: () => searchStore.filters.sort,
  set: value => searchStore.filters.sort = value
})

// Автоматический сброс при переходе на товар
watch(() => route.params.productSlug, (newSlug) => {
  if (newSlug) {
    searchStore.resetFilters()
    // Принудительный триггер обновления
    searchName.value = ''
    sortBy.value = ''
  }
})

const applyFilters = () => {
  searchStore.executeSearch()
}

const debouncedApplyFilters = useDebounce(applyFilters, 400)

watch([searchName, sortBy], () => {
  debouncedApplyFilters()
})

onUnmounted(() => {
  debouncedApplyFilters.cancel()
})
</script>

<template>
  <div
  class="search-body" 
   role="search"
  >
    <UInput
      v-model="searchName"
      type="search"
      :placeholder="t.placeholder"
      :aria-label="t.labelInput"
    />
      <Icon
   v-if="status === 'pending'"
   name="eos-icons:bubble-loading" 
   class="search-loader"
   />

   <Icon
   name="ph:magnifying-glass-light"
   class="search-glass"
   />
   <span 
    v-if="hasSearched && products.length === 0 && status !== 'pending'"
   class="search-no-results">
   {{ t.noResults }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.search {
   &-body {
      position: relative;
      display: flex;
      align-items: center;
      width: toRem(33);
      height: toRem(33);   // на 1px ниже (было 34), круг сохраняется
      transition: width var(--transition-duration);

      // Круг расширяется в пилюлю при фокусе/вводе
      &:focus-within {
         width: toRem(108);
      }

      :deep(.u-input) {
         width: 100%;
         height: 100%;
      }

      :deep(.u-input__wrapper) {
         height: 100%;   // без этого инпут схлопывается по высоте → овал и смещённая лупа
      }

      :deep(.u-input__field) {
         width: 100%;
         height: 100%;
         min-width: 0;
         appearance: none;   // убирает браузерный searchfield-стайлинг (доп. ширина/кнопка очистки)
         -webkit-appearance: none;
         padding: 0;
         padding-inline-start: toRem(30);   // бордер(2+2)+padding ≤ 36, иначе Chrome расширяет бокс → овал; 30 очищает лупу (заканчивается ~27.5px)
         border-radius: 50%;
         border: toRem(2) solid var(--primary-color);   // толще на 1px (было toEm(2)≈1px)
         font-size: toEm(14);
         color: var(--color);
         background-color: var(--light-color);
         outline: none;
         transition: border-radius var(--transition-duration), box-shadow var(--transition-duration);

         // Цвет фокус-кольца считает миксин (в CSS-переменную) — без прямого color-mix
         @include colorMix(
            $property: --focus-ring-color,
            $base-color: var(--primary-color),
            $mix-color: transparent,
            $ratio: 20%
         );

         &::placeholder {
            color: transparent;   // текст в поле не нужен — набранное видно в оверлее
         }

         &:focus {
            border-radius: toRem(20);
            box-shadow: 0 0 0 toRem(4) var(--focus-ring-color);
         }
      }

      :deep(.u-input__label) {
         display: none;
      }
   }

   &-loader {
      position: absolute;
      top: 50%;
      right: toRem(14);
      translate: 0 -50%;
      font-size: toRem(20);
      color: var(--sky-blue);
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--transition-duration);
   }

   .search-body:focus-within &-loader {
      opacity: 1;
   }

   &-glass {
      position: absolute;
      z-index: 1;
      top: 50%;
      left: toRem(16.5);   // центр круга 33px (33/2); при расширении остаётся слева
      translate: -50% -50%;
      color: var(--primary-color);
      font-size: toEm(20);
      pointer-events: none;
   }

   &-no-results {
      white-space: nowrap;
      position: absolute;
      left: 50%;
      translate: -50% 0;
      bottom: toRem(-22);
      font-weight: 600;
      color: var(--primary-color);
   }
}
</style>