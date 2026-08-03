<script setup lang="ts">
import ShowModalProduct from '~/components/show-modal/ShowModalProduct.vue'
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

const modalRef = useTemplateRef<InstanceType<typeof ShowModalProduct>>('product-modal')

// Минимальный Product для модалки: детали (описание, характеристики, галерея)
// ShowModalProduct догружает сам по slug, здесь достаточно данных для header/footer.
const modalProduct = computed<Product>(() => ({
  id: props.product.documentId,
  documentId: props.product.documentId,
  slug: props.product.slug,
  name: props.product.name,
  price: props.product.price,
  description: '',
  characteristics: '',
  image: props.product.image ? [{ url: props.product.image }] : [],
  isDiscount: props.product.isDiscount,
}))

const openPreview = () => {
  nextTick(() => modalRef.value?.openModal?.())
}

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
      <button
        type="button"
        class="chat-product-card__image-wrap"
        @click="openPreview"
        :aria-label="t.viewProduct"
      >
        <UImage
          :src="product.image"
          :alt="product.name"
          type="product"
          width="200"
          height="150"
          class="chat-product-card__image"
        />
        <Icon
          v-if="product.isDiscount"
          class="chat-product-card__discount"
          name="mdi:discount"
        />
      </button>
    </template>
    <button
      v-else
      type="button"
      class="chat-product-card__placeholder"
      @click="openPreview"
      :aria-label="t.viewProduct"
    />
    <div class="chat-product-card__info">
      <div class="chat-product-card__name-row">
        <h4 class="chat-product-card__name">{{ product.name }}</h4>
      </div>
      <p class="chat-product-card__price">{{ formattedPrice }} руб</p>
      <div class="chat-product-card__actions">
        <UButton
          variant="cart-pill"
          @click="handleAddToCart"
        >
          {{ t.addToCart }}
        </UButton>
      </div>
    </div>
    <ShowModalProduct
      ref="product-modal"
      :product="modalProduct"
      hide-trigger
    />
  </div>
</template>

<style scoped lang="scss">
// Карточка товара в чате: всегда одна колонка (ширина сообщения ≤~215px).
// ВАЖНО: нельзя стилизовать сам контейнер через @container (спека: контейнерная
// query не матчится на сам контейнер — только на потомков), поэтому адаптив
// делаем базовой раскладкой, без container-query на карточку.
.chat-product-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: toRem(12);
  padding: toRem(12);
  background: var(--light-color);
  border: toRem(1) solid var(--border-color);
  border-radius: toRem(12);
  margin-block: toRem(8);
  align-items: center;
  // Позволяет карточке сжиматься в grid/flex-родителях чата (иначе 1fr-колонка
  // не может стать уже min-content и карточка ломает вёрстку по горизонтали)
  min-width: 0;

  &__image-wrap {
    position: relative;
    flex-shrink: 0;
    min-width: 0;
    // Изображение на всю ширину карточки (одна колонка)
    width: 100%;
    justify-self: center;
    // Кнопка-превью: сброс дефолтных стилей button
    border: none;
    padding: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    border-radius: toRem(8);
    // Контейнер `product` — тот же, на который опираются container queries
    // в UImage.vue (@container product), чтобы изображение адаптировалось
    // от ширины контейнера (max-width 200px).
    @include containerParent(product, inline-size);

    @include hover {
      scale: 1.02;
    }
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
    min-width: 0;
  }

  &__placeholder {
    width: toRem(80);
    height: toRem(80);
    border-radius: toRem(8);
    background: var(--bg);
    flex-shrink: 0;
    justify-self: center;
    // Кнопка-превью (нет изображения)
    border: none;
    padding: 0;
    color: inherit;
    font: inherit;
    cursor: pointer;

    @include hover {
      scale: 1.02;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: toRem(4);
  }

  &__name {
    margin: 0;
    font-weight: 600;
    color: var(--color);
    line-height: 1.3;
    min-width: 0;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    @include adaptiveValue("font-size", 14, 13);
  }

  &__price {
    margin: 0;
    font-weight: 700;
    color: var(--success-color);
    white-space: nowrap;
    @include adaptiveValue("font-size", 16, 14);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: toRem(8);
    margin-top: toRem(4);
    min-width: 0;
  }
}
</style>
