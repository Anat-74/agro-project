<script setup lang="ts">
import { buttonTranslations } from '~/locales/button'

const route = useRoute();
const { currentLocale } = useLocale()

interface PropsPagination {
  page: number;
  pageCount: number;
  routeName: string;
}

const props = defineProps<PropsPagination>();

// Генерируем массив страниц для отображения
const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 7; // Максимальное количество видимых страниц
  let start = Math.max(1, props.page - Math.floor(maxVisible / 2));
  const end = Math.min(props.pageCount, start + maxVisible - 1);
  
  start = Math.max(1, end - maxVisible + 1);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

const getPageLink = (newPage: number) => {
  return {
    name: props.routeName,
    params: route.params,
    query: { ...route.query, page: newPage }
  };
};
</script>

<template>
  <div class="pagination">
    <template v-for="pageNum in visiblePages" :key="pageNum">
      <NuxtLink
        v-if="pageNum !== page"
        :to="getPageLink(pageNum)"
        class="pagination__number"
        :aria-label="buttonTranslations[currentLocale].ariaLabelPagination"
      >
        {{ pageNum }}
      </NuxtLink>
      <span v-else class="pagination__number pagination__number_active">
        {{ pageNum }}
      </span>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.pagination {
  display: flex;
  gap: toEm(6);
  align-items: center;
  justify-content: center;
  padding-block-start: toEm(25);

&__number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: toEm(27);
  height: toEm(24);
  border-radius: toEm(6);
  transition: all var(--transition-duration);

  &_active {
   background-color: var(--blue-color);
   color: var(--light-color);
   font-weight: 600;
  }

  @include hover {
   &:not(.pagination__number_active) {
      background-color: var(--border-color);
    }
   }
  }
}
</style>