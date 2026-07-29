<script setup lang="ts">
import { cartTranslations } from '~/locales/cart'
import { discountProductTranslations } from '~/locales/discountProduct'
import { buttonTranslations } from '~/locales/button'

const { currentLocale } = useLocale()
const cartT = computed(() => cartTranslations[currentLocale.value])
const discountT = computed(() => discountProductTranslations[currentLocale.value])
const buttonT = computed(() => buttonTranslations[currentLocale.value])
const cartStore = useCartStore()
const config = useRuntimeConfig()

const dialogRef = useTemplateRef<HTMLDialogElement>('cart-dialog')
const { open, close, isOpen } = useDialog('cartDialog', dialogRef, { useShowMethod: false })

defineExpose({ open, close, isOpen })

// Discount products for recommendations
const { data: discountProducts } = useAsyncData(
  `cart-discount-${currentLocale.value}`,
  async () => {
    const { find } = useStrapi()
    const response = await find<Product>('products', {
      filters: {
        isDiscount: true,
        locale: { $eq: currentLocale.value },
      },
      pagination: { pageSize: 100 } as PaginationMeta,
      populate: {
        image: { fields: ['alternativeText', 'url'] },
        subcategory: {
          fields: ['name', 'slug'],
          populate: {
            category: { fields: ['name', 'slug'] },
          },
        },
      },
    } as any)
    return response.data || []
  },
  { server: false, lazy: true },
)

function getProductLink(prod: Product): string {
  const cat = (prod as any)?.subcategory?.category?.slug
  const sub = (prod as any)?.subcategory?.slug
  if (cat && sub) return `/${currentLocale.value}/${cat}/${sub}/${prod.slug}`
  const cat2 = (prod as any)?.category?.slug
  if (cat2) return `/${currentLocale.value}/${cat2}/products/${prod.slug}`
  return `/${currentLocale.value}`
}

function closeAndGoToCatalog() {
  close()
  navigateTo(`/${currentLocale.value}`)
}

onMounted(() => {
  cartStore.loadCart()
})
</script>

<template>
  <dialog ref="cart-dialog" class="cart-dialog">
    <div class="cart-dialog__panel">
      <header class="cart-dialog__header">
        <h2 class="cart-dialog__title">{{ cartT.title }}</h2>
        <div class="cart-dialog__header-right">
          <span class="cart-dialog__count" v-if="cartStore.totalItems > 0">
            {{ cartStore.totalItems }}
          </span>
          <button
            class="cart-dialog__close"
            aria-label="Закрыть корзину"
            @click="close"
          >
            <Icon name="mingcute:close-line" />
          </button>
        </div>
      </header>

      <!-- Empty cart -->
      <div v-if="cartStore.totalItems === 0" class="cart-dialog__empty">
        <div class="cart-dialog__empty-icon">
          <Icon name="mingcute:shopping-bag-2-line" />
        </div>
        <p class="cart-dialog__empty-title">{{ cartT.cartEmpty }}</p>
        <p class="cart-dialog__empty-sub">{{ cartT.cartEmptySub }}</p>
        <UButton
          variant="primary"
          class="cart-dialog__empty-cta"
          @click="closeAndGoToCatalog"
        >
          {{ cartT.cartEmptyCta }}
        </UButton>

        <div v-if="discountProducts?.length" class="cart-dialog__recommend">
          <div class="cart-dialog__recommend-header">
            <Icon name="mdi:fire" />
            <h3>{{ discountT.discount }}</h3>
          </div>
          <div class="cart-dialog__recommend-grid">
            <NuxtLink
              v-for="prod in discountProducts"
              :key="prod.documentId"
              :to="getProductLink(prod)"
              class="cart-dialog__recommend-card"
            >
              <UImage
                v-if="prod.mainImage?.url || prod.image?.length"
                :src="prod.mainImage?.url || prod.image?.[0]?.url"
                :alt="prod.name"
                width="120"
                height="90"
                type="thumbnail"
              />
              <div class="cart-dialog__recommend-info">
                <span class="cart-dialog__recommend-name">{{ prod.name }}</span>
                <span class="cart-dialog__recommend-price">{{ formatPrice(prod.price) }}</span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- With items -->
      <template v-else>
        <div class="cart-dialog__items">
          <CartShopping />
        </div>
        <div class="cart-dialog__order">
          <OrderForm @order-success="close" />
        </div>
      </template>
    </div>
  </dialog>
</template>

<style lang="scss" scoped>
.cart-dialog {
   margin: 0;
  margin-inline-start: auto;
  height: 100dvh;
  max-height: 100dvh;
  max-width: 100dvw;
  background: transparent;
 border-width: 0 toEm(0) toEm(0) toEm(3);
 border-radius: toEm(4);
 border-style: solid;
 border-color: var(--border-color-transparent);
  translate: 100%;
  opacity: 0;
  transition:
    translate var(--transition-duration),
    opacity var(--transition-duration),
    overlay var(--transition-duration) allow-discrete,
    display var(--transition-duration) allow-discrete;
  @include adaptiveValue("width", 480, 320);

  &[open] {
    translate: 0;
    opacity: 1;
  }

  @starting-style {
    &[open] {
      translate: 100%;
      opacity: 0;
    }
  }

  &::backdrop {
    background: rgba(0, 0, 0, 0.15);
    backdrop-filter: grayscale(100%);
    opacity: 0;
    transition:
      opacity var(--transition-duration),
      overlay var(--transition-duration) allow-discrete,
      display var(--transition-duration) allow-discrete;
  }

  &[open]::backdrop {
    opacity: 1;
  }

  @starting-style {
    &[open]::backdrop {
      opacity: 0;
    }
  }
}

.cart-dialog__panel {
  height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: var(--bg);
}

// ====== Header ======
.cart-dialog__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: toRem(16);
  background: var(--bg);
  border-block-end: 1px solid var(--border-color);
}

.cart-dialog__title {
  font-weight: 700;
  @include adaptiveValue("font-size", 22, 18);
}

.cart-dialog__header-right {
  display: flex;
  align-items: center;
  gap: toRem(12);
}

.cart-dialog__count {
  display: grid;
  place-items: center;
  width: toRem(24);
  height: toRem(24);
  border-radius: 50%;
  background: var(--danger-color);
  color: #fff;
  font-size: toRem(12);
  font-weight: 700;
}

.cart-dialog__close {
  display: grid;
  place-items: center;
  width: toRem(36);
  height: toRem(36);
  border-radius: 50%;
  cursor: pointer;
  transition: background var(--transition-duration);

  @include hover {
    background: var(--bg-secondary);
  }

  svg {
    font-size: toRem(22);
    color: var(--color);
  }
}

// ====== Empty state ======
.cart-dialog__empty {
  display: grid;
  gap: toRem(12);
  justify-items: center;
  align-content: center;
  padding: toRem(32) toRem(16);
  text-align: center;
  overflow-y: auto;
}

.cart-dialog__empty-icon {
  width: toRem(64);
  height: toRem(64);
  border-radius: 50%;
  background: var(--bg-secondary);
  display: grid;
  place-items: center;

  svg {
    font-size: toRem(28);
    color: var(--text-muted);
  }
}

.cart-dialog__empty-title {
  font-weight: 700;
  margin: 0;
  @include adaptiveValue("font-size", 20, 18);
}

.cart-dialog__empty-sub {
  color: var(--text-muted);
  font-size: toRem(14);
  margin: 0;
  line-height: 1.4;
  max-width: toRem(280);
}

.cart-dialog__empty-cta {
  margin-block-start: toRem(4);
}

// ====== Recommendations ======
.cart-dialog__recommend {
  width: 100%;
  margin-block-start: toRem(24);
  text-align: start;
}

.cart-dialog__recommend-header {
  display: flex;
  align-items: center;
  gap: toRem(6);
  margin-block-end: toRem(12);

  svg {
    font-size: toRem(20);
    color: var(--warning-color);
  }

  h3 {
    font-weight: 600;
    font-size: toRem(16);
    margin: 0;
  }
}

.cart-dialog__recommend-grid {
  display: grid;
  gap: toRem(8);
}

.cart-dialog__recommend-card {
  display: flex;
  gap: toRem(12);
  align-items: center;
  padding: toRem(8);
  border-radius: toRem(8);
  background: var(--bg-secondary);
  text-decoration: none;
  color: var(--color);
  transition: background var(--transition-duration);

  @include hover {
    background: var(--bg-hover);
  }
}

.cart-dialog__recommend-info {
  display: grid;
  gap: toRem(4);
  min-width: 0;
}

.cart-dialog__recommend-name {
  font-weight: 500;
  font-size: toRem(14);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cart-dialog__recommend-price {
  font-weight: 700;
  color: var(--primary-color);
  font-size: toRem(15);
}

// ====== Items area ======
.cart-dialog__items {
  overflow-y: auto;
  padding: toRem(16);
  background: var(--bg);
}

// ====== Order form ======
.cart-dialog__order {
  padding: toRem(16);
  background: var(--bg);
  border-block-start: 1px solid var(--border-color);
}
</style>
