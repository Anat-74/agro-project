<script setup lang="ts">
// Единая таблица «подпись → значение» для всего проекта.
// Эталон вида — характеристики товара: фон строки --whitesmoke-color,
// разделитель строк --light-color, значения по левому краю.
// Подписи — <th scope="row"> (семантика), caption при необходимости скрывается.
interface ValueTableRow {
  label: string;
  value: string | number;
}

interface Props {
  rows: ValueTableRow[];
  caption?: string;
  captionHidden?: boolean;
  labelWidth?: string;
  /** muted — как в характеристиках товара; plain — светлый фон и тёмный разделитель */
  variant?: "muted" | "plain";
}

const props = withDefaults(defineProps<Props>(), {
  caption: "",
  captionHidden: true,
  labelWidth: "60%",
  variant: "muted",
});
</script>

<template>
  <table :class="['value-table', `value-table_${props.variant}`]">
    <caption
      v-if="props.caption"
      :class="['value-table__caption', { 'visually-hidden': props.captionHidden }]"
    >
      {{ props.caption }}
    </caption>

    <tbody>
      <tr
        v-for="(row, index) in props.rows"
        :key="index"
        class="value-table__row"
      >
        <th
          scope="row"
          class="value-table__label"
          :style="{ width: props.labelWidth }"
        >
          {{ row.label }}
        </th>
        <td class="value-table__value">{{ row.value }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss" scoped>
.value-table {
  width: 100%;

  // Разделители строк — не border у <tr>: в табличной модели separate (по умолчанию)
  // границы строк не рисуются. Строки разделяют фон и зазоры между ячейками
  &__row {
    background-color: var(--whitesmoke-color);
  }

  // text-align: left — потому что th по умолчанию центрируется
  &__label {
    padding-inline: toEm(8);
    padding-block: toEm(8);
    text-align: left;
    font-weight: 600;
  }

  &__value {
    padding-inline: toEm(8);
  }

  // Вариант для калькулятора: светлый фон строк (зазоры-разделители на нём
  // не видны) и увеличенные вертикальные отступы ячеек
  &_plain {
    .value-table__row {
      background-color: var(--light-color);
    }

    .value-table__label,
    .value-table__value {
      padding-block: toEm(13);
    }
  }
}
</style>
