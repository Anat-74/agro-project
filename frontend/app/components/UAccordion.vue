<script setup lang="ts">
interface Props {
  // Нативная группа <details> (name) — эксклюзивное раскрытие в пределах группы
  name?: string
  // Вариант оформления: обычная категория / подкатегория (компактнее) / акция
  variant?: 'default' | 'sub' | 'discount'
  // Активный пункт (текущий маршрут) — подсветка summary
  active?: boolean
}

withDefaults(defineProps<Props>(), {
  name: '',
  variant: 'default',
  active: false,
})
</script>

<template>
  <!-- Каркас аккордеона: <details> (summary) + отдельный блок контента.
       Контент намеренно ВНЕ <details>: нативный details скрывает всё, кроме
       summary, а нам нужна анимация раскрытия через grid-template-rows (0fr→1fr)
       по соседнему селектору .accordion__details[open] + .accordion__content. -->
  <details :name="name" class="accordion__details">
    <summary
      :class="[
        'accordion__summary',
        `accordion__summary_${variant}`,
        {
          'accordion__summary_is-discount': variant === 'discount',
          'accordion__summary_is-active': active,
        },
      ]"
    >
      <slot name="header" />
      <Icon class="accordion__chevron" name="mingcute:down-line" />
    </summary>
  </details>
  <div class="accordion__content">
    <slot />
  </div>
</template>

<style lang="scss">
// Стили аккордеона ГЛОБАЛЬНЫЕ (не scoped) намеренно: классы .accordion__*
// используются и Категориями, и Меню, а слот-контент (заголовки/картинки/ссылки
// товаров) объявляется в родителе — scoped-стили компонента до него не доходят.
// Классы специфичные, поэтому глобальная область безопасна.
.accordion {
  &__details {
    padding-block: toRem(2);
  }

  &__details[open] + &__content {
    grid-template-rows: 1fr;
  }

  &__details[open] {
    .accordion__summary {
      color: var(--danger-color);

      svg {
        rotate: -90deg;
        transition: rotate var(--transition-duration);
      }
    }
  }

  &__details:not([open]) {
    .accordion__summary {
      svg {
        transition: rotate var(--transition-duration);
      }
    }
  }

  &__summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: toEm(4);
    font-weight: 600;
    font-size: toEm(22);
    color: var(--primary-color);
    outline: toRem(2) var(--whitesmoke-color) inset;
    border-radius: toRem(4);
    background-color: var(--light-color-transparent);

    @include hover {
      color: var(--warning-color);
    }

    // Шеврон (рендерит компонент)
    .accordion__chevron {
      font-size: toRem(22);
    }

    &_is-discount {
      padding-inline: toEm(4);
      padding-block: toRem(6);
      outline: toRem(2) var(--light-color) outset;
      color: var(--danger-color);

      svg {
        color: var(--green-color);
      }

      @include hover {
        color: var(--danger-hover);
      }
    }

    &_is-active {
      color: var(--danger-color);
      font-weight: 700;

      svg {
        color: var(--danger-color);
      }
    }

    // Название ПОДКАТЕГОРИИ (h4 в слоте) — компактнее
    .accordion__product-sub-title {
      font-size: toEm(15);
    }
  }

  // ===== Подкатегория: компактнее категории =====
  // Категория: font 22px, img 44x32, pad 4, summary h≈43, icon 22.
  // Подкатегория — на 1px меньше шрифт, summary на -2px, картинка и шеврон меньше.
  &__summary_sub {
    font-size: toEm(21);
    margin-block-start: toEm(2);
    padding: toEm(3);
    max-width: calc(100% - toRem(2));

    .accordion__product-image {
      width: toRem(40);
      height: toRem(28);
    }

    .accordion__product-sub-title {
      font-weight: 700;
      line-height: toRem(24);
    }

    .accordion__chevron {
      font-size: toRem(19);
    }
  }

  // Содержимое подкатегории: вложенные товары смещены вправо (иерархия)
  &__item .accordion__content {
    .accordion__product-item {
      padding-inline-start: toEm(12);
    }
  }

  &__content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s;
  }

  &__product-list {
    overflow: hidden;
    color: var(--color);
  }

  &__product-link {
    display: grid;
    grid-template-columns: auto 1fr;
    justify-items: center;
    align-items: center;
    border-radius: toRem(8);
    padding-block-start: toRem(16);
    transition: all var(--transition-duration);

    &_is-discount {
      column-gap: toEm(4);
    }

    &_is-active {
      color: var(--danger-color);
      font-weight: 700;
    }

    @include hover {
      color: var(--gray-color);
      text-decoration: underline;
    }
  }

  &__product-sub-title {
    font-weight: 800;
  }

  &__product-title {
    &_is-active {
      color: var(--danger-color);
    }
  }
}
</style>
