<script setup lang="ts">
import { cartTranslations } from "~/locales/cart";
import { discountProductTranslations } from "~/locales/discountProduct";
import { buttonTranslations } from "~/locales/button";

import { orderSuccessTranslations } from "~/locales/orderSuccess";

const { currentLocale } = useLocale();
const cartT = computed(() => cartTranslations[currentLocale.value])
const discountT = computed(() => discountProductTranslations[currentLocale.value])
const buttonT = computed(() => buttonTranslations[currentLocale.value])
const route = useRoute();
const cartStore = useCartStore();
const { goBack } = useGoToForwardOrBack();
const { find } = useStrapi();
const config = useRuntimeConfig();

watchEffect(() => {
  useSeoMeta({
    title: cartT.value.title,
    ogTitle: cartT.value.title,
    description: cartT.value.description,
    ogDescription: cartT.value.description,
    ogUrl: `${config.public.siteUrl}${route.fullPath}`,
  });
});

const productKey = computed(() => `product-discount-${currentLocale.value}`)

const { data: product } = useAsyncData(
  productKey,
  async () => {
    const response = await find<Product>("products", {
      filters: {
        isDiscount: true,
        locale: { $eq: currentLocale.value },
      },
      pagination: {
        pageSize: 100,
      } as PaginationMeta,
      populate: {
        image: {
          fields: ["alternativeText", "url"],
        },
        subcategory: {
          fields: ["name", "slug"],
          populate: {
            category: {
              fields: ["name", "slug"],
            },
          },
        },
      },
    } as any);

    return response.data || [];
  },
);

const showOrderSuccess = ref(false);

const successTitle = ref("");
const successNotice = ref("");
const successThanks = ref("");
const orderTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const handleOrderSuccess = (orderId: number) => {
  const translations = orderSuccessTranslations[currentLocale.value];
  successTitle.value = translations.title.replace("{orderId}", orderId.toString());
  successNotice.value = translations.notice;
  successThanks.value = translations.thanks;
  showOrderSuccess.value = true;

  orderTimer.value = setTimeout(() => {
    showOrderSuccess.value = false;
    orderTimer.value = null;
  }, 7000);
};

onUnmounted(() => {
  if (orderTimer.value) {
    clearTimeout(orderTimer.value);
    orderTimer.value = null;
  }
});

onMounted(() => {
  cartStore.loadCart();
});
</script>

<template>
  <div class="cart-page" aria-labelledby="cart-title">
    <h1 id="cart-title" class="visually-hidden">
      {{ cartT.visuallyHidden }}
    </h1>

    <UButton
      icon="material-symbols:arrow-back"
      :aria-label="buttonT.ariaLabelGoBack"
      variant="go-forward-back"
      class="cart-page__back"
      @click="goBack"
    />

    <!-- Пустая корзина -->
    <div v-if="cartStore.totalItems === 0" class="cart-empty">
      <div class="cart-empty__content">
        <div class="cart-empty__icon-wrap">
          <Icon name="mingcute:shopping-bag-2-line" class="cart-empty__icon" />
        </div>
        <h2 class="cart-empty__title">{{ cartT.cartEmpty }}</h2>
        <p class="cart-empty__sub">{{ cartT.cartEmptySub }}</p>
        <NuxtLink
          :to="`/${currentLocale}`"
          class="cart-empty__cta"
        >
          {{ cartT.cartEmptyCta }}
        </NuxtLink>
      </div>

      <section v-if="product?.length" class="cart-recommend">
        <div class="cart-recommend__header">
          <Icon name="mdi:fire" class="cart-recommend__fire" />
          <h3 class="cart-recommend__title">{{ discountT.discount }}</h3>
        </div>
        <div class="cart-recommend__grid">
          <NuxtLink
            v-for="prod in product"
            :key="prod.documentId"
            :to="`/${currentLocale}/${prod?.subcategory?.category?.slug}/${prod?.subcategory?.slug}/${prod.slug}`"
            class="cart-recommend__card"
          >
            <UImage
              v-if="prod.mainImage?.url || prod.image?.length"
              :src="prod.mainImage?.url || prod.image?.[0]?.url"
              :alt="prod.name"
              width="200"
              height="150"
              type="product"
              class="cart-recommend__image"
            />
            <span class="cart-recommend__name">{{ prod.name }}</span>
            <span class="cart-recommend__price">{{ formatPrice(prod.price) }}</span>
          </NuxtLink>
        </div>
      </section>
    </div>

    <!-- Корзина с товарами -->
    <div v-else class="cart-body">
      <div class="cart-body__items">
        <div class="cart-body__header">
          <h2 class="cart-body__title">{{ cartT.title }}</h2>
          <span class="cart-body__count">
            {{ cartT.total }}
            <b>{{ cartStore.totalItems }}</b>
          </span>
        </div>
        <CartShopping class="cart-body__list" />
      </div>

      <OrderForm
        class="cart-body__order"
        @order-success="handleOrderSuccess"
      />

      <!-- Рекомендации, если есть товары со скидкой -->
      <section v-if="product?.length" class="cart-recommend cart-recommend_inline">
        <div class="cart-recommend__header">
          <Icon name="mdi:fire" class="cart-recommend__fire" />
          <h3 class="cart-recommend__title">{{ cartT.recommendTitle }}</h3>
        </div>
        <div class="cart-recommend__grid">
          <NuxtLink
            v-for="prod in product"
            :key="prod.documentId"
            :to="`/${currentLocale}/${prod?.subcategory?.category?.slug}/${prod?.subcategory?.slug}/${prod.slug}`"
            class="cart-recommend__card"
          >
            <UImage
              v-if="prod.mainImage?.url || prod.image?.length"
              :src="prod.mainImage?.url || prod.image?.[0]?.url"
              :alt="prod.name"
              width="200"
              height="150"
              type="product"
              class="cart-recommend__image"
            />
            <span class="cart-recommend__name">{{ prod.name }}</span>
            <span class="cart-recommend__price">{{ formatPrice(prod.price) }}</span>
          </NuxtLink>
        </div>
      </section>
    </div>

    <AppNotification
      v-if="showOrderSuccess"
      type="success"
      @close="showOrderSuccess = false"
    >
      <div>
        <p>{{ successTitle }}</p>
        <p>{{ successNotice }}</p>
        <p>{{ successThanks }}</p>
      </div>
    </AppNotification>
  </div>
</template>

<style lang="scss" scoped>
.cart-page {
  padding-block: toRem(40);
  padding-inline: toRem(16);

  @media (max-width: $mobileSmall) {
    padding-block: toRem(24);
  }

  &__back {
    margin-block-end: toRem(24);
  }
}

// ====== Empty cart ======

.cart-empty {
  max-width: toRem(600);
  margin-inline: auto;
  text-align: center;
  display: grid;
  gap: toRem(40);

  &__content {
    display: grid;
    gap: toRem(16);
    justify-items: center;
    padding: toRem(48) toRem(24);
    background: var(--bg-secondary);
    border-radius: toRem(16);
  }

  &__icon-wrap {
    width: toRem(80);
    height: toRem(80);
    border-radius: 50%;
    background: var(--primary-color);
    display: grid;
    place-items: center;
  }

  &__icon {
    font-size: toRem(36);
    color: #fff;
  }

  &__title {
    font-weight: 700;
    @include adaptiveValue("font-size", 24, 20);
    margin: 0;
  }

  &__sub {
    color: var(--text-muted);
    font-size: toRem(15);
    margin: 0;
    line-height: 1.5;
    max-width: toRem(360);
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    padding: toRem(12) toRem(28);
    border-radius: toRem(8);
    background: var(--primary-color);
    color: #fff;
    font-weight: 600;
    font-size: toRem(15);
    text-decoration: none;
    transition: background var(--transition-duration);

    @include hover {
      background: var(--primary-hover);
    }
  }
}

// ====== Recommendations ======

.cart-recommend {
  &__header {
    display: flex;
    align-items: center;
    gap: toRem(8);
    margin-block-end: toRem(20);
  }

  &__fire {
    font-size: toRem(24);
    color: var(--warning-color);
  }

  &__title {
    font-weight: 600;
    @include adaptiveValue("font-size", 20, 18);
    margin: 0;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(toRem(180), 1fr));
    gap: toRem(16);

    @media (max-width: $mobileSmall) {
      grid-template-columns: repeat(2, 1fr);
      gap: toRem(12);
    }
  }

  &__card {
    display: grid;
    gap: toRem(8);
    padding: toRem(12);
    background: var(--bg-secondary);
    border-radius: toRem(10);
    text-decoration: none;
    color: var(--color);
    transition: background var(--transition-duration), transform var(--transition-duration);
    @include containerParent(product, inline-size);

    @include hover {
      background: var(--bg-hover);
      transform: translateY(-2px);
    }
  }

  &__image {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: contain;
    border-radius: toRem(6);
  }

  &__name {
    font-weight: 500;
    font-size: toRem(14);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__price {
    font-weight: 700;
    color: var(--primary-color);
    font-size: toRem(16);
  }

  // Встроенные рекомендации (когда корзина не пуста)
  &_inline {
    margin-block-start: toRem(40);
    padding-block-start: toRem(32);
    border-block-start: 1px solid var(--border-color);
  }
}

// ====== Cart body (with items) ======

.cart-body {
  display: grid;
  gap: toRem(32);
  max-width: toRem(1100);
  margin-inline: auto;

  @media (min-width: $tablet) {
    grid-template-columns: 1fr toRem(340);
    grid-template-areas:
      "items order"
      "recommend recommend";
  }

  &__items {
    @media (min-width: $tablet) {
      grid-area: items;
    }

    padding: toRem(20);
    background: var(--bg-secondary);
    border-radius: toRem(12);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-block-end: toRem(16);
  }

  &__title {
    font-weight: 700;
    @include adaptiveValue("font-size", 22, 18);
    margin: 0;
  }

  &__count {
    font-size: toRem(14);
    color: var(--text-muted);

    b {
      font-size: toRem(18);
      color: var(--color);
    }
  }

  &__order {
    @media (min-width: $tablet) {
      grid-area: order;
    }
  }
}
</style>
