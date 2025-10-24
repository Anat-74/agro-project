<script setup lang="ts">
import { orderFormTranslations } from '~/locales/orderForm'
const { currentLocale } = useLocale()
const cartStore = useCartStore()
const orderStore = useOrderStore()
import { formatPrice } from '~/utils/formatPrice'

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
      emit('order-success', order.data.items[0]?.product.id)

      form.email = ''
      form.phone = ''
      form.agree = false

   } catch (error) {
      alert('Ошибка:' + error)
   } finally {
      isSubmitting.value = false
   }
}
</script>

<template>
   <div 
   :class="['order-form', {'order-form_disabled': isSubmitting || cartStore.totalItems === 0}]">
     <h3 
     class="order-form__title">{{ orderFormTranslations[currentLocale].title }}</h3>
     <form
      @submit.prevent="submitOrder"
      class="order-form__form"
      >
         <label 
         class="order-form__label"
         for="email">
         {{ orderFormTranslations[currentLocale].email }}
      </label>
         <input 
           v-model="form.email" 
           type="email" 
           id="email"
           :disabled="isSubmitting || cartStore.totalItems === 0"
           placeholder="your@email.com"
           class="order-form__input"
         >
         <label 
         class="order-form__label"
         for="phone">
         {{ orderFormTranslations[currentLocale].phone }}*
      </label>
         <input
           v-model="form.phone"
           type="tel"
           required
           :disabled="isSubmitting || cartStore.totalItems === 0"
           id="phone"
           placeholder="+375(00) 000-00-00"
           class="order-form__input"
         >
         <label class="order-form__checkbox-label">
           <input 
             v-model="form.agree" 
             type="checkbox" 
             required
             :disabled="isSubmitting || cartStore.totalItems === 0"
             class="order-form__checkbox"
           >
           <span
           class="order-form__conditions"
           >{{ orderFormTranslations[currentLocale].checkbox }}
         </span>
         </label>
       <UButton
         size="large"
         type="submit" 
         :disabled="isSubmitting || cartStore.totalItems === 0"
         :label="isSubmitting ? orderFormTranslations[currentLocale].submitting : orderFormTranslations[currentLocale].checkout"
         class="order-form__btn"
         />
     </form>
     <div class="order-form__total">
      <b>{{ orderFormTranslations[currentLocale].total }}</b>
             <strong
               aria-live="polite"
               role="status"
               aria-atomic="true"
             >
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

      .order-form__form {
         background-color: transparent;
         box-shadow: none
      }
      .order-form__title {
         background-color: transparent;
         opacity: .6;
         box-shadow: none
      }
      .order-form__total {
         background-color: transparent;
         box-shadow: none
      }
      .order-form__conditions {
         cursor: default;
      }
   }

   &__title {
      text-align: center;
      padding-block: toEm(9);
      border-radius: toRem(8) toRem(8) toRem(2) toRem(2);
      color: var(--danger-color);
      background-color: var(--secondary-color);
      box-shadow:
      0px 4px 4px -4px rgba(30, 33, 44, 0.05),
      0px 12px 10px -6px rgba(30, 33, 44, 0.08),
      0px 26px 24px -10px rgba(30, 33, 44, 0.1),
      0px 60px 80px -20px rgba(30, 33, 44, 0.16);
   }

&__form {
    display: grid;
    padding-inline: toEm(22);
    padding-block: toEm(16);
    margin-block: toEm(4);
    border-radius: toRem(2);
    background-color: var(--secondary-color);
    box-shadow:
      0px 4px 4px -4px rgba(30, 33, 44, 0.05),
      0px 12px 10px -6px rgba(30, 33, 44, 0.08),
      0px 26px 24px -10px rgba(30, 33, 44, 0.1),
      0px 60px 80px -20px rgba(30, 33, 44, 0.16);
}

&__label {
   display: inline-block;
    color: var(--color);
    @include adaptiveValue("margin-block-end", 8, 5);
}

&__input {
    padding-inline-start: toEm(16);
    padding-block: toEm(12);
    border-radius: toEm(4);
    border: 1px solid var(--border-color);
    font-weight: 600;
    color: var(--color);
    background-color: var(--bg);
    transition: background-color var(--transition-duration);
    @include adaptiveValue("margin-block-end", 20, 14);

    &::placeholder {
      color: var(--border-color);
      transition: color var(--transition-duration);
    }

    @include hover {
      &:enabled {
         background-color: var(--placeholder-hover);
      &::placeholder {
        color: var(--color);
      }
      }
    }
}

  &__checkbox-label {
    display: flex;
    .order-form__checkbox:checked + .order-form__conditions::before {
      background-color: var(--danger-color);
    }
    .order-form__checkbox:checked + .order-form__conditions::after {
      opacity: 1;
    }
    .order-form__checkbox:focus-visible + .order-form__conditions {
      outline: toRem(2) solid var(--warning-hover);
      outline-offset: toRem(3);
      border-radius: toRem(3);
    }
  }

  &__checkbox {
    opacity: 0;
    width: toRem(16);
    height: toRem(16);
  }

  &__conditions {
    position: relative;
    display: inline-block;
    cursor: pointer;
    margin-inline-start: toEm(9);
    margin-block-end: toEm(22);
    font-size: toRem(14);
    color: var(--primary-color);

    &::before,
    &::after {
      content: "";
      position: absolute;
      left: toRem(-27);
      top: 50%;
      translate: 0 -50%;
      width: toRem(16);
      height: toRem(16);
    }

    &::before {
      border-radius: toRem(3);
      border: 1px solid var(--warning-color);
      transition: border var(--transition-duration);
    }

    &::after {
      opacity: 0;
      background: url("/my-icons/check.svg") 50% / toRem(10) toRem(8) no-repeat;
    }

    @include hover {
      &:enabled {
         &::before {
        border-width: toRem(2);
      }
      }
    }
  }

&__total {
   display: flex;
   justify-content: space-between;
   align-items: center;
   column-gap: toRem(2);
   padding-inline: toRem(16);
   padding-block: toEm(9);
   border-radius: toRem(2) toRem(2) toRem(8) toRem(8);
   color: var(--color);
   background-color: var(--secondary-color);
   box-shadow:
      0px 4px 4px -4px rgba(30, 33, 44, 0.05),
      0px 12px 10px -6px rgba(30, 33, 44, 0.08),
      0px 26px 24px -10px rgba(30, 33, 44, 0.1),
      0px 60px 80px -20px rgba(30, 33, 44, 0.16);

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