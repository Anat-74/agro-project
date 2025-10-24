<script setup lang="ts">
import type { Category } from "@/types/types"
import { visuallyHiddenTranslations } from '~/locales/visuallyHidden'

const { find } = useStrapi()
const { currentLocale } = useLocale()
const { width } = useViewport()
const config = useRuntimeConfig()

const visibleImagesCount = computed(() => {
  if (width.value < 565.98) return 2
  if (width.value < 878.98) return 4
  if (width.value < 1215.98) return 6
  return 10
})

const { data: categories, pending, error } = useAsyncData(
   `category-${currentLocale.value}`,
   async () => {
      const response = await find<Category>('categories', {
      filters: { locale: currentLocale.value },
      populate: {
         image: {
            fields: ["alternativeText", "url"]
         },
         }
      })
      if (!response.data || response.data.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Category - Not Found'
      })
     }
      return response.data
   }
)
</script>

<template>
   <Loader v-if=pending />
   <section class="category"
   aria-labelledby="category-page">
      <h1 
      id="category-page"
      class="visually-hidden">{{ visuallyHiddenTranslations[currentLocale].sectionLangTitle }}</h1>
      <LangSwitcher/>
      <ul class="category__list"
      v-if="categories"
      >
         <li class="category__item"
         v-for="(category, index) in categories"
         :key="category.id"
         >
         <NuxtLink
         class="category__link"
         :to="`/${currentLocale}/${category.slug}`"
         >
         <NuxtImg
         class="category__image"
         :src="`${config.public.strapi.url}${category.image[0]?.url}`"
         :alt="category.name"
         :loading="index < visibleImagesCount ? 'eager' : 'lazy'"
         :fetchpriority="index < visibleImagesCount ? 'high' : 'auto'"
         decoding="async"
         format="webp"
         width="254"
         height="268"
        />
        <h2 class="category__title">{{ category.name }}</h2>
         </NuxtLink>
      </li>
      </ul>
   </section>

   <div v-if="error" class="error">
      {{ error.message }}
    </div>
</template>

<style lang="scss" scoped>
.category {

&__list {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(toRem(262), 1fr));
   justify-items: center;
   row-gap: toEm(27);
   padding-block: toEm(16);
   @include adaptiveValue("column-gap", 64, 7);
}

&__item {
   width: 100%;
   display: grid;
   justify-items: center;
   padding-inline: toEm(16);
   padding-block-start: toEm(7);
   padding-block-end: toEm(16);
   background-color: var(--bg-product);
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
         border-radius: toRem(32);
      }

      .category__title {
         color: var(--danger-hover);
      }
   }
}

&__image {
   transition: border-radius var(--transition-duration);
}

&__title {
   align-self: end;
   text-align: center;
   transition: color var(--transition-duration);
}
}

</style>
