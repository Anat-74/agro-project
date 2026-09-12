<script setup lang="ts">
import { showHamburgerTranslations } from "~/locales/showHamburger";

// Каталог (слайд «Категории»): категории → подкатегории → товары.
// Вынесен из ShowHamburger в отдельный компонент. Клик по товару эмитит
// `navigate` — родитель закрывает диалог (вместо прямого close?.() в шаблоне).
const props = defineProps<{
  category: Category[]
}>()

const emit = defineEmits<{
  navigate: []
}>()

const { currentLocale } = useLocale()
const route = useRoute()
const { getProductLink } = useProductLink()

const showHamburgerT = computed(
  () => showHamburgerTranslations[currentLocale.value],
)

const isActive = (path: string) => route.path === path
</script>

<template>
  <ul v-if="props.category?.length" class="hamburger-catalog">
    <li v-for="cat in props.category" :key="cat.documentId">
      <UAccordion name="faq" variant="default">
        <template #header>
          <UImage
            v-if="cat.image?.url"
            :src="cat.image?.url"
            alt=""
            class="accordion__product-image"
            width="44"
            height="32"
            type="icon"
          />
          <h3
            :class="[
              'accordion__product-title',
              {
                'accordion__product-title_is-active': isActive(
                  `/${currentLocale}/${cat.slug}`,
                ),
              },
            ]"
          >
            {{ cat.name }}
          </h3>
        </template>
        <ul class="accordion__product-list">
          <!-- Подкатегория — вложенный <details>: клик раскрывает её товары, НЕ переходит.
               Своя группа name «faq-{slug}», иначе раскрытие закрывает категорию. -->
          <li
            v-for="sub in cat.subcategories"
            :key="sub.documentId"
            class="accordion__item"
          >
            <UAccordion
              :name="`faq-${cat.slug}`"
              variant="sub"
              :active="isActive(`/${currentLocale}/${cat.slug}/${sub.slug}`)"
            >
              <template #header>
                <UImage
                  v-if="sub.image?.url"
                  :src="sub.image?.url"
                  alt=""
                  class="accordion__product-image"
                  width="44"
                  height="32"
                  type="icon"
                />
                <h4 class="accordion__product-sub-title">{{ sub.name }}</h4>
              </template>
              <ul class="accordion__product-list">
                <li
                  v-for="subProd in sub.products"
                  :key="subProd.documentId"
                  class="accordion__product-item"
                >
                  <NuxtLink
                    :class="[
                      'accordion__product-link',
                      {
                        'accordion__product-link_is-active': isActive(
                          getProductLink(subProd),
                        ),
                      },
                    ]"
                    :to="getProductLink(subProd)"
                    @click="emit('navigate')"
                  >
                    <UImage
                      v-if="subProd.mainImage?.url || subProd.image?.length"
                      :src="subProd.mainImage?.url || subProd.image?.[0]?.url"
                      alt=""
                      class="accordion__product-image-link"
                      width="32"
                      height="32"
                      type="icon"
                    />
                    <h4 class="accordion__product-sub-title">{{ subProd.name }}</h4>
                  </NuxtLink>
                </li>
              </ul>
            </UAccordion>
          </li>

          <!-- Товары, принадлежащие категории напрямую -->
          <li
            v-for="prod in cat.products"
            :key="prod.documentId"
            class="accordion__product-item"
          >
            <NuxtLink
              :class="[
                'accordion__product-link',
                {
                  'accordion__product-link_is-active': isActive(
                    getProductLink(prod),
                  ),
                },
              ]"
              :to="getProductLink(prod)"
              @click="emit('navigate')"
            >
              <UImage
                v-if="prod.mainImage?.url || prod.image?.length"
                :src="prod.mainImage?.url || prod.image?.[0]?.url"
                alt=""
                class="accordion__product-image-link"
                width="32"
                height="32"
                type="icon"
              />
              <h4 class="accordion__product-sub-title">{{ prod.name }}</h4>
            </NuxtLink>
          </li>
        </ul>
      </UAccordion>
    </li>
  </ul>
  <div
    v-else-if="props.category && !props.category.length"
    class="hamburger-catalog__empty"
  >
    {{ showHamburgerT.emptyCategory }}
  </div>
</template>

<style lang="scss" scoped>
// Layout списка категорий (перенесён из ShowHamburger .dialog-hamburger__accordion)
.hamburger-catalog {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  row-gap: toEm(16);

  @media (min-width: $mobile) {
    justify-content: start;
    padding-block-end: toRem(22);
  }

  @media ($mobileSmall <= width <= $mobile) {
    width: 70%;
  }

  &__empty {
    text-align: center;
    padding: toEm(20);
    color: var(--gray-color);
    font-style: italic;
    @include adaptiveValue("font-size", 14, 12);
  }
}
</style>
