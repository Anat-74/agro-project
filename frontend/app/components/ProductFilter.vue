<script setup lang="ts">
import { productFilterTranslations } from '~/locales/productFilter'
const { currentLocale } = useLocale()
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

const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
  debounced.cancel = () => clearTimeout(timeoutId)
  return debounced
}


// Дебаунс для поиска
const applyFilters = () => {
  searchStore.executeSearch()
}

// Создаем debounce-версию с задержкой 400 мс
const debouncedApplyFilters = debounce(applyFilters, 400)

// watch([searchName, sortBy], debouncedApplyFilters)
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
  <label 
   class="visually-hidden"
   for="my-search"
   > {{ productFilterTranslations[currentLocale].labelInput }}
</label>
    <input 
      v-model="searchName" 
      :placeholder="productFilterTranslations[currentLocale].placeholder"
      class="search-input"
      type="search"
      id="my-search"
    >
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
   {{ productFilterTranslations[currentLocale].noResults }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.search {
   &-body {
      position: relative;
      display: flex;
      align-items: center;
      @include adaptiveValue("height", 44, 40);

         &::after {
         content: '';
         position: absolute;
         right: 0;
         width: toRem(55);
         height: 100%;
         border-radius: 0 toRem(25) toRem(25) 0;
         background-color: var(--success-color);
      }
   }

   &-input {
      position: relative;
      width: 100%;
      height: 100%;
      padding-inline-start: toRem(42);
      border-radius: toEm(25);
      border: toRem(2) solid whitesmoke;
      font-size: toEm(18);
      color: var(--color);
      background-color: var(--light-color);

      &::placeholder {
      color: var(--success-color);
      transition: color var(--transition-duration);
    }

      @include hover {
      &::placeholder {
        color: var(--dark-color);
      }
    }
   }

   &-loader {
      position: absolute;
      top: 50%;
      right: toRem(222);
      translate: 0 -50%;
      font-size: toRem(25);
      color: var(--sky-blue);
   }

   &-glass {
      position: absolute;
      z-index: 999;
      top: 50%;
      right: toRem(16);
      translate: 0 -50%;
      color: var(--light-color);
      font-size: toRem(25);
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