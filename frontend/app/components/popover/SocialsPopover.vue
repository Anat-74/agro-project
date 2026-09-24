<script setup lang="ts">
import { buttonTranslations } from "~/locales/button";

// Самостоятельный попап соцсетей для нижней кромки панели каталога:
// триггер-иконка внутри компонента, открытие по клику — нативный Popover API.
// Список и подписи — данные Strapi (`global.socials`), локализуются в CMS
const props = defineProps<{
  socials: SocialLink[];
}>();

const { currentLocale } = useLocale();
const buttonT = computed(() => buttonTranslations[currentLocale.value]);

// id поповера уникален для каждого экземпляра (правило style guide §14)
const popoverId = `socials-popover-${useId()}`;
</script>

<template>
  <div class="socials-popover">
    <UButton
      variant="plain"
      class="socials-popover__trigger"
      :popovertarget="popoverId"
      :aria-label="buttonT.ariaLabelSocials"
    >
      <Icon name="mingcute:share-2-line" />
    </UButton>
    <!-- Поповер — в top-layer: не режется overflow панели. Раскрывается ВВЕРХ,
         расширяясь ВЛЕВО (триггер у правого края плашки), с переворотом flip-block -->
    <div :id="popoverId" popover class="socials-popover__dropdown">
      <ul v-if="props.socials.length" class="socials-popover__card">
        <li v-for="link in props.socials" :key="link.documentId || link.id">
          <a
            class="socials-popover__link"
            :href="link.href"
            target="_blank"
            rel="noopener"
          >
            <UImage
              v-if="link?.icon"
              :src="link.icon[0]?.url"
              :alt="link.label"
              :smooth-load="false"
              width="24"
              height="24"
              type="icon"
            />
            <span>{{ link.label }}</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.socials-popover {
  interpolate-size: allow-keywords;   // анимация height: auto (в FF/Safari — мгновенно)

  // Триггер — иконка-плашка на оси пагинации (та же «канавка», что у точек)
  &__trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--axis-h);
    height: var(--axis-h);
    // Сброс паддингов/min-height UButton (btn_plain), иначе плашка не круглая
    min-height: 0;
    padding: 0;
    border: toRem(1) solid rgba(0, 0, 0, 0.25);
    border-radius: 50%;
    color: var(--primary-color);
    background-color: var(--light-color-transparent);
    backdrop-filter: blur(4px);
    box-shadow: 0 toRem(1) 0 rgba(255, 255, 255, 0.4);
    font-size: toRem(20);
    anchor-name: --socials-popover;   // якорь для дропдауна (Anchor Positioning)
    transition:
      color var(--transition-duration),
      border-color var(--transition-duration);

    @include hover {
      color: var(--warning-hover);
      border-color: var(--green-color);
    }
  }

  // Дропдаун в top-layer: fixed, позиция — от якоря
  &__dropdown {
    position: fixed;
    margin: 0;
    inset: auto;
    margin-block-end: toRem(6);
    position-anchor: --socials-popover;
    // Вверх, расширяясь влево: триггер у ПРАВОГО края плашки
    position-area: top span-left;
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

  // Карточка со списком соцсетей — визуал как у попапа «Ещё» в шапке
  &__card {
    display: flex;
    flex-direction: column;
    gap: toRem(2);
    min-width: toRem(180);
    padding: toRem(4);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(4);
    background-color: var(--secondary-color);
    box-shadow: 0 toRem(4) toRem(12) rgba(0, 0, 0, 0.1);
    // Плавное раскрытие высоты (height на карточке, не на [popover])
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
    display: flex;
    align-items: center;
    column-gap: toEm(10);
    padding: toRem(6) toRem(12);
    color: var(--color);
    text-decoration: none;
    border-radius: toRem(4);
    white-space: nowrap;

    :deep(img) {
      width: toRem(22);
      height: toRem(22);
    }

    @include hover {
      background: var(--bg);
    }
  }
}
</style>
