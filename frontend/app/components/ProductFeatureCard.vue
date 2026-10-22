<script setup lang="ts">
/**
 * ВРЕМЕННО (демо): мобильная композиция карточки по референсу.
 * Фото сверху → пилюля → тёмная панель наезжает на фото → зелёная панель с цитатой
 * ниже, уже и со сдвигом вправо (между блоками воздух).
 */
interface Props {
  product: Product
}

const props = defineProps<Props>()

const isSale = computed(() => Boolean(props.product?.isDiscount))
</script>

<template>
  <article :class="['fcard', { 'fcard_sale': isSale }]">
    <div class="fcard__photo">
      <UImage
        v-if="product?.image?.length"
        class="fcard__image"
        :src="product.image[0]?.url"
        :alt="product.name"
        width="360"
        height="270"
        type="product"
      />
      <span class="fcard__pill">{{ isSale ? "SALE" : "NEW" }}</span>
    </div>

    <div class="fcard__panel">
      <h3 class="fcard__name">{{ product?.name || "Product" }}</h3>
      <p class="fcard__desc">
        Fresh harvest, delivered in a day. Taste the season while it is still
        warm from the field.
      </p>
    </div>

    <div class="fcard__quote">
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
  display: flex;
  flex-direction: column;
  max-width: toRem(360);
}

.fcard__photo {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: toEm(20);
  overflow: hidden;
  background-color: var(--whitesmoke-color);

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

// Пилюля на фото, у верхнего края
.fcard__pill {
  position: absolute;
  top: toEm(10);
  left: toEm(10);
  padding: toEm(4) toEm(10);
  border-radius: toEm(40);
  background-color: var(--success-color);
  color: var(--dark-color);
  font-size: toEm(10);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;

  .fcard_sale & {
    background-color: var(--warning-color);
  }
}

// Тёмная панель заходит на фото
.fcard__panel {
  position: relative;
  z-index: 2;
  margin: toEm(-26) toEm(8) 0 toEm(10);
  padding: toEm(14);
  border-radius: toEm(18);
  background-color: var(--color);
  color: var(--light-color);
}

.fcard__name {
  margin: 0;
  font-size: toEm(15);
  font-weight: 700;
  line-height: 1.2;
}

.fcard__desc {
  margin: toEm(6) 0 0;
  font-size: toEm(10);
  line-height: 1.5;
  opacity: 0.85;
}

// Зелёная панель: ниже, уже и со сдвигом вправо — между блоками воздух
.fcard__quote {
  position: relative;
  width: calc(100% - toEm(34));
  margin: toEm(14) 0 0 auto;
  padding: toEm(12) toEm(14);
  border-radius: toEm(18);
  background-color: var(--success-color);
  color: var(--dark-color);

  &::before {
    content: "“";
    position: absolute;
    top: toEm(2);
    left: toEm(8);
    font-size: toEm(20);
    line-height: 1;
    opacity: 0.25;
  }
}

.fcard__quote-text {
  margin: 0;
  padding-inline-start: toEm(8);
  font-size: toEm(10);
  font-style: italic;
  line-height: 1.35;
}

.fcard__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: toEm(6);
  margin-block-start: toEm(8);
  padding-block-start: toEm(7);
  border-block-start: toEm(1) solid color-mix(in srgb, var(--dark-color) 20%, transparent);
}

.fcard__price {
  font-size: toEm(15);
  font-weight: 700;
}

.fcard__plus {
  display: grid;
  place-items: center;
  width: toEm(26);
  height: toEm(26);
  border-radius: 50%;
  background-color: var(--dark-color);
  color: var(--light-color);
  font-size: toEm(15);
  font-weight: 600;
  line-height: 1;
}
</style>
