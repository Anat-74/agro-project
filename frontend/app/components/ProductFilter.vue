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
      @include adaptiveValue("height", 46, 42);

      :deep(.u-input__field) {
         width: 100%;
         height: 100%;
         padding-inline-start: toRem(12);
         padding-inline-end: toRem(30);
         border-radius: toRem(25);
         border: toEm(2) solid var(--primary-color);
         font-size: toEm(18);
         color: var(--color);
         background-color: var(--light-color);
         outline: none;
         transition: box-shadow var(--transition-duration), border-color var(--transition-duration);

         &::placeholder {
            color: var(--success-color);
            transition: color var(--transition-duration);
         }

         @include hover {
            &::placeholder {
               color: var(--dark-color);
            }
         }

         &:focus {
            box-shadow: 0 0 0 toRem(4) rgba(39, 76, 91, 0.2);
         }
      }

      :deep(.u-input__label) {
         display: none;
      }
   }

   &-loader {
      position: absolute;
      top: 50%;
      right: toRem(30);   // слева от лупы
      translate: 0 -50%;
      font-size: toRem(25);
      color: var(--sky-blue);
   }

   &-glass {
      position: absolute;
      z-index: 1;
      top: 50%;
      right: toRem(8);
      translate: 0 -50%;
      color: var(--primary-color);
      font-size: toEm(15);
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