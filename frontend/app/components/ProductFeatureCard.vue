<script setup lang="ts">
/**
 * ВРЕМЕННО (демо): 1:1 композиция по референсу (хамелеон).
 *
 * Геометрия относительно контейнера (aspect ≈ 2.12):
 *  - фото: слева, 63% ширины, вся высота;
 *  - зелёный лейбл: поверх фото, справа сверху (39%..60%, высота 21%);
 *  - тёмная панель: справа сверху (61%..100%), высота 66% — нахлёст на фото ~2%;
 *  - зелёная цитата: справа снизу (67%..100%), высота 33% — с зазором от тёмной.
 *
 * Текст масштабируется через cqw с нижним порогом читаемости.
 */
interface Props {
  product: Product
}

const props = defineProps<Props>()

const shortName = computed(() => {
  const name = props.product?.name ?? "Product"
  return name.split(" ")[0]
})
</script>

<template>
  <article class="fcard">
    <div class="fcard__photo">
      <UImage
        v-if="product?.image?.length"
        class="fcard__image"
        :src="product.image[0]?.url"
        :alt="product.name"
        width="480"
        height="360"
        type="product"
      />
    </div>

    <span class="fcard__label">{{ shortName }}</span>

    <div class="fcard__panel">
      <p class="fcard__text">
        Fresh harvest, delivered in a day. Taste the season while it is still
        warm from the field — every box is packed by hand and keeps its
        vitamins for days.
      </p>
    </div>

    <div class="fcard__quote">
      <span class="fcard__quote-mark fcard__quote-mark_open">“</span>
      <p class="fcard__quote-text">«Свежий вкус лета — в каждом кусочке»</p>
      <span class="fcard__quote-mark fcard__quote-mark_close">”</span>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.fcard {
  position: relative;
  width: 100%;
  aspect-ratio: 2.12 / 1;
  container-type: inline-size;
}

// Фото: слева, 63% ширины, вся высота
.fcard__photo {
  position: absolute;
  inset-block: 0;
  left: 0;
  width: 63%;
  border-radius: toEm(24);
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

// Зелёный лейбл поверх фото, справа сверху
.fcard__label {
  position: absolute;
  top: 0;
  left: 39%;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 21%;
  height: 21%;
  padding-inline: 2cqw;
  border-radius: toEm(12);
  background-color: var(--success-color);
  color: var(--dark-color);
  font-size: clamp(8px, 1.55cqw, 12px);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
}

// Тёмная панель: справа сверху, нахлёст на фото ~2%
.fcard__panel {
  position: absolute;
  top: 0;
  left: 61%;
  z-index: 2;
  width: 39%;
  height: 66%;
  display: flex;
  align-items: center;
  padding: clamp(8px, 2.2cqw, 18px);
  border-radius: toEm(22);
  background-color: var(--color);
  color: var(--light-color);
}

.fcard__text {
  margin: 0;
  font-size: clamp(8px, 1.45cqw, 12px);
  line-height: 1.5;
  text-align: justify;
}

// Зелёная панель цитаты: справа снизу, уже и с зазором
.fcard__quote {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 67%;
  z-index: 2;
  height: 33%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(8px, 2cqw, 16px);
  border-radius: toEm(22);
  background-color: var(--success-color);
  color: var(--light-color);
  text-align: center;
}

.fcard__quote-text {
  margin: 0;
  font-size: clamp(8px, 1.3cqw, 11px);
  font-style: italic;
  line-height: 1.35;
}

.fcard__quote-mark {
  position: absolute;
  font-size: clamp(14px, 2.6cqw, 22px);
  line-height: 1;
  opacity: 0.85;

  &_open {
    top: clamp(4px, 1cqw, 8px);
    left: clamp(6px, 1.4cqw, 12px);
  }

  &_close {
    right: clamp(6px, 1.4cqw, 12px);
    bottom: clamp(4px, 1cqw, 8px);
  }
}
</style>
