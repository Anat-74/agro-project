<script setup lang="ts">
import type { Category, VisibilityState } from "@/types/types";
import { populate } from "dotenv";
import { visuallyHiddenTranslations } from "~/locales/visuallyHidden";
const { isContacts } = inject<VisibilityState>("visible")!;

const { find } = useStrapi();
const { currentLocale } = useLocale();
const { width } = useViewport();

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
}; // почему не вычислительное свойство computed???

//==========================================================

const { data: homePage, refresh } = useAsyncData(`home-page-${currentLocale.value}`, async () => {
  const response = await find("home-page", {
    filters: { locale: currentLocale.value },
    populate: {
       sections: {
          on: {
            'sliders.hero-slider': {
               populate: {
               image: {
               fields: ["alternativeText", "url"],
               },
               bgImage: {
               fields: ["alternativeText", "url"],
                  },
               }
            }
         }
       }
    }
  })

  if (!response) {
    throw createError({statusCode: 404, message: "Home page not found"})
  }
  return response.data;
})

console.debug('Home page data:', homePage.value);

</script>

<template>
  <Loader v-if="pending" />
  <AppSlider
  class="category-slider"
    :slides="[
      { id: 1, content: 'Слайд 1' },
      { id: 2, content: 'Слайд 2' },
      { id: 3, content: 'Слайд 3' },
      { id: 4, content: 'Слайд 4' },
    ]"
  />

  <section 
  class="category" 
  aria-labelledby="category-page"
  >
    <UBackground
      src="avif-image"
      :from-strapi="false"
      class="category__image-background"
    />
      <h1 id="category-page" class="visually-hidden">
      {{ visuallyHiddenTranslations[currentLocale].sectionLangTitle }}
    </h1>
    <div class="category__container">
    <h2 class="category__title">Топ категории</h2>
    <ul class="category__list" v-if="categories">
      <li
        class="category__item"
        v-for="(category, index) in categories"
        :key="category.id"
      >
        <NuxtLink
          class="category__link"
          :class="['category__link', { category__link_blur: isContacts }]"
          :to="getCategoryLink(category)"
        >
          <UImage
            class="category__image"
            v-if="
            category.image
            && category.image.length > 0
            && category.image[0]
            "
            :src="category.image[0].url"
            :alt="category.name"
            :smoothLoad="true"
            :loading="index < visibleImagesCount ? 'eager' : 'lazy'"
            :fetchpriority="index < visibleImagesCount ? 'high' : 'auto'"
            width="94"
            height="94"
          />

          <h3 class="category__card-title">{{ category.name }}</h3>
        </NuxtLink>
      </li>
    </ul>
    </div>
  </section>

  <span v-if="error" class="error">
    {{ error.message }}
  </span>
</template>

<style lang="scss" scoped>
   .category-slider {
   }

.category {
  min-height: var(--min-height);

  &__image-background {
    position: absolute;
    inset: 0;
    z-index: -1;
    width: 100%;
    height: 100%;
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

    &_blur {
      transition: filter var(--transition-duration);
      filter: blur(6px);
    }

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
