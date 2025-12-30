<script setup lang="ts">
import type { Category } from "@/types/types";
import { visuallyHiddenTranslations } from "~/locales/visuallyHidden";

const { find } = useStrapi();
const { currentLocale } = useLocale();
const { width } = useViewport();
const config = useRuntimeConfig();

const visibleImagesCount = computed(() => {
  if (width.value < 565.98) return 2;
  if (width.value < 878.98) return 4;
  if (width.value < 1215.98) return 6;
  return 10;
});

const {
  data: categories,
  pending,
  error,
} = useAsyncData(`category-${currentLocale.value}`, async () => {
  const response = await find<Category>("categories", {
    filters: { locale: currentLocale.value },
    populate: {
      image: {
        fields: ["alternativeText", "url"],
      },
      subcategories: {
        fields: ["id"],
      },
      products: {
        fields: ["id"],
      },
    },
  });
  if (!response.data || response.data.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Category - Not Found",
    });
  }
  return response.data;
});

// Функция для определения типа ссылки для категории
const getCategoryLink = (category: Category) => {
  // Если у категории есть подкатегории, ведем к странице с подкатегориями
  if (category.subcategories && category.subcategories.length > 0) {
    return `/${currentLocale.value}/${category.slug}`;
  }
  // Если у категории есть продукты, ведем к странице с продуктами
  else if (category.products && category.products.length > 0) {
    return `/${currentLocale.value}/${category.slug}/products`;
  }
  // В противном случае ведем к странице категории (где будет отображено, что контента нет)
  else {
    return `/${currentLocale.value}/${category.slug}`;
  }
};
</script>

<template>
  <Loader v-if="pending" />
  <section class="category" aria-labelledby="category-page">
    <h1 id="category-page" class="visually-hidden">
      {{ visuallyHiddenTranslations[currentLocale].sectionLangTitle }}
    </h1>
    <h2 class="category__title">Топ категории</h2>
    <ul class="category__list" v-if="categories">
      <li
        class="category__item"
        v-for="(category, index) in categories"
        :key="category.id"
      >
          <NuxtLink class="category__link" :to="getCategoryLink(category)">
            <UImage
              class="category__image"
              v-if="
                category.image && category.image.length > 0 && category.image[0]
              "
              :src="category.image[0].url"
              :alt="category.name"
              :loading="index < visibleImagesCount ? 'eager' : 'lazy'"
              :fetchpriority="index < visibleImagesCount ? 'high' : 'auto'"
              width="94"
              height="94"
              :smoothLoad="true"
            />

            <h3 class="category__card-title">{{ category.name }}</h3>
          </NuxtLink>
      </li>
    </ul>
  </section>

  <span v-if="error" class="error">
    {{ error.message }}
  </span>
</template>

<style lang="scss" scoped>
.category {
  &__title {
  }

  &__list {
    justify-items: center;
    padding-block: toEm(16);
    @include gridCards;
    @include adaptiveValue("column-gap", 40, 12);
  }

  &__item {
    display: grid;
    justify-items: center;
    padding-inline: toEm(28);
    padding-block-start: toEm(7);
    padding-block-end: toEm(16);
    box-shadow: 0px 1px 2px 0px var(--shadow);
    border-radius: toEm(4);
  }

  &__link {
    min-height: 100%;
    display: grid;
    align-items: center;
    justify-items: center;
    row-gap: toEm(18);
    margin-block-end: toEm(12);

    @include hover {
      .category__image {
        outline: toRem(4) solid var(--secondary-color);
        outline-offset: toEm(4);
        border-radius: toRem(25);
      }

      .category__card-title {
        color: var(--danger-hover);
      }
    }
  }

  &__image {
    max-height: toRem(94);
    object-fit: cover;
    transition: border-radius var(--transition-duration);
  }

  &__card-title {
    align-self: end;
    text-align: center;
    transition: color var(--transition-duration);
  }
}
</style>
