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

// Фон рендерит UBackground (webp 1x + avif 2x через image-set)
const hasBackground = computed(() =>
  !!(props.background?.baseBgImageWebp?.url || props.background?.retinaBgImageAvif?.url),
)
</script>

<template>
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <UBackground
      v-if="hasBackground"
      :src="background?.baseBgImageWebp?.url"
      :retina-src="background?.retinaBgImageAvif?.url"
      variant="clean"
      bg-position="center"
      size-mode="cover"
    />
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
  // (центрируется, ссылки слева внутри). position: relative — якорь для .app-bg.
  position: relative;
  height: toEm(110);
  display: grid;
  align-items: center;
  // Отступ вниз от блока крошек
  margin-block-end: toEm(25);

  &__container {
    // Ширина 100% + box-sizing:border-box перебивают глобальный
    // [class*="__container"] (content-box + padding): иначе паддинги прибавлялись
    // к 100% → контейнер переполнял вьюпорт (горизонтальный скролл).
    // Без width:100% контейнер схлопывался до контента и центрировался — крошки
    // должны оставаться слева, выровненные по контенту контейнера.
    width: 100%;
    box-sizing: border-box;
  }

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
    // +4px к прежнему размеру (было 14)
    font-size: toEm(18);

    // Разделитель «>»
    &:not(:last-child)::after {
      content: ">";
      color: var(--gray-color);
      font-size: toEm(17);
      font-weight: 300;
    }
  }

  &__link {
    color: var(--gray-color);
    text-decoration: none;
    transition: color var(--transition-duration);

    @include hover {
      color: var(--success-color);
    }
  }

  &__current {
    color: var(--color);
    font-weight: 600;
  }

  // ==== Адаптив ====
  @media (max-width: $mobile) {
    height: toEm(50);

    &__item {
      font-size: toEm(17);

      &:not(:last-child)::after {
        font-size: toEm(16);
      }
    }
  }

  @media (max-width: $mobileSmall) {
    height: toEm(44);

    &__list {
      gap: toRem(6);
    }

    &__item {
      font-size: toEm(16);

      &:not(:last-child)::after {
        font-size: toEm(15);
      }
    }
  }
}
</style>
