<script setup lang="ts">
import { orderFormTranslations } from '~/locales/orderForm'

const { currentLocale } = useLocale()
const t = computed(() => orderFormTranslations[currentLocale.value])
const cartStore = useCartStore()
const orderStore = useOrderStore()
const authStore = useAuthStore()

const emit = defineEmits(['order-success'])

const isSubmitting = ref(false)
const submitError = ref('')
const form = reactive({
  email: '',
  phone: '',
  agree: false,
})

const emailError = computed(() => '')

const phoneTarget = computed(() => form.phone.startsWith('+') ? 13 : 11)
const phoneProgress = computed(() => Math.min(form.phone.length / phoneTarget.value, 1))
const phoneValid = computed(() => form.phone.length >= phoneTarget.value)

const phoneError = computed(() => {
  if (!form.phone) return t.value.errorRequired
  return ''
})

const agreeError = computed(() => {
  if (!form.agree) return t.value.errorRequired
  return ''
})

const canSubmit = computed(() =>
  !emailError.value && phoneValid.value && !agreeError.value
)

watch(() => authStore.user?.email, (email) => {
  if (email) form.email = email
})

function onPhoneInput(e: Event) {
  const target = e.target as HTMLInputElement
  const digits = target.value.replace(/[^\d]/g, '')
  form.phone = target.value.startsWith('+') ? '+' + digits : digits
}

const submitOrder = async () => {
  submitError.value = ''
  if (!canSubmit.value) return

  isSubmitting.value = true
  try {
    const email = authStore.isAuthenticated && authStore.user?.email ? authStore.user.email : form.email
    const order = await orderStore.createOrder(email, form.phone)
    emit('order-success', order.data.documentId)

    form.email = ''
    form.phone = ''
    form.agree = false
  } catch (error: any) {
    const msg = error?.error?.message || error?.message || 'Ошибка оформления заказа'
    submitError.value = msg
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

    <UInput
      v-if="!authStore.isAuthenticated"
      v-model="form.email"
      :label="t.email"
      type="email"
      :error="emailError"
      class="order-form__input"
    />
    <UInput
      v-model="form.phone"
      :label="t.phone + '*'"
      type="tel"
      required
      :error="phoneError"
      placeholder="+375 (29) XXX-XX-XX"
      class="order-form__input"
      @input="onPhoneInput"
    />
    <div v-if="form.phone" class="order-form__phone-progress">
      <div class="order-form__phone-bar">
        <div
          class="order-form__phone-fill"
          :style="{ width: phoneProgress * 100 + '%' }"
          :class="{ 'order-form__phone-fill_done': phoneValid }"
        />
      </div>
      <span
        v-if="phoneValid"
        class="order-form__phone-check"
      >✓</span>
    </div>
    <UInput
      v-model="form.agree"
      :label="t.checkbox"
      type="checkbox"
      :error="agreeError"
      class="order-form__checkbox"
    />

    <p v-if="submitError" class="order-form__submit-error">{{ submitError }}</p>

    <div class="order-form__submit-wrapper">
      <UButton
        variant="primary"
        class="order-form__submit"
        :is-disabled="isSubmitting || !canSubmit"
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
  // Единый «фрейм» вокруг всего контента — соединяет верхнюю и нижнюю плашки.
  // Плашки прилегают к рамке через отрицательные margin-inline/block.
  // Цвет бордера — как у плашек (фон mask), с эффектом втиснения (как recessed в colorMode)
  border: toRem(1) solid var(--danger-color);
  border-radius: toRem(8);
  box-shadow:
    inset 0 toRem(2) toRem(3) rgba(0, 0, 0, 0.25),
    0 toRem(1) 0 rgba(255, 255, 255, 0.4);
  padding-inline: toRem(12);
  padding-block: toRem(8);

  &_disabled {
    max-width: toRem(264);
    filter: blur(2px);
    opacity: 0.7;
  }

  &__title {
    // Прилегает к рамке фрейма сверху и по бокам
    margin-inline: toRem(-12);
    margin-block-start: toRem(-8);
    text-align: center;
    padding-block: toEm(9);
    border-radius: toRem(8) toRem(8) 0 0;          // нижний край — скос маской
    color: var(--light-color);                     // текст на красной плашке
    background-color: var(--danger-color);         // контраст с панелью (--bg) — срез виден
    // Эффект втиснения (как recessed в colorMode): тёмная верхняя грань + светлый блик
    box-shadow:
      inset 0 toRem(2) toRem(3) rgba(0, 0, 0, 0.25),
      0 toRem(1) 0 rgba(255, 255, 255, 0.4);
    @include adaptiveValue("margin-block-end", 16, 12);

    // Скос нижнего края (правый нижний угол) — «пазл»: у плашки итога скос верхнего левого
    @include maskEdgeCut(toRem(8), "bottom-right");
  }

  &__input {
    @include adaptiveValue("margin-block-end", 14, 10);
  }

  &__checkbox {
    @include adaptiveValue("margin-block-end", 18, 14);
  }

  &__phone-progress {
    display: flex;
    align-items: center;
    gap: toRem(8);
    margin-block-end: toRem(10);
  }

  &__phone-bar {
    flex: 1;
    height: toRem(4);
    border-radius: toRem(2);
    background: var(--border-color);
    overflow: hidden;
  }

  &__phone-fill {
    height: 100%;
    border-radius: toRem(2);
    background: var(--warning-color);
    transition: width 0.3s;
  }

  &__phone-fill_done {
    background: var(--success-color);
  }

  &__phone-check {
    font-size: toRem(14);
    font-weight: 700;
    color: var(--success-color);
    flex-shrink: 0;
  }

  &__submit-error {
    color: var(--danger-color);
    font-size: toRem(13);
    text-align: center;
    margin: 0;
  }

  &__submit-wrapper {
    // Прилегает к рамке фрейма снизу и по бокам
    margin-inline: toRem(-12);
    margin-block-end: toRem(-8);
    display: flex;
    justify-content: space-between;
    align-items: center;
    column-gap: toRem(8);
    padding-inline: toRem(16);
    padding-block: toEm(9);
    border-radius: 0 0 toRem(8) toRem(8);          // верхний край — скос маской
    color: var(--light-color);                     // текст на красной плашке (как у заголовка)
    background-color: var(--danger-color);         // один цвет с заголовком — «цельность»
    // Эффект втиснения (как recessed в colorMode)
    box-shadow:
      inset 0 toRem(2) toRem(3) rgba(0, 0, 0, 0.25),
      0 toRem(1) 0 rgba(255, 255, 255, 0.4);

    // Скос верхнего края (левый верхний угол) — противоположен скосу заголовка: «пазл»
    @include maskEdgeCut(toRem(8), "top-left");

    strong {
      letter-spacing: 1px;
      font-size: toEm(20);
    }

    svg {
      translate: 0 toRem(4);
      font-size: toEm(18);
    }
  }

  &__submit {
    // Белая, как карточка; текст — цвет плашек (красный)
    background-color: var(--bg);
    color: var(--danger-color);
    border: toRem(2) solid var(--danger-color);

    @include hover {
      background-color: var(--danger-color);
      color: var(--light-color);
    }
  }
}
</style>
