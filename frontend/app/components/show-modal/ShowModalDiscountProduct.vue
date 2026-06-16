<script setup lang="ts">
const props = defineProps<{
  product: Product
}>()

const cartStore = useCartStore()
const route = useRoute()
const { isInCart } = useIsInCart()

const dialogElement = useTemplateRef<HTMLDialogElement>("discount-dialog")
const { open, close } = useDialog(
  "discount-product-" + props.product.documentId,
  dialogElement,
  { useShowMethod: false }
)

const { data: details, status, execute } = useAsyncData(
  "product-details-" + props.product.documentId,
  async () => {
    const { find } = useStrapi()
    return find("products/" + props.product.documentId, {
      populate: {
        images: { fields: ["url", "alternativeText"] },
      },
    } as any)
  },
  { immediate: false, server: false, getCachedData: (k) => details.value || null }
)

const openModal = () => {
  open()
  if (!details.value) execute()
}

const handleAddToCart = () => {
  const categorySlug = route.params.categorySlug as string
  if (isInCart(props.product.documentId)) {
    cartStore.removeFromCart(props.product.documentId)
  } else {
    cartStore.addToCart(props.product, categorySlug, null)
  }
}
</script>

<template>
  <div class="discount-card__show-wrapper">
    <UButton
      class="discount-card__show"
      icon="mdi:show-outline"
      @click="openModal"
    />

  <dialog ref="discount-dialog" class="discount-modal">
    <div class="discount-modal__items">
      <header class="discount-modal__header">
        <h2>{{ product.name }}</h2>
        <UButton variant="close" @click="close" />
      </header>

      <div v-if="status === 'pending'" class="discount-modal__skeleton">
        <div class="skeleton-gallery" />
        <div class="skeleton-text" />
      </div>

      <div v-else-if="status === 'error'" class="discount-modal__error">
        <p>{{ status }}</p>
        <UButton variant="close" @click="execute">Повторить</UButton>
      </div>

      <div v-else-if="status === 'success' && details" class="discount-modal__details">
        <UImage
          v-for="img in details.images"
          :key="img.documentId || img.id"
          :src="img.url"
          :alt="product.name"
          width="200"
          height="200"
          type="discount-modal"
        />
        <MDC :value="details.description" />
        <ProductCharacteristics
          v-if="details.characteristics"
          :specs="details.characteristics"
        />
      </div>

      <footer class="discount-modal__footer">
        <span class="discount-modal__price">{{ formatPrice(product.price) }}</span>
        <UButton
          @click="handleAddToCart"
          variant="add"
          :is-in-cart="isInCart(product.documentId)"
        />
      </footer>
    </div>
  </dialog>
  </div>
</template>

<style lang="scss" scoped>
.discount-card__show-wrapper {
  grid-area: show;
}

.discount-card__show {
  border-radius: 50%;
  color: var(--gray-color);
  background-color: var(--whitesmoke-color);
  cursor: pointer;
}

.discount-modal {
  position: fixed;
  z-index: 10000;
  inset: 0;
  width: min(90vw, toRem(600));
  height: min(90vh, toRem(700));
  padding: 0;
  border: none;
  border-radius: toRem(16);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: none;
  overflow: hidden;

  &[open] {
    display: block;
  }

  &::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  &__items {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: toRem(16) toRem(20);
    border-bottom: toRem(1) solid var(--border-color);
    flex-shrink: 0;

    h2 {
      margin: 0;
    }
  }

  &__skeleton {
    flex: 1;
    padding: toRem(20);
    display: flex;
    flex-direction: column;
    gap: toRem(16);
    align-items: center;
    justify-content: center;
  }

  &__error {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: toRem(12);
    padding: toRem(20);
    color: var(--danger-color);
  }

  &__details {
    flex: 1;
    overflow-y: auto;
    padding: toRem(20);
    display: flex;
    flex-direction: column;
    gap: toRem(16);
    align-items: center;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: toRem(16) toRem(20);
    border-top: toRem(1) solid var(--border-color);
    flex-shrink: 0;
  }

  &__price {
    font-weight: 700;
    font-size: toRem(20);
    color: var(--success-color);
  }
}
</style>
