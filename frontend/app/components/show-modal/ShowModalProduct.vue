<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    // Может быть null (общий инстанс в Header, пока не выбран товар)
    product: Product | null
    // Скрыть собственный триггер-кнопку (когда модалка открывается через ref, напр. в корзине)
    hideTrigger?: boolean
  }>(),
  { product: null, hideTrigger: false }
)

const cartStore = useCartStore()
const route = useRoute()
const { isInCart } = useIsInCart()
const { find } = useStrapi()

// Стабильный id диалога для инстанса (главное — уникальность между инстансами).
// useDialog захватывает его при setup, поэтому смена продукта не ломает open/close.
const dialogId = "product-" + (props.product?.documentId ?? "preview")

const dialogElement = useTemplateRef<HTMLDialogElement>("product-dialog")
const wrapperRef = useTemplateRef<HTMLDivElement>("wrapper")
const { open, close } = useDialog(
  dialogId,
  dialogElement,
  { useShowMethod: false }
)

// Реактивный ключ: при смене продукта (общий инстанс) детали перезапрашиваются.
const detailsKey = computed(() =>
  "product-details-" + (props.product?.documentId ?? "preview")
)

const { data: details, status, execute } = useAsyncData(
  detailsKey,
  async () => {
    if (!props.product?.slug) return null
    const response = await find("products", {
      filters: { slug: { $eq: props.product.slug } },
      populate: {
        image: { fields: ["url", "alternativeText"] },
        mainImage: { fields: ["url", "alternativeText"] },
      },
    } as any)
    return response.data?.[0] as Product
  },
  { immediate: false, server: false }
)

// Префетч деталей товара при скролле — когда карточка входит в область видимости
let prefetchObserver: IntersectionObserver | null = null

onMounted(() => {
  if (!wrapperRef.value) return
  prefetchObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        execute()
        prefetchObserver?.disconnect()
      }
    },
    { rootMargin: "100px" }
  )
  prefetchObserver.observe(wrapperRef.value)
})

onUnmounted(() => {
  prefetchObserver?.disconnect()
})

const openModal = () => {
  if (!props.product) return   // ничего не выбрано — не открываем
  open?.()
  // Всегда перезапрашиваем: при переиспользовании модалки продукт может смениться
  execute()
}

const parseCharacteristics = (char: string) => {
  try {
    return JSON.parse(char)
  } catch {
    return []
  }
}

defineExpose({ openModal })

const handleAddToCart = () => {
  if (!props.product) return
  const categorySlug = (route.params.categorySlug as string)
    || props.product.subcategory?.category?.slug
    || ''
  if (isInCart(props.product.documentId)) {
    cartStore.removeFromCart(props.product.documentId)
  } else {
    cartStore.addToCart(props.product, categorySlug, props.product.subcategory?.slug || null)
  }
}
</script>

<template>
  <div v-if="!hideTrigger" ref="wrapper" class="product-modal__trigger">
    <UButton
      class="product-modal__trigger-btn"
      icon="mdi:show-outline"
      @click="openModal"
    />
  </div>

  <!-- Диалог всегда смонтирован: при hide-trigger кнопки нет, но модалка открывается через ref (корзина) -->
  <dialog ref="product-dialog" class="product-modal">
    <div class="product-modal__items">
      <header class="product-modal__header">
        <h2>{{ product?.name }}</h2>
        <UButton variant="close" @click="close" />
      </header>

      <div v-if="status === 'pending'" class="product-modal__skeleton">
        <div class="skeleton-gallery" />
        <div class="skeleton-text" />
      </div>

      <div v-else-if="status === 'error'" class="product-modal__error">
        <p>{{ status }}</p>
        <UButton variant="close" @click="() => execute()">Повторить</UButton>
      </div>

      <div v-else-if="status === 'success' && details" class="product-modal__details">
        <UImage
          v-for="img in details.image"
          :key="img.documentId || img.id"
          :src="img.url"
          :alt="product?.name"
          type="product"
          width="200"
          height="150"
        />
        <MDC :value="details.description" />
        <ProductCharacteristics
          v-if="details.characteristics"
          :specs="parseCharacteristics(details.characteristics)"
        />
      </div>

      <footer class="product-modal__footer">
        <span class="product-modal__price">{{ formatPrice(product?.price ?? 0) }}</span>
        <UButton
          @click="handleAddToCart"
          variant="add"
          :is-in-cart="isInCart(product?.documentId ?? '')"
        />
      </footer>
    </div>
  </dialog>
</template>

<style lang="scss" scoped>
.product-modal__trigger {
  grid-area: show;
}

.product-modal__trigger-btn {
  border-radius: 50%;
  color: var(--gray-color);
  background-color: var(--whitesmoke-color);
  cursor: pointer;
}

.product-modal {
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
