<script setup lang="ts">
import { chatAssistantTranslations } from '../../locales/chat-assistant'

const { currentLocale } = useLocale()
const cartStore = useCartStore()
const t = computed(() => chatAssistantTranslations[currentLocale.value])

interface ChatProduct {
  documentId: string
  name: string
  price: number
  slug: string
  image?: string
  category?: string
  categoryName?: string
  isDiscount?: boolean
}

const props = defineProps<{
  product: ChatProduct
}>()

const formattedPrice = computed(() => formatPrice(props.product.price))

const productLink = computed(() => {
  const catSlug = props.product.category || props.product.categoryName || 'products'
  return `/${currentLocale.value}/${catSlug}/products/${props.product.slug}`
})

const handleAddToCart = () => {
  cartStore.addToCart(
    {
      id: props.product.documentId,
      documentId: props.product.documentId,
      name: props.product.name,
      price: props.product.price,
      slug: props.product.slug,
      image: props.product.image ? [{ url: props.product.image }] : []
    } as any,
    props.product.category || 'products',
    null
  )
}
</script>

<template>
  <div class="chat-product-card">
    <template v-if="product.image">
      <div class="chat-product-card__image-wrap">
        <UImage
          :src="product.image"
          :alt="product.name"
          width="80"
          height="80"
          type="thumbnail"
          class="chat-product-card__image"
        />
        <Icon
          v-if="product.isDiscount"
          class="chat-product-card__discount"
          name="mdi:discount"
        />
      </div>
    </template>
    <div v-else class="chat-product-card__placeholder" />
    <div class="chat-product-card__info">
      <div class="chat-product-card__name-row">
        <h4 class="chat-product-card__name">{{ product.name }}</h4>
      </div>
      <p class="chat-product-card__price">{{ formattedPrice }} руб</p>
      <div class="chat-product-card__actions">
        <NuxtLink
          :to="productLink"
          class="chat-product-card__link"
        >
          {{ t.viewProduct }}
        </NuxtLink>
        <UButton
          variant="cart-pill"
          @click="handleAddToCart"
        >
          {{ t.addToCart }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-product-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: toRem(12);
  padding: toRem(12);
  background: var(--light-color);
  border: toRem(1) solid var(--border-color);
  border-radius: toRem(12);
  margin-block: toRem(8);
  align-items: center;
  @include containerParent(card, inline-size);

  &__image-wrap {
    position: relative;
    flex-shrink: 0;
  }

  &__image {
    border-radius: toRem(8);
    overflow: hidden;
  }

  &__discount {
    position: absolute;
    top: toRem(-4);
    right: toRem(-4);
    color: var(--success-color);
    background: var(--light-color);
    border-radius: 50%;
    @include adaptiveValue("font-size", 18, 14);
  }

  &__discount-inline {
    color: var(--success-color);
    flex-shrink: 0;
    @include adaptiveValue("font-size", 16, 14);
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: toRem(4);
  }

  &__placeholder {
    width: toRem(80);
    height: toRem(80);
    border-radius: toRem(8);
    background: var(--bg);
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: toRem(4);
  }

  &__name {
    margin: 0;
    font-weight: 600;
    color: var(--color);
    line-height: 1.3;
    @include adaptiveValue("font-size", 14, 13);
  }

  &__price {
    margin: 0;
    font-weight: 700;
    color: var(--success-color);
    @include adaptiveValue("font-size", 16, 14);
  }

  &__actions {
    display: flex;
    gap: toRem(8);
    margin-top: toRem(4);
    flex-wrap: wrap;
  }

  &__link {
    color: var(--success-color);
    text-decoration: none;
    white-space: nowrap;
    @include adaptiveValue("font-size", 12, 11);

    &:hover {
      text-decoration: underline;
    }
  }


}

@container card (max-width: toRem(260)) {
  .chat-product-card {
    grid-template-columns: 1fr;
  }
}
</style>
