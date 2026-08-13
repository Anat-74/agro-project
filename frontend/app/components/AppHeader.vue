<script setup lang="ts">
import { nextTick } from 'vue'
import ShowHamburger from '~/components/show-modal/ShowHamburger.vue'
import ShowModalCartDialog from '~/components/show-modal/ShowModalCartDialog.vue'
import ShowModalProduct from '~/components/show-modal/ShowModalProduct.vue'

const { currentLocale } = useLocale()

interface Props {
  global?: GlobalData | null
}

const props = defineProps<Props>()

// Ссылка на «Блог» берётся из Strapi-навигации (label локализуется в CMS),
// рендерится отдельно от меню «Ещё»
const blogLink = computed(() =>
  props.global?.header?.navigation?.find((item) => item.url === '/blog')
)

// Scroll-based bottom nav visibility
const isNavHidden = ref(false)
let lastScrollY = 0
let ticking = false
let currentY = 0

function update() {
  ticking = false

  if (window.innerWidth > 1024) {
    isNavHidden.value = false
    lastScrollY = currentY
    return
  }

  const y = currentY

  if (y > lastScrollY && y > 80) {
    isNavHidden.value = true
  } else if (y < lastScrollY) {
    isNavHidden.value = false
  }

  lastScrollY = y
}

function onScroll() {
  currentY = window.scrollY
  if (!ticking) {
    requestAnimationFrame(update)
    ticking = true
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})

const cartDialogRef = useTemplateRef<InstanceType<typeof ShowModalCartDialog>>('cart-dialog')

// Превью товара из корзины — модалка живёт на уровне Header, как в личном кабинете
const previewProduct = ref<Product | null>(null)
const previewModalRef = useTemplateRef<InstanceType<typeof ShowModalProduct>>('preview-modal')

function openPreview(product: Product) {
  previewProduct.value = product
  nextTick(() => previewModalRef.value?.openModal?.())
}
</script>

<template>
  <header :class="['header']">
    <BannerLayouts
      v-if="global"
      :banner-text="global?.header?.bannerText"
    />
    <div class="header__container-top">
      <ULogo
        v-if="global"
        class="header__logo"
        :global="global"
        width="38"
        height="38"
      />
      <!-- ColorMode из баннера: на мобилке живёт в шапке после логотипа
           (visible-tablet = только на экранах ниже tablet) -->
      <div class="header__color-mode-wrap visible-tablet">
        <ClientOnly>
          <ColorMode class="header__color-mode" />
          <!-- Резервируем место при SSR/гидратации (ползунок 72×28) -->
          <template #fallback>
            <span class="header__color-mode-placeholder" aria-hidden="true" />
          </template>
        </ClientOnly>
      </div>
      <ProductFilter class="header__search" />
      <ChatAssistant />
      <UCartButton class="header__cart" @open="cartDialogRef?.open?.()" />
      <ProfileLink />
    </div>
    <div :class="['header__bottom', { 'header__bottom_hidden': isNavHidden }]">
      <div class="header__container-bottom">
        <ShowHamburger
          v-if="global"
          class="header__hamburger"
          visibility-class="hidden-tablet"
          :phones="global.phones"
          :footer="global.footer"
          :socials="global.socials"
          :global="global"
        />
        <BaseNavigation
          v-if="global"
          :phones="global.phones"
          :email="global.email"
          :navigation="global?.header?.navigation"
          class="header__navigation hidden-tablet"
        />
        <MoreMenu
          :navigation="global?.header?.navigation"
        />
        <NuxtLink
          v-if="blogLink"
          class="header__blog-link visible-tablet"
          :to="`/${currentLocale}${blogLink.url}`"
        >
          {{ blogLink.label }} <Icon name="ph:newspaper" />
        </NuxtLink>
        <ShowHamburger
          v-if="global"
          class="header__hamburger"
          visibility-class="visible-tablet"
          :phones="global.phones"
          :footer="global.footer"
          :socials="global.socials"
          :global="global"
        />
      </div>
    </div>
  </header>
  <ShowModalCartDialog ref="cart-dialog" @preview="openPreview" />
  <!-- Без v-if: инстанс всегда смонтирован → ref доступен, openModal() срабатывает надёжно -->
  <ShowModalProduct
    ref="preview-modal"
    :product="previewProduct"
    hide-trigger
  />
</template>

<style lang="scss" scoped>
.header {
  @media (max-width: $tablet) {
    position: sticky;
    z-index: 998;
   // top = минус высота баннера (60 планшет / 40 мобилка) — при скролле скрывается
   // ТОЛЬКО баннер, container-top остаётся полностью видимым
   @include adaptiveValue("top", -60, -40);
  }

  &__container-top {
    position: relative;
    z-index: 10;
    display: grid;
    grid-template-columns: repeat(2, auto) 1fr repeat(3, auto);
    align-items: center;
    column-gap: toRem(16);
    padding-block: toEm(16);
    // Матовое стекло (glassmorphism): полупрозрачный фон темы + blur.
    // Контент проезжает под sticky-шапкой и красиво матируется.
    background: var(--bg);   // fallback при не-поддержке color-mix/backdrop-filter
    @include colorMix($mix-color: transparent, $ratio: 70%);
    backdrop-filter: blur(toRem(12));
    // Hairline-разделитель, отделяющий шапку от контента
    border-bottom: toRem(1) solid transparent;
    @include colorMix($property: border-bottom-color, $base-color: var(--color), $mix-color: transparent, $ratio: 12%);
    @include adaptiveValue("height", 52, 38);   // ещё на 4px ниже (было 56/42)
  }

  
  &__logo {
    justify-self: start;
  }

  // ColorMode в шапке: виден на мобилке (утилита visible-tablet),
  // на PC остаётся в баннере
  &__color-mode-wrap {
    justify-self: start;
    // Появление (blur): width анимируется С ЗАДЕРЖКОЙ (0.2s = длительность сворачивания поиска),
    // чтобы поиск успел сжаться; opacity фейдится сразу.
    // Иначе мгновенный возврат width конфликтует с ещё расширенным поиском → дёргание
    transition:
      opacity var(--transition-duration),
      width var(--transition-duration) var(--transition-duration);
  }

  // При фокусе поиска цветMode плавно исчезает (схлопывается) — освобождает
  // колонку (~72px), поиск (1fr) расширяется на полные 108px без сдвига правых элементов.
  // width здесь МГНОВЕННЫЙ (переопределяем transition), opacity фейдится
  &__container-top:has(.header__search:focus-within) &__color-mode-wrap {
    transition: opacity var(--transition-duration);
    opacity: 0;
    width: 0;
    overflow: hidden;
    pointer-events: none;
  }

  &__color-mode {
    opacity: 0;
    animation: fadeIn 0.3s ease-in-out 0.1s forwards;
  }

  // Заглушка под colorMode (размеры совпадают с ползунком 72×28)
  &__color-mode-placeholder {
    width: toRem(72);
    height: toRem(28);
  }

  &__bottom {
    position: relative;
    z-index: 1;
    background-color: var(--bg-navigation);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;

    &_hidden {
      transform: translateY(-100%);
      opacity: 0;
      pointer-events: none;
    }
  }

  &__hamburger{

  }

  &__search {
    justify-self: end;
  }

  &__cart {
    translate: 0 toRem(3);
  }

  &__container-bottom {
    display: grid;
    // Mobile-first: базовая сетка = мобильная (MoreMenu | блог | каталог).
    // Каталог — последний в DOM (мобильный экземпляр) → колонка 1fr, справа.
    grid-template-columns: auto auto 1fr;
    align-items: center;
    column-gap: toRem(12);
    padding-block: toRem(6);
    @include adaptiveValue("height", 64, 44);

    // Десктоп: каталог (первый в DOM, слева) | навигация (1fr).
    // MoreMenu/Блог скрыты visible-tablet, навигация видна (hidden-tablet)
    @media (min-width: $tablet) {
      grid-template-columns: auto 1fr;
      padding-block: 0;
    }

    // Каталог в правый угол мобильной колонки (1fr) — корень .hamburger теперь единый grid-элемент
    :deep(.hamburger) {
      justify-self: end;
    }
  }

  &__blog-link {
    display: inline-flex;
    align-items: center;
    gap: toRem(4);
    font-weight: 600;
    color: var(--danger-color);
    text-decoration: none;
    white-space: nowrap;
    @include adaptiveValue("font-size", 19, 16);   // на 1px меньше

    @include hover {
      text-decoration: underline;
    }
  }

  &__navigation {
    justify-self: end;
  }
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}
</style>
