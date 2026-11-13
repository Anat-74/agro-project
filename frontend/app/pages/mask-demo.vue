<script setup lang="ts">
// Демо CSS-маски (inverted radius) для выреза под плашку «в корзину».
// Открыть: /mask-demo. Живая страница-объяснение: параметры, слои, расширения.
const size = ref(44)
const gap = ref(5)

const r = computed(() => (size.value / 4 + gap.value * 0.75).toFixed(2))
const s = computed(() => ((size.value + gap.value) / 2).toFixed(2))

const vars = computed(() => ({
  '--notch-size': `${size.value}px`,
  '--notch-gap': `${gap.value}px`,
}))

// Поверхность с теми же формулами, что в карточке
const surfaceStyle = computed(() => ({
  ...vars.value,
  '--notch-r': `calc(${size.value}px / 4 + ${gap.value}px * 0.75)`,
  '--notch-s': `calc((${size.value}px + ${gap.value}px) / 2)`,
}))

// «Как под кнопку», но в левом верхнем углу: варианты выреза.
// Координаты — как у карточки товара (172×250), чип внутри = контент.
// Вырез в левом верхнем углу = ТОЧНЫЙ поворот кнопочного на 180°.
// Проверено попиксельно (рендер маски): расхождение 0.
// Параметры кнопки в карточке: плашка 50.5, зазор 8 → s = 29.25, r = 14.625.
const tlVariants = [
  { key: 'copy', label: 'Точный поворот кнопки (без расширения)', extra: 0, chip: 'rot' },
  { key: 'w20', label: 'Тот же поворот, шире на 20 (под текст)', extra: 20, chip: 'rot' },
  { key: 'w40', label: 'Тот же поворот, шире на 40', extra: 40, chip: 'rot' },
  { key: 'w40-sq', label: 'Шире на 40, чип без скруглений', extra: 40, chip: 'sq' },
]

type TlVariant = (typeof tlVariants)[number]

const TL = { plate: 50.5, gap: 8 }

const tlMask = (v: TlVariant) => {
  const w = 172
  const h = 250
  const cardR = 14.625
  const s = (TL.plate + TL.gap) / 2
  const r = (TL.plate + TL.gap - s) / 2
  const xl = w - (s + 2 * r)
  const yt = h - 2 * s
  const xa = xl + s
  const ya = yt + s
  const e = v.extra
  const card = `M ${cardR},0 H ${w - cardR} A ${cardR},${cardR} 0 0 1 ${w},${cardR} V ${h - cardR} A ${cardR},${cardR} 0 0 1 ${w - cardR},${h} H ${cardR} A ${cardR},${cardR} 0 0 1 0,${h - cardR} V ${cardR} A ${cardR},${cardR} 0 0 1 ${cardR},0 Z`
  // (x,y) → (W−x, H−y), sweep НЕ меняются. Расширение сдвигает только правую
  // часть (дутую), левый угол карточки не трогаем.
  const cut = `M ${w - xl + e},${h - ya} A ${s},${s} 0 0 1 ${w - xa + e},${h - yt} H ${r} A ${r},${r} 0 0 0 0,${h - yt + r} V 0 H ${w - (xl - r) + e} A ${r},${r} 0 0 0 ${w - xl + e},${r} Z`
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='none'><path fill-rule='evenodd' fill='#fff' d='${card} ${cut}'/></svg>`
  return {
    maskImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
  }
}

// Чип = «перевёрнутая плашка кнопки»: TL 14.625 (BR плашки), TR/BL 12,
// BR = дуга − зазор = 21.25 (TL плашки).
const tlChip = (v: TlVariant) => {
  const base = {
    width: `${((TL.plate + v.extra) / 172) * 100}%`,
    height: `${(TL.plate / 250) * 100}%`,
  }
  if (v.chip === 'sq') return { ...base, borderRadius: '0' }
  const s = (TL.plate + TL.gap) / 2
  return {
    ...base,
    borderRadius: '14.625px 12px 0 12px',
    borderBottomRightRadius: `${s - TL.gap}px`,
  }
}
</script>

<template>
  <section class="mask-demo">
    <h1 class="mask-demo__title">Маска выреза: как это работает</h1>
    <p class="mask-demo__hint">
      Маска — это альфа-канал: элемент виден там, где слой маски непрозрачный. Пять слоёв
      складываются в один вырез, а плашка лежит поверх отдельным элементом.
    </p>

    <form class="mask-demo__controls" @submit.prevent>
      <label class="mask-demo__control">
        <span>Плашка: {{ size }}px</span>
        <input v-model.number="size" type="range" min="32" max="64" step="1">
      </label>
      <label class="mask-demo__control">
        <span>Зазор: {{ gap }}px</span>
        <input v-model.number="gap" type="range" min="2" max="12" step="1">
      </label>
      <p class="mask-demo__formula">
        r = size / 4 + 0.75 · gap = <strong>{{ r }}px</strong><br>
        s = (size + gap) / 2 = <strong>{{ s }}px</strong>
      </p>
    </form>

    <section class="mask-demo__section">
      <h2 class="mask-demo__subtitle">1. Поверхность карточки (как в проде)</h2>
      <div class="mask-demo__stage">
        <div class="mask-demo__card" :style="surfaceStyle">
          <div class="mask-demo__surface">
            <div class="mask-demo__inner">
              <p class="mask-demo__inner-text">Карточка</p>
              <p class="mask-demo__inner-note">
                маска на поверхности, контент — во вложенном слое
              </p>
            </div>
          </div>
          <div class="mask-demo__plate">
            <Icon name="mdi:cart-arrow-right" />
          </div>
        </div>
      </div>
      <p class="mask-demo__caption">
        `__surface` перевёрнут по Y (маска всегда режет правый верхний угол), поэтому у карточки
        вырез оказывается справа снизу. Плашка — соседний элемент выше маски, её координаты
        считаются от тех же `--notch-*`.
      </p>
    </section>

    <section class="mask-demo__section">
      <h2 class="mask-demo__subtitle">2. Что делает каждый параметр</h2>
      <ul class="mask-demo__params">
        <li class="mask-demo__param">
          <div class="mask-demo__stage mask-demo__stage_tight">
            <div class="mask-demo__card mask-demo__card_mini mask-demo__card_s-less">
              <div class="mask-demo__surface" />
            </div>
          </div>
          <p class="mask-demo__caption">
            <strong>s меньше</strong> — вырез мельче: дуга ближе к кромкам, «дырка» меньше.
          </p>
        </li>
        <li class="mask-demo__param">
          <div class="mask-demo__stage mask-demo__stage_tight">
            <div class="mask-demo__card mask-demo__card_mini mask-demo__card_s-more">
              <div class="mask-demo__surface" />
            </div>
          </div>
          <p class="mask-demo__caption">
            <strong>s больше</strong> — вырез глубже: кромка уходит дальше от угла.
          </p>
        </li>
        <li class="mask-demo__param">
          <div class="mask-demo__stage mask-demo__stage_tight">
            <div class="mask-demo__card mask-demo__card_mini mask-demo__card_r-less">
              <div class="mask-demo__surface" />
            </div>
          </div>
          <p class="mask-demo__caption">
            <strong>r меньше</strong> — углы кромок острее, вырез «жёстче».
          </p>
        </li>
        <li class="mask-demo__param">
          <div class="mask-demo__stage mask-demo__stage_tight">
            <div class="mask-demo__card mask-demo__card_mini mask-demo__card_r-more">
              <div class="mask-demo__surface" />
            </div>
          </div>
          <p class="mask-demo__caption">
            <strong>r больше</strong> — кромки плавнее, вырез «мягче».
          </p>
        </li>
      </ul>
    </section>

    <section class="mask-demo__section">
      <h2 class="mask-demo__subtitle">3. Куда расширять</h2>
      <ul class="mask-demo__variants">
        <li class="mask-demo__variant">
          <div class="mask-demo__stage mask-demo__stage_tight">
            <div class="mask-demo__card mask-demo__card_mirror">
              <div class="mask-demo__surface mask-demo__surface_mirror">
                <div class="mask-demo__inner mask-demo__inner_mirror">
                  <p class="mask-demo__inner-text">Слева снизу</p>
                </div>
              </div>
              <div class="mask-demo__plate mask-demo__plate_left">
                <Icon name="mdi:cart-arrow-right" />
              </div>
            </div>
          </div>
          <p class="mask-demo__caption">
            Другое зеркало: `scale(-1, -1)` → вырез слева снизу. Контент и плашка
            разворачиваются обратно.
          </p>
        </li>
        <li class="mask-demo__variant">
          <div class="mask-demo__stage mask-demo__stage_tight">
            <div class="mask-demo__card mask-demo__card_deep">
              <div class="mask-demo__surface">
                <div class="mask-demo__inner">
                  <p class="mask-demo__inner-text">Глубокий вырез</p>
                </div>
              </div>
            </div>
          </div>
          <p class="mask-demo__caption">
            Другая геометрия из тех же переменных: `--notch-size: 30px`, `--notch-gap: 18px` —
            широкий мелкий вырез под язык шторки или панели.
          </p>
        </li>
      </ul>
    </section>

    <section class="mask-demo__section">
      <h2 class="mask-demo__subtitle">3b. Вырез как под кнопку, но слева сверху</h2>
      <p class="mask-demo__hint">
        Одна схема: примыкание к кромкам, зазор 8px, дуга на внутреннем угле,
        скругления материала наружу. Чип внутри = будущий контент (статус).
      </p>
      <ul class="mask-demo__params">
        <li v-for="v in tlVariants" :key="v.key" class="mask-demo__param">
          <div class="mask-demo__stage mask-demo__stage_tight">
            <div class="mask-demo__tlCard" :style="tlMask(v)">
              <div class="mask-demo__tlChip" :style="tlChip(v)">
                <span>Под заказ</span>
              </div>
            </div>
          </div>
          <p class="mask-demo__caption">{{ v.label }}</p>
        </li>
      </ul>
    </section>

    <section class="mask-demo__section">
      <h2 class="mask-demo__subtitle">4. Как устроены пять слоёв</h2>
      <ol class="mask-demo__notes mask-demo__notes_ordered">
        <li>Диск 2r у верхней кромки — возвращает материал и даёт скругление r.</li>
        <li>Тот же диск, сдвинутый на 2s вниз — скругление на правой кромке.</li>
        <li>Круг радиусом s с прозрачной серединой — сам вырез (единственная «дырка» в маске).</li>
        <li>Конический градиент (25% прозрачности) срезает прямой угол слева от выреза.</li>
        <li>Второй конический срез — снизу. В сумме получается ровный вогнутый угол.</li>
      </ol>
    </section>

    <section class="mask-demo__section">
      <h2 class="mask-demo__subtitle">5. Ограничения, о которых стоит помнить</h2>
      <ul class="mask-demo__notes">
        <li>Маска обрезает всё поддерево, включая контент — поэтому внутри карточки отдельный слой.</li>
        <li>Маска не влияет на попадание курсора: «дырка» всё ещё кликабельна, плашку делаем отдельным элементом.</li>
        <li>`translateZ(0)` и промоут слоя внутри маскированного элемента ломают маску (проверено на карточке).</li>
        <li>Геометрия в px, не в процентах: при ресайзе пересчитывайте `--notch-r`/`--notch-s` из `--notch-size` и `--notch-gap`.</li>
        <li>В проде к формулам добавлена мелкая поправка под рендер телефона (см. `.kilo/plans/cards-notch.md`).</li>
        <li>Альтернативы на будущее: `clip-path: shape()` и `corner-shape: scoop` — пока не во всех браузерах.</li>
      </ul>
    </section>
  </section>
</template>

<style lang="scss" scoped>
.mask-demo {
  display: flex;
  flex-direction: column;
  gap: toRem(28);
  max-width: toRem(760);
  margin-inline: auto;
  padding-block: toRem(32);
  padding-inline: toRem(16);
  color: var(--color);

  &__title {
    font-size: toRem(26);
    font-weight: 700;
  }

  &__hint,
  &__caption,
  &__notes {
    font-size: toRem(14);
    line-height: 1.5;
    color: var(--gray-color);
  }

  &__controls {
    display: grid;
    gap: toRem(12);
    padding: toRem(16);
    border: toRem(1) solid var(--whitesmoke-color);
    border-radius: toRem(10);
    background-color: var(--light-color);
  }

  &__control {
    display: grid;
    gap: toRem(6);
    font-size: toRem(14);

    input {
      width: 100%;
      accent-color: var(--success-color);
    }
  }

  &__formula {
    font-size: toRem(14);
    padding-block-start: toRem(8);
    border-block-start: toRem(1) solid var(--whitesmoke-color);
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: toRem(12);
  }

  &__subtitle {
    font-size: toRem(18);
    font-weight: 600;
  }

  // Тёмная подложка: вырез должен быть виден (на светлом он «исчезает»)
  &__stage {
    display: flex;
    justify-content: center;
    padding: toRem(20);
    border-radius: toRem(12);
    background-color: var(--color);

    &_tight {
      padding: toRem(12);
    }
  }

  &__card {
    position: relative;
    width: toRem(200);
    height: toRem(280);
    --notch-r: calc(var(--notch-size, 44px) / 4 + var(--notch-gap, 5px) * 0.75);
    --notch-s: calc((var(--notch-size, 44px) + var(--notch-gap, 5px)) / 2);

    &_mini {
      width: toRem(150);
      height: toRem(210);
      --notch-r: calc((var(--notch-size, 44px) + var(--notch-gap, 5px)) * 0.32);
      --notch-s: calc((var(--notch-size, 44px) + var(--notch-gap, 5px)) * 0.5);
    }

    &_s-less {
      --notch-s: calc((var(--notch-size, 44px) + var(--notch-gap, 5px)) * 0.38);
    }

    &_s-more {
      --notch-s: calc((var(--notch-size, 44px) + var(--notch-gap, 5px)) * 0.62);
    }

    &_r-less {
      --notch-r: calc((var(--notch-size, 44px) + var(--notch-gap, 5px)) * 0.16);
    }

    &_r-more {
      --notch-r: calc((var(--notch-size, 44px) + var(--notch-gap, 5px)) * 0.48);
    }

    &_mirror {
      --notch-size: 44px;
      --notch-gap: 5px;
    }

    &_deep {
      --notch-size: 30px;
      --notch-gap: 18px;
    }
  }

  &__surface {
    position: absolute;
    inset: 0;
    transform: scaleY(-1);
    border-radius: var(--notch-r);
    background-color: var(--light-color);
    @include invertedRadius(var(--notch-r), var(--notch-s));

    &_mirror {
      transform: scale(-1, -1);
    }
  }

  &__inner {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    gap: toRem(6);
    justify-content: center;
    padding: toRem(20);
    border: toRem(2) solid var(--whitesmoke-color);
    border-radius: var(--notch-r);
    transform: scaleY(-1);

    &_mirror {
      transform: scale(-1, -1);
    }
  }

  &__inner-text {
    font-size: toRem(14);
    font-weight: 700;
  }

  &__inner-note {
    font-size: toRem(12);
    color: var(--gray-color);
  }

  &__plate {
    position: absolute;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--notch-size);
    height: var(--notch-size);
    right: var(--notch-gap);
    bottom: 0;
    border: toRem(1) solid var(--success-color);
    border-radius: var(--notch-r);
    border-top-left-radius: calc(var(--notch-r) + var(--notch-gap));
    background-color: var(--light-color);
    color: var(--green-color);

    svg {
      font-size: calc(var(--notch-size) * 0.45);
    }

    &_left {
      right: auto;
      left: var(--notch-gap);
      border-top-left-radius: var(--notch-r);
      border-top-right-radius: calc(var(--notch-r) + var(--notch-gap));
    }
  }

  &__params,
  &__variants {
    display: grid;
    gap: toRem(16);
    grid-template-columns: repeat(auto-fit, minmax(toRem(180), 1fr));
  }

  &__param,
  &__variant {
    display: flex;
    flex-direction: column;
    gap: toRem(8);
  }

  // Карточка 1:1 (координаты выреза — как у товарной карточки)
  &__tlCard {
    position: relative;
    width: toRem(172);
    height: toRem(250);
    background-color: var(--light-color);
  }

  // Чип внутри выреза: примыкает к верхней/левой кромкам, фон — как у карточки
  &__tlChip {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    display: grid;
    place-items: center;
    border-radius: toRem(10);
    background-color: var(--light-color);
    color: var(--danger-color);
    font-size: toRem(13);
    font-weight: 600;
  }

  &__notes {
    display: grid;
    gap: toRem(8);
    padding-inline-start: toRem(18);
    list-style: disc;

    &_ordered {
      list-style: decimal;
    }
  }
}
</style>
