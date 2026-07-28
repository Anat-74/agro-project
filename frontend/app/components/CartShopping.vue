<script setup lang="ts">
import { cartTranslations } from "~/locales/cart";
import { buttonTranslations } from "~/locales/button";

const cartStore = useCartStore();
const { currentLocale } = useLocale();
const cartT = computed(() => cartTranslations[currentLocale.value])
const buttonT = computed(() => buttonTranslations[currentLocale.value])
const config = useRuntimeConfig();

const getProductLink = (product: CartItem["product"]) => {
  const catSlug = product.categorySlug || (product as any).subcategory?.category?.slug || ''
  if (!catSlug) return ''
  if (product.subcategorySlug) {
    return `/${currentLocale.value}/${catSlug}/${product.subcategorySlug}/${product.slug}`;
  } else {
    return `/${currentLocale.value}/${catSlug}/products/${product.slug}`;
  }
};

const switchToLocale = (locale: string) => {
  const { switchLocale } = useLocale();
  switchLocale(locale as LocaleCode);
};

onMounted(() => {
  cartStore.loadCart();
});
</script>

<template>
  <div class="cart-items">
    <div
      v-for="item in cartStore.items"
      :key="item.product.documentId"
      class="cart-items__item"
    >
      <div
        v-if="item.product.originalLocale !== currentLocale"
        class="cart-items__locale-warning"
      >
        <Icon name="mdi:alert" />
        <span>{{ cartT.warningLocale }}</span>
        <UButton
          :label="item.product.originalLocale"
          variant="switch-locale-cart"
          @click="switchToLocale(item.product.originalLocale)"
        />
      </div>

      <div class="cart-items__main">
        <NuxtLink
          v-if="getProductLink(item.product)"
          :to="getProductLink(item.product)"
          :class="['cart-items__link', { 'cart-items__link_disabled': item.product.originalLocale !== currentLocale }]"
        >
          <NuxtImg
            class="cart-items__image"
            :src="`${config.public.strapi.url}${item.product.mainImage}`"
            :alt="item.product.name"
            format="webp"
            loading="lazy"
            decoding="async"
            width="100"
            height="75"
          />
        </NuxtLink>

        <div class="cart-items__info">
          <span v-if="item.product.isDiscount" class="cart-items__badge">
            <Icon name="mdi:discount" />
            {{ item.product.name }}
          </span>
          <span v-else class="cart-items__name">{{ item.product.name }}</span>

          <span class="cart-items__price">
            <Icon name="my-icon:icon-by-regular" />
            {{ formatPrice(item.product.price) }}
          </span>
        </div>
      </div>

      <div class="cart-items__controls">
        <UButton
          @click="cartStore.updateQuantity(item.product.documentId, item.quantity - 1)"
          :disabled="item.quantity <= 1"
          variant="remove-quantity-prod"
          :aria-label="buttonT.ariaLabelReduceQuantity"
        />
        <span class="cart-items__qty">{{ item.quantity }}</span>
        <UButton
          @click="cartStore.updateQuantity(item.product.documentId, item.quantity + 1)"
          variant="add-quantity-prod"
          :aria-label="buttonT.ariaLabelIncreaseQuantity"
        />
        <UButton
          variant="secondary"
          @click="cartStore.removeFromCart(item.product.documentId)"
          icon="material-symbols:delete-outline-rounded"
          :aria-label="buttonT.ariaLabelRemoveItemFromCart"
          class="cart-items__remove"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cart-items {
  display: grid;
  gap: toRem(16);

  &__item {
    position: relative;
    display: grid;
    gap: toRem(16);
    padding: toRem(16);
    background: var(--bg);
    border-radius: toRem(10);
    border: 1px solid var(--border-color);

    @media (min-width: $mobile) {
      grid-template-columns: 1fr auto;
      align-items: center;
    }
  }

  &__locale-warning {
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    display: flex;
    align-items: center;
    gap: toRem(8);
    padding: toRem(6) toRem(12);
    background: var(--whitesmoke-color);
    border-radius: toRem(10) toRem(10) 0 0;
    font-size: toRem(12);
    font-weight: 600;
    color: var(--danger-color);
    border: 1px solid var(--danger-color);
    z-index: 1;

    svg {
      font-size: toRem(16);
      flex-shrink: 0;
    }
  }

  &__main {
    display: flex;
    gap: toRem(16);
    align-items: flex-start;
    min-width: 0;
  }

  &__link {
    flex-shrink: 0;
    transition: opacity var(--transition-duration);

    &_disabled {
      pointer-events: none;
      opacity: 0.5;
    }
  }

  &__image {
    width: toRem(100);
    height: toRem(75);
    object-fit: contain;
    border-radius: toRem(6);
    background: var(--bg-secondary);

    @media (max-width: $mobileSmall) {
      width: toRem(80);
      height: toRem(60);
    }
  }

  &__info {
    display: grid;
    gap: toRem(8);
    align-content: start;
    min-width: 0;
  }

  &__name {
    font-weight: 600;
    font-size: toRem(15);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: toRem(4);
    font-weight: 600;
    font-size: toRem(13);
    color: var(--lime-color);
    width: fit-content;

    svg {
      font-size: toRem(16);
    }
  }

  &__price {
    font-weight: 700;
    font-size: toRem(16);
    color: var(--primary-color);

    svg {
      translate: 0 toRem(2);
    }
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: toRem(8);

    @media (max-width: $mobile) {
      justify-content: flex-end;
    }
  }

  &__qty {
    font-weight: 600;
    font-size: toRem(16);
    min-width: toRem(24);
    text-align: center;
  }

  &__remove {
    margin-inline-start: toRem(4);
    color: var(--danger-color);
  }
}
</style>
