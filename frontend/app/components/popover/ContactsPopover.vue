<script setup lang="ts">
import { VISIBILITY_KEY } from "#shared/utils/visibility";

const props = defineProps<{
  email: Email[];
  phones: Phone[];
}>();

// Видимость контактов — глобальное состояние из app.vue (provide/inject):
// на него реагируют HeroSection/HeroGrids, а здесь поповер показывается/скрывается
const { isContacts } = inject<VisibilityState>(VISIBILITY_KEY)!;

const popoverRef = useTemplateRef<HTMLElement>("contacts-popover");

const { open, close } = usePopover("contacts", popoverRef);

// Показываем поповер, когда isContacts (ховер на «Контакты» в навигации)
watch(isContacts, (visible) => {
  if (visible) open();
  else close();
});
</script>

<template>
  <!-- popover="manual": закрытие только уходом мыши (без light-dismiss).
       Позиция — Anchor Positioning относительно ссылки «Контакты» (--contacts-anchor).
       Поповер — DOM-потомок li: пока курсор над ним (в т.ч. над ::before-мостом),
       mouseleave на li не срабатывает и дропдаун не закрывается -->
  <div ref="contacts-popover" popover="manual" class="contacts-popover">
    <div class="contacts-popover__card">
      <div
        v-for="phone in phones"
        :key="phone.documentId || phone.id"
        class="contacts-popover__link"
      >
        <Icon v-if="phone.isMobile" name="et:phone" />
        <Icon v-if="!phone.isMobile" name="carbon:phone-ip" />
        <a :href="`tel:${phone.phoneNumber.replace(/[^0-9+]/g, '')}`">{{ formatPhone(phone.phoneNumber) }}</a>
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
</template>

<style lang="scss" scoped>
.contacts-popover {
  position: fixed;
  margin: 0;
  inset: auto;
  margin-block-start: toRem(4);
  position-anchor: --contacts-anchor;
  // span-left: правый край поповера у правого края ссылки, расширение влево —
  // ссылка у правого края экрана, иначе поповер переполнял бы вьюпорт (браузер зажимает)
  position-area: bottom span-left;

  // Мост: продолжает хит-зону поповера вверх, в зазор между ссылкой и карточкой.
  // Без него при переходе курсора со ссылки на дропдаун сработает mouseleave на li
  // и дропдаун закроется (мышь не успеет дотянуться)
  &::before {
    content: "";
    position: absolute;
    top: toRem(-4);
    inset-inline: 0;
    height: toRem(4);
  }

  // Мобильный: ховер не нужен (на тач-устройствах клик конфликтует с переходом
  // на /contacts), контакты доступны через страницу /contacts.
  // display: none не даёт поповеру открыться (showPopover игнорируется)
  @media (max-width: $tablet) {
    display: none;
  }

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: toEm(8);
    padding-inline: toRem(12);
    padding-block-start: toRem(12);
    padding-block-end: toRem(6);
    white-space: nowrap;
    border-radius: toRem(4);
    color: var(--color);
    background-color: var(--secondary-color);
  }

  &__link {
    width: toRem(236);
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    justify-items: end;
    column-gap: toRem(9);
    padding-inline: toRem(9);
    padding-block: toRem(1);
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
