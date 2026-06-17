<script setup lang="ts">
import { orderFormTranslations } from '~/locales/orderForm'

const { currentLocale } = useLocale()
const t = computed(() => orderFormTranslations[currentLocale.value])
const cartStore = useCartStore()
const orderStore = useOrderStore()

const emit = defineEmits(['order-success'])

const isSubmitting = ref(false)
const form = reactive({
  email: '',
  phone: '',
  agree: false
})

const submitOrder = async () => {
  if (!form.agree || !form.email || !form.phone) return

  isSubmitting.value = true
  try {
    const order = await orderStore.createOrder(form.email, form.phone)
    emit('order-success', order.data.documentId)

    form.email = ''
    form.phone = ''
    form.agree = false

  } catch (error) {
    alert('Ошибка: ' + error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    :class="['order-form', { 'order-form_disabled': isSubmitting || cartStore.totalItems === 0 }]"
  >
    <h3 class="order-form__title">{{ t.title }}</h3>

    <UInput v-model="form.email" :label="t.email" type="email" class="order-form__input" />
    <UInput v-model="form.phone" :label="t.phone + '*'" type="tel" required class="order-form__input" />
    <UInput v-model="form.agree" :label="t.checkbox" type="checkbox" class="order-form__checkbox" />

    <div class="order-form__submit-wrapper">
      <UButton
        class="order-form__submit"
        :disabled="isSubmitting"
        @click="submitOrder"
      >{{ isSubmitting ? t.submitting : t.checkout }}</UButton>
      <b>{{ t.total }}</b>
      <strong aria-live="polite" role="status" aria-atomic="true">
        <Icon name="my-icon:icon-by-regular" />
        {{ formatPrice(cartStore.totalPrice) }}
      </strong>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.order-form {
  max-width: toRem(340);

  &_disabled {
    max-width: toRem(264);
    filter: blur(2px);
    opacity: .7;
  }

  &__title {
    text-align: center;
    padding-block: toEm(9);
    border-radius: toRem(8) toRem(8) toRem(2) toRem(2);
    color: var(--danger-color);
    background-color: var(--secondary-color);
    @include adaptiveValue("margin-block-end", 16, 12);
  }

  &__input {
    @include adaptiveValue("margin-block-end", 14, 10);
  }

  &__checkbox {
    @include adaptiveValue("margin-block-end", 18, 14);
  }

  &__submit-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    column-gap: toRem(8);
    padding-inline: toRem(16);
    padding-block: toEm(9);
    border-radius: toRem(2) toRem(2) toRem(8) toRem(8);
    color: var(--color);
    background-color: var(--secondary-color);

    strong {
      letter-spacing: 1px;
      font-size: toEm(20);
    }

    svg {
      translate: 0 toRem(4);
      font-size: toEm(18);
    }
  }
}
</style>
