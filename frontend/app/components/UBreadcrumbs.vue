<script setup lang="ts">
import { breadcrumbsTranslations } from '~/locales/breadcrumbs'

interface Props {
  // Промежуточные/текущий элементы крошек (без «Главной» — она рендерится сама)
  items?: { label: string; to?: string }[]
  // Фон — компонент background.background-image из Strapi (webp 1x + avif 2x)
  background?: {
    baseBgImageWebp?: { url?: string } | null
    retinaBgImageAvif?: { url?: string } | null
  } | null
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  background: null,
})

const { currentLocale } = useLocale()
const t = computed(() => breadcrumbsTranslations[currentLocale.value])

// image-set(url(webp) 1x, url(avif) 2x) — как UBackground рендерит фоновые изображения
const backgroundStyle = computed(() => {
  const webp = props.background?.baseBgImageWebp?.url
  const avif = props.background?.retinaBgImageAvif?.url
  if (!webp && !avif) return {}
  const parts: string[] = []
  if (webp) parts.push(`url("${webp}") 1x`)
  if (avif) parts.push(`url("${avif}") 2x`)
  return { backgroundImage: `image-set(${parts.join(", ")})` }
})
</script>

<template>
  <nav class="breadcrumbs" aria-label="Breadcrumb" :style="backgroundStyle">
    <div class="breadcrumbs__container">
      <ol class="breadcrumbs__list">
        <li class="breadcrumbs__item">
          <NuxtLink class="breadcrumbs__link" :to="`/${currentLocale}`">
            {{ t.home }}
          </NuxtLink>
        </li>
        <li v-for="(item, i) in items" :key="i" class="breadcrumbs__item">
          <NuxtLink v-if="item.to" class="breadcrumbs__link" :to="item.to">
            {{ item.label }}
          </NuxtLink>
          <span v-else class="breadcrumbs__current">{{ item.label }}</span>
        </li>
      </ol>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.breadcrumbs {
  padding-block: toRem(16) toRem(20);
  background-size: cover;
  background-position: center;

  &__list {
    display: flex;
    align-items: center;
    gap: toRem(8);
    list-style: none;
    padding: 0;
    margin: 0;
    flex-wrap: wrap;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: toRem(8);
    font-size: toEm(14);

    // Разделитель «>»
    &:not(:last-child)::after {
      content: ">";
      color: var(--gray-color);
      font-size: toEm(13);
      font-weight: 300;
    }
  }

  &__link {
    color: var(--gray-color);
    text-decoration: none;
    font-size: toEm(14);
    transition: color var(--transition-duration);

    @include hover {
      color: var(--success-color);
    }
  }

  &__current {
    color: var(--color);
    font-weight: 600;
    font-size: toEm(14);
  }

  // ==== Адаптив ====
  @media (max-width: $mobile) {
    padding-block: toRem(12) toRem(16);

    &__item {
      font-size: toEm(13);

      &:not(:last-child)::after {
        font-size: toEm(12);
      }
    }

    &__link,
    &__current {
      font-size: toEm(13);
    }
  }

  @media (max-width: $mobileSmall) {
    padding-block: toRem(10) toRem(14);

    &__list {
      gap: toRem(6);
    }

    &__item {
      font-size: toEm(12);

      &:not(:last-child)::after {
        font-size: toEm(11);
      }
    }

    &__link,
    &__current {
      font-size: toEm(12);
    }
  }
}
</style>
