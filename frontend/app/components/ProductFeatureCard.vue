<script setup lang="ts">
/**
 * ВРЕМЕННО (демо): карточка по схеме «Inverted Mask Effect».
 *
 * Эффект — на САМОЙ КАРТОЧКЕ: её силуэт вырезан в двух местах
 * (сверху по центру — под лейбл, снизу справа — под цитату).
 * Плашки — отдельные элементы внутри вырезов с зазором, поэтому
 * фон «обтекает» их (видно подложку сквозь зазор).
 */
interface Props {
  product: Product
}

const props = defineProps<Props>()

const isSale = computed(() => Boolean(props.product?.isDiscount))

const shortName = computed(() => (props.product?.name ?? "Product").split(" ")[0])
</script>

<template>
  <article :class="['fcard', { 'fcard_sale': isSale }]">
    <!-- Поверхность с вырезами под плашки -->
    <div class="fcard__surface">
      <UImage
        v-if="product?.image?.length"
        class="fcard__image"
        :src="product.image[0]?.url"
        :alt="product.name"
        width="360"
        height="450"
        type="product"
      />
      <div class="fcard__meta">
        <h3 class="fcard__name">{{ product?.name || "Product" }}</h3>
        <p class="fcard__desc">
          Fresh harvest, delivered in a day. Taste the season.
        </p>
      </div>
    </div>

    <!-- Лейбл: в верхнем вырезе -->
    <span class="fcard__label">{{ shortName }}</span>

    <!-- Цитата: в нижнем правом вырезе -->
    <div class="fcard__quote">
      <span class="fcard__quote-mark fcard__quote-mark_open">“</span>
      <p class="fcard__quote-text">«Свежий вкус лета — в каждом кусочке»</p>
      <div class="fcard__row">
        <span class="fcard__price">{{
          product ? formatPrice(product.price) : "0,00"
        }}</span>
        <span class="fcard__plus">+</span>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.fcard {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  container-type: inline-size;
}

// Вырез: скруглённый прямоугольник (mask-composite: exclude убирает его из карточки)
$notch: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><rect x="0" y="0" width="100" height="100" rx="18"/></svg>');

// --- Поверхность карточки: фото + маска с двумя вырезами ---
.fcard__surface {
  position: absolute;
  inset: 0;
  border-radius: toEm(22);
  overflow: hidden;
  // Тёмная поверхность: вырезы (прозрачные) показывают светлый фон страницы,
  // поэтому «обтекание» читается
  background-color: var(--dark-color);
  mask-image: $notch, $notch, linear-gradient(#000 0 0);
  mask-size: 64% 13%, 62% 21%, 100% 100%;
  mask-position: top 12px center, bottom 12px right 12px, 0 0;
  mask-repeat: no-repeat;
  mask-composite: exclude, exclude, add;

  :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.fcard__image {
  display: block;
  width: 100%;
  height: 100%;
}

.fcard__meta {
  position: absolute;
  inset-inline: 0;
  top: 22%;
  padding: 0 toEm(18);
  color: var(--light-color);
  text-align: center;
}

.fcard__name {
  margin: 0;
  font-size: toEm(18);
  font-weight: 700;
  line-height: 1.15;
}

.fcard__desc {
  margin: toEm(6) 0 0;
  font-size: toEm(11);
  line-height: 1.4;
  opacity: 0.75;
}

// --- Лейбл: в верхнем вырезе, с зазором 4px ---
.fcard__label {
  position: absolute;
  top: toRem(16);
  left: 50%;
  translate: -50% 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(64% - #{toRem(8)});
  height: calc(13% - #{toRem(8)});
  border-radius: toEm(12);
  background-color: var(--success-color);
  color: var(--dark-color);
  font-size: clamp(9px, 2.2cqw, 13px);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  .fcard_sale & {
    background-color: var(--warning-color);
  }
}

// --- Цитата: в нижнем правом вырезе, с зазором 4px ---
.fcard__quote {
  position: absolute;
  right: toRem(16);
  bottom: toRem(16);
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: calc(62% - #{toRem(8)});
  height: calc(21% - #{toRem(8)});
  padding: toEm(10) toEm(12);
  border-radius: toEm(12);
  background-color: var(--success-color);
  color: var(--dark-color);
}

.fcard__quote-mark {
  position: absolute;
  top: toEm(2);
  left: toEm(8);
  font-size: toEm(18);
  line-height: 1;
  opacity: 0.25;
}

.fcard__quote-text {
  margin: 0;
  padding-inline-start: toEm(8);
  font-size: clamp(8px, 1.9cqw, 11px);
  font-style: italic;
  line-height: 1.3;
}

.fcard__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: toEm(6);
  margin-block-start: toEm(6);
}

.fcard__price {
  font-size: toEm(15);
  font-weight: 700;
}

.fcard__plus {
  display: grid;
  place-items: center;
  width: toEm(24);
  height: toEm(24);
  border-radius: 50%;
  background-color: var(--dark-color);
  color: var(--light-color);
  font-size: toEm(14);
  font-weight: 600;
  line-height: 1;
}
</style>
