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
        width="40"
        height="40"
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
        <!-- <UAnimatedText variant="gradient" /> -->
         <ShowHamburger
          v-if="global"
          class="header__hamburger"
          :phones="global.phones"
          :footer="global.footer"
          :socials="global.socials"
          :global="global"
        />
        <MoreMenu 
        :navigation="global?.header?.navigation"
         />
        <NuxtLink
          v-if="blogLink"
          class="header__blog-link visible-tablet"
          :to="`/${currentLocale}${blogLink.url}`"
        >{{ blogLink.label }}</NuxtLink>
        <BaseNavigation
          v-if="global"
          :phones="global.phones"
          :email="global.email"
          :navigation="global?.header?.navigation"
          class="header__navigation hidden-tablet"
        />
        <!-- <ShowHamburger
          v-if="global"
          :phones="global.phones"
          :footer="global.footer"
          :socials="global.socials"
          :global="global"
        /> -->
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
   // top = минус высота баннера (60 десктоп/планшет, 40 мобилка) — баннер уезжает за экран
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
    @include adaptiveValue("height", 60, 46);
  }

  
  &__logo {
    justify-self: start;
  }

  // ColorMode в шапке: виден на мобилке (утилита visible-tablet),
  // на PC остаётся в баннере
  &__color-mode-wrap {
    justify-self: start;
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: toRem(12);
    @include adaptiveValue("height", 64, 44);

    @media (max-width: $mobile) {
      padding-block: toRem(6);
    }
  }

  &__blog-link {
    font-weight: 600;
    color: var(--danger-color);
    text-decoration: none;
    white-space: nowrap;

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
