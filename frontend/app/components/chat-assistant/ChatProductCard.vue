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
        <button
          class="chat-product-card__cart-button"
          @click="handleAddToCart"
        >
          {{ t.addToCart }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-product-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--light-color, #fff);
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  margin-block: 8px;
  align-items: center;

  &__image-wrap {
    position: relative;
    flex-shrink: 0;
  }

  &__image {
    border-radius: 8px;
    overflow: hidden;
  }

  &__discount {
    position: absolute;
    top: -4px;
    right: -4px;
    color: var(--success-color, #4caf50);
    font-size: 18px;
    background: var(--light-color, #fff);
    border-radius: 50%;
  }

  &__discount-inline {
    color: var(--success-color, #4caf50);
    font-size: 16px;
    flex-shrink: 0;
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__placeholder {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    background: #f0f0f0;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__name {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    line-height: 1.3;
  }

  &__price {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #2e7d32;
  }

  &__actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
    flex-wrap: wrap;
  }

  &__link {
    font-size: 12px;
    color: #4caf50;
    text-decoration: none;
    white-space: nowrap;

    &:hover {
      text-decoration: underline;
    }
  }

  &__cart-button {
    font-size: 12px;
    padding: 4px 12px;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.2s;

    &:hover {
      background: #388e3c;
    }
  }
}
</style>
