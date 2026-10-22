<script setup lang="ts">
/**
 * ВРЕМЕННО (демо): карточка с инвертированным радиусом.
 * Техника 1:1 из css-tip.com/inverted-radius (Temani Afif):
 * mask из 4 слоёв, --r (радиус), --s (выемка). Поверхность квадратная —
 * при не-квадратном аспекте позиции маски (%/px) ломаются.
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
    <div class="fcard__surface">
      <UImage
        v-if="product?.image?.length"
        class="fcard__image"
        :src="product.image[0]?.url"
        :alt="product.name"
        width="360"
        height="360"
        type="product"
      />
      <div class="fcard__meta">
        <h3 class="fcard__name">{{ product?.name || "Product" }}</h3>
        <p class="fcard__desc">Fresh harvest, delivered in a day.</p>
      </div>
    </div>

    <span class="fcard__label">{{ shortName }}</span>

    <div class="fcard__quote">
      <span class="fcard__quote-mark">“</span>
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
  // Квадрат — обязательное условие для этой маски (позиции %/px)
  aspect-ratio: 1;
  container-type: inline-size;
}

// Маска — 1:1 из первоисточника (вырез в правом верхнем углу)
.fcard__surface {
  --r: toEm(24);
  --s: toEm(96);

  position: absolute;
  inset: 0;
  border-radius: var(--r);
  background-color: var(--dark-color);

  --_m: / calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%) no-repeat;
  mask:
    right calc(var(--s) + var(--r)) top 0 var(--_m),
    right calc(var(--s) + var(--r)) var(--_m),
    radial-gradient(var(--s) at 100% 0, #0000 99%, #000 calc(100% + 1px))
      calc(-1 * var(--r)) var(--r) no-repeat,
    conic-gradient(
        at calc(100% - var(--s) - 2 * var(--r)) calc(var(--s) + 2 * var(--r)),
        #0000 25%,
        #000 0
      );

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
  bottom: toEm(26);
  padding: 0 toEm(16);
  color: var(--light-color);
  text-align: center;
  pointer-events: none;
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

// Лейбл — в вырезе (правый верхний угол), зазор 8px
.fcard__label {
  position: absolute;
  top: toRem(8);
  right: toRem(8);
  display: flex;
  align-items: center;
  justify-content: center;
  width: toEm(96);
  height: toEm(96);
  border-radius: toEm(14);
  background-color: var(--success-color);
  color: var(--dark-color);
  font-size: clamp(10px, 2.6cqw, 14px);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;

  .fcard_sale & {
    background-color: var(--warning-color);
  }
}

// Цитата — внизу (вне выреза, как в референсе)
.fcard__quote {
  position: absolute;
  right: toRem(8);
  bottom: toRem(8);
  left: toRem(8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: toEm(10) toEm(12);
  border-radius: toEm(14);
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
  margin-block-start: toEm(4);
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
