<script setup lang="ts">
import { buttonTranslations } from "~/locales/button";

// Самостоятельный попап контактов (телефоны + почта) для нижней кромки панели
// каталога: триггер-иконка внутри компонента, открытие по клику — нативный
// Popover API (popovertarget + popover), без JS-состояния.
// Ховер-карточка контактов в шапке — отдельный компонент NavContactsPopover.vue
defineProps<{
  phones: Phone[];
  email: Email[];
}>();

const { currentLocale } = useLocale();
const buttonT = computed(() => buttonTranslations[currentLocale.value]);

// id поповера уникален для каждого экземпляра (правило style guide §14)
const popoverId = `contacts-popover-${useId()}`;
</script>

<template>
  <div class="contacts-popover">
    <UButton
      variant="plain"
      class="contacts-popover__trigger"
      :popovertarget="popoverId"
      :aria-label="buttonT.ariaLabelContacts"
    >
      <Icon name="mingcute:phone-line" />
    </UButton>
    <!-- Поповер — в top-layer, поэтому не режется overflow панели.
         Раскрывается ВВЕРХ (триггер у нижней кромки плашки), при нехватке
         места переворачивается (flip-block) -->
    <div :id="popoverId" popover class="contacts-popover__dropdown">
      <div class="contacts-popover__card">
        <div
          v-for="phone in phones"
          :key="phone.documentId || phone.id"
          class="contacts-popover__link"
        >
          <Icon v-if="phone.isMobile" name="et:phone" />
          <Icon v-if="!phone.isMobile" name="carbon:phone-ip" />
          <a :href="`tel:${phone.phoneNumber.replace(/[^0-9+]/g, '')}`">
            {{ formatPhone(phone.phoneNumber) }}
          </a>
        </div>
        <div
          v-for="mail in email"
          :key="mail.documentId || mail.id"
          class="contacts-popover__link"
        >
          <Icon v-if="mail.isEmail" name="material-symbols:mail-outline" />
          <a v-if="mail.isEmail" :href="`mailto:${mail.email}`">{{ mail.email }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.contacts-popover {
  interpolate-size: allow-keywords;   // анимация height: auto (в FF/Safari — мгновенно)

  // Триггер — иконка-плашка на оси пагинации: та же «канавка» и подложка
  &__trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--axis-h);
    height: var(--axis-h);
    // Сброс паддингов/min-height UButton (btn_plain), иначе плашка не круглая
    min-height: 0;
    padding: 0;
    // Фона достаточно: без рамки и без светового блика по краю
    border: none;
    border-radius: 50%;
    color: var(--primary-color);
    background-color: var(--light-color-transparent);
    backdrop-filter: blur(4px);
    font-size: toRem(20);
    anchor-name: --contacts-popover;   // якорь для дропдауна (Anchor Positioning)
    transition:
      color var(--transition-duration),
      border-color var(--transition-duration);

    @include hover {
      color: var(--warning-hover);
      border-color: var(--green-color);
    }
  }

  // Дропдаун в top-layer (fixed + инсеты от якоря)
  &__dropdown {
    position: fixed;
    margin: 0;
    inset: auto;
    margin-block-end: toRem(6);
    position-anchor: --contacts-popover;
    // Вверх, расширяясь вправо: триггер у ЛЕВОГО края плашки
    position-area: top span-right;
    position-try-fallbacks: flip-block;

    opacity: 0;
    transition:
      opacity 0.3s,
      overlay 0.3s allow-discrete,
      display 0.3s allow-discrete;

    &:popover-open {
      opacity: 1;
    }

    @starting-style {
      &:popover-open {
        opacity: 0;
      }
    }
  }

  // Карточка контактов — визуал как у ховер-карточки в шапке
  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: toEm(8);
    padding: toRem(6) toRem(12) toRem(12);
    white-space: nowrap;
    border-radius: toRem(4);
    color: var(--color);
    background-color: var(--secondary-color);
    box-shadow: 0 toRem(4) toRem(12) rgba(0, 0, 0, 0.1);
    // Плавное раскрытие высоты: height: auto интерполируется interpolate-size
    // (на [popover] display задавать нельзя — height живёт на карточке)
    height: 0;
    overflow: hidden;
    transition: height 0.3s;
  }

  &__dropdown:popover-open &__card {
    height: auto;
  }

  @starting-style {
    &__dropdown:popover-open &__card {
      height: 0;
    }
  }

  &__link {
    width: 100%;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    justify-items: end;
    column-gap: toRem(9);
    padding-block: toRem(4);
    padding-inline: toRem(9);
    border-radius: toRem(4);
    font-size: toRem(18);
    font-weight: 500;
    border: 2px solid currentColor;

    svg {
      font-size: toRem(18);
    }

    @include hover {
      color: var(--light-color);
      border-color: var(--success-color);
      background-color: var(--danger-color);
      transition: background-color var(--transition-duration);
    }
  }
}
</style>
