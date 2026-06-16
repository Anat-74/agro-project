<script setup lang="ts">
import { cartTranslations } from "~/locales/cart";
import { orderSuccessTranslations } from "~/locales/orderSuccess";
import { discountProductTranslations } from "~/locales/discountProduct";
import { buttonTranslations } from "~/locales/button";

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
    ogImage: `${config.public.siteUrl}/image/cart-share-image.jpg`,
    ogUrl: `${config.public.siteUrl}${route.fullPath}`,
    twitterCard: "summary_large_image",
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

// Добавляем состояние для сообщения об успехе
const showOrderSuccess = ref(false);

const successTitle = ref("");
const successNotice = ref("");
const successThanks = ref("");
const orderTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const handleOrderSuccess = (orderId: number) => {
  const translations = orderSuccessTranslations[currentLocale.value];
  successTitle.value = translations.title.replace(
    "{orderId}",
    orderId.toString(),
  );
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
  <section
    :class="['cart-page', { 'cart-page_empty': cartStore.totalItems === 0 }]"
    aria-labelledby="cart-page"
  >
    <h1 class="visually-hidden" id="cart-page">
      {{ cartT.visuallyHidden }}
    </h1>

    <UButton
      @click="goBack"
      icon="material-symbols:arrow-back"
      :aria-label="buttonT.ariaLabelGoBack"
      variant="go-forward-back"
      class="cart-page__go-back"
    />
    <div
      v-if="cartStore.totalItems === 0"
      class="cart-page__cart-empty cart-empty"
    >
      <div class="cart-empty__body">
        <ul class="cart-empty__list">
          <li class="cart-empty__item">
            <UImage
              src="/image/valberg_new-removebg-preview.png"
              alt="valberg"
              width="122"
              :fromStrapi="false"
            />
          </li>
          <li class="cart-empty__item">
            <UImage
              src="/image/aiko_new_1-removebg-preview.png"
              alt="aiko"
              width="122"
              :fromStrapi="false"
            />
          </li>
          <li class="cart-empty__item">
            <UImage
              src="/image/praktik_profi_rgb-removebg-preview.png"
              alt="praktik profi"
              width="122"
              :fromStrapi="false"
            />
          </li>
          <li class="cart-empty__item">
            <UImage
              src="/image/praktik-home_rgb-removebg-preview.png"
              alt="praktik home"
              width="122"
              :fromStrapi="false"
            />
          </li>
        </ul>
      </div>
      <div class="cart-empty__image">
        <UImage
          src="/image/cart-empty-img.png"
          alt="empty cart"
          width="286"
          height="144"
          :fromStrapi="false"
        />
        <span class="cart-empty__text">{{
          cartT.cartEmpty
        }}</span>
      </div>
    </div>

    <div class="cart-page__body">
      <div class="cart-page__cart-items">
        <h2 class="cart-page__title">
          {{ cartT.title }}
        </h2>
        <span
          aria-atomic="true"
          aria-live="polite"
          role="status"
          class="cart-page__total"
        >
          {{ cartT.total }}
          <b>{{ cartStore.totalItems }}</b>
        </span>

        <CartShopping class="cart-page__products" />

        <ul
          v-if="cartStore.totalItems === 0"
          class="cart-page__discount-card discount-card"
        >
          <li
            class="discount-card__item"
            v-for="prod in product"
             :key="prod.documentId"
          >
            <span class="discount-card__promotional">
              <Icon name="mdi:discount-outline" />
              {{ discountT.discount }}
            </span>
            <ProductStatus :product="prod" class="discount-card__in-stock" />
            <NuxtLink
              class="discount-card__link"
              :to="`/${currentLocale}/${prod?.subcategory?.category?.slug}/${prod?.subcategory?.slug}/${prod.slug}`"
            >
              <UImage
                class="discount-card__image"
                v-if="prod.mainImage?.url || prod.image?.length"
                :src="prod.mainImage?.url || prod.image?.[0]?.url"
                :alt="prod.name"
                width="240"
                height="180"
                type="discount-content"
              />
            </NuxtLink>
            <h3 class="discount-card__title">{{ prod.name }}</h3>
            <span class="discount-card__price">{{
              formatPrice(prod.price)
            }}</span>
          </li>
        </ul>
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
      <OrderForm
        class="cart-page__order-form"
        @order-success="handleOrderSuccess"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped>
$shadow-cart-body:
  0px 4px 4px 5px rgba(30, 33, 44, 0.05),
  0px 12px 10px -9px rgba(30, 33, 44, 0.08),
  0px 26px 24px -120px rgba(30, 33, 44, 0.1),
  0px 30px 0px -99px rgba(30, 33, 44, 0.16);

$shadow-cart-items:
  0px 4px 4px -4px rgba(30, 33, 44, 0.05),
  0px 12px 10px -6px rgba(30, 33, 44, 0.08),
  0px 26px 24px -10px rgba(30, 33, 44, 0.1),
  0px 30px 120px -90px rgba(30, 33, 44, 0.16);

.cart-empty {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding-block-start: toEm(58);

  > * { min-width: 0; }

  &__body {
    min-height: 100%;
    display: grid;
    align-items: center;
    padding-inline: toEm(18);
    padding-block: toEm(12);
    border-radius: toRem(6) toRem(6) 0 0;
    background-color: var(--secondary-color);
    box-shadow: $shadow-cart-body;
  }

  &__list {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    justify-items: center;
    align-items: center;
    column-gap: toEm(18);
    row-gap: toEm(12);
    padding-inline: toEm(9);
    padding-block: toEm(12);
    border-radius: toRem(4);
    background-color: var(--bg);

    @media (max-width: toEm(530)) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__item {
    padding-inline: toEm(4);
    border-radius: toRem(4);
    background-color: var(--light-color);

    &:not(:first-child) {
      padding-block: toEm(6);
    }

    @media (max-width: $mobile) {
      max-width: toRem(99);
    }
  }

  &__image {
    display: grid;
    justify-items: center;

    @media (max-width: $tablet) {
      display: none;
    }
  }

  &__text {
    font-size: toEm(22);
    font-weight: 600;
    letter-spacing: toRem(1.2);
    color: var(--warning-color);
  }
}

.cart-page {
  position: relative;

  > * { min-width: 0; }

  &_empty {
    .cart-page__body {
      padding-block-start: toEm(12);
    }

    .cart-page__cart-items {
      border-radius: 0 0 toRem(6) toRem(6);
    }
  }

  &__go-back {
    position: absolute;
    top: toRem(12);
    left: 0;
  }

  &__body {
    display: grid;
    grid-template-columns: 1fr auto;
    column-gap: toEm(22);
    padding-block-start: toEm(58);
    padding-block-end: toEm(32);

    @media (max-width: $tablet) {
      grid-template-columns: 1fr;
      row-gap: toEm(32);
      column-gap: 0;
    }
  }

  &__cart-items {
    padding-inline: toEm(16);
    padding-block: toEm(16);
    border-radius: toEm(6);
    background-color: var(--secondary-color);
    box-shadow: $shadow-cart-items;
  }

  &__title {
    margin-block-end: toEm(4);
    color: var(--dark-golden-color);
  }

  &__total {
    display: inline-block;
    margin-block-end: toRem(4);
    color: var(--primary-color);

    b {
      font-size: toEm(18);
      color: var(--gray-color);
    }
  }

  &__order-form {
    justify-self: end;

    @media (max-width: $mobileSmall) {
      justify-self: center;
    }
  }
}

.discount-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(toRem(262), 1fr));
  justify-items: center;
  gap: toEm(22);

  > * { min-width: 0; }

  &__item {
    position: relative;
    justify-self: center;
    display: grid;
    row-gap: toEm(4);
    min-height: 100%;
    width: 100%;
    padding-inline: toEm(12);
    padding-block: toEm(18);
    box-shadow: 0px 1px 2px 0px var(--shadow);
    border-radius: toEm(4);
    background-color: var(--bg);
  }

  &__promotional {
    display: flex;
    align-items: center;
    column-gap: toEm(2);
    font-weight: 600;
    color: var(--warning-color);
  }

  &__in-stock {
    position: absolute;
    top: toEm(18);
    right: toEm(9);
  }

  &__link {
    display: flex;
    justify-content: center;
    transition: scale var(--transition-duration);

    @include hover {
      scale: 1.1;
    }
  }

  &__title {
    text-align: center;
    margin-block-end: toRem(9);
    color: var(--primary-color);
  }

  &__price {
    justify-self: end;
    align-self: center;
    padding-inline: toEm(2);
    font-weight: 600;
    border-radius: toRem(2);
    outline: toRem(1) solid var(--secondary-color);
    outline-offset: toEm(4);
    color: var(--warning-color);
  }
}
</style>
