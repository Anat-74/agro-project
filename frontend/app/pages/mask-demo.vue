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
// Вырез под кнопку (низ-справа) SVG-путём — как на странице продуктов.
// bleed: нижний контур маски выводится за блок (борьба с субпиксельным швом).
const brMask = (bleed: number) => {
  const w = 172
  const h = 250
  const plate = 50.5
  const gap = 8
  const s = (plate + gap) / 2
  const r = (plate + gap - s) / 2
  const hb = h + bleed
  const xl = w - (s + 2 * r)
  const yt = h - 2 * s
  const xa = xl + s
  const ya = yt + s
  const card = `M ${r},0 H ${w - r} A ${r},${r} 0 0 1 ${w},${r} V ${hb - r} A ${r},${r} 0 0 1 ${w - r},${hb} H ${r} A ${r},${r} 0 0 1 0,${hb - r} V ${r} A ${r},${r} 0 0 1 ${r},0 Z`
  const cut = `M ${xl},${ya} A ${s},${s} 0 0 1 ${xa},${yt} H ${w - r} A ${r},${r} 0 0 0 ${w},${yt - r} V ${hb} H ${xl - r} A ${r},${r} 0 0 0 ${xl},${hb - r} Z`
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${hb}' preserveAspectRatio='none'><path fill-rule='evenodd' fill='#fff' d='${card} ${cut}'/></svg>`
  return {
    maskImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
  }
}

const brVariants = [
  { key: 'b0', label: 'bleed 0 — как сейчас в карточке', bleed: 0 },
  { key: 'b1', label: 'bleed 1px — нижний контур за блоком', bleed: 1 },
]

// Вырез в левом верхнем углу = ТОЧНЫЙ поворот кнопочного на 180°.
// Проверено попиксельно (рендер маски): расхождение 0.
// Параметры кнопки в карточке: плашка 50.5, зазор 8 → s = 29.25, r = 14.625.
// Варианты ФОРМЫ выреза под кнопку и плашки — для выбора «где что».
// f — внешние скругления выреза, inner — внутренний угол (дуга), plate — плашка,
// gap — зазор, tl/trbl/br — радиусы плашки (TL / TR+BL / BR).
const brShapeVariants = [
  { key: 'a', label: 'A. Классика (как было): дуга 29.25, скругления 14.6, плашка 50.5', f: 14.625, inner: 29.25, plate: 50.5, gap: 6, tl: 19.25, trbl: 12, br: 14.625 },
  { key: 'b', label: 'B. Классика, плашка −40% (29.1), зазор 6', f: 8.775, inner: 17.55, plate: 29.1, gap: 6, tl: 11.55, trbl: 4, br: 8.775 },
  { key: 'c', label: 'C. Вырез-прямоугольник 4px (текущий в карточке)', f: 4, inner: 4, plate: 29.1, gap: 6, tl: 4, trbl: 4, br: 8.775 },
  { key: 'd', label: 'D. Прямоугольник 4px, углы плашки 8.8', f: 4, inner: 4, plate: 29.1, gap: 6, tl: 8.775, trbl: 8.775, br: 8.775 },
  { key: 'e', label: 'E. Скругления 4 + внутренняя дуга 17.55', f: 4, inner: 17.55, plate: 29.1, gap: 6, tl: 11.55, trbl: 4, br: 8.775 },
  { key: 'f', label: 'F. Скругления 14.6 + внутренняя дуга 17.55', f: 14.625, inner: 17.55, plate: 29.1, gap: 6, tl: 11.55, trbl: 4, br: 8.775 },
]

type BrShape = (typeof brShapeVariants)[number]

const brShapeMask = (v: BrShape) => {
  const w = 172
  const h = 250
  const size = v.plate + v.gap
  const xl = w - size
  const yt = h - size
  const f = v.f
  const i = v.inner
  const r = v.br
  const card = `M ${r},0 H ${w - r} A ${r},${r} 0 0 1 ${w},${r} V ${h - r} A ${r},${r} 0 0 1 ${w - r},${h} H ${r} A ${r},${r} 0 0 1 0,${h - r} V ${r} A ${r},${r} 0 0 1 ${r},0 Z`
  const cut = `M ${xl + i},${yt} H ${w - f} A ${f},${f} 0 0 1 ${w},${yt + f} V ${h - f} A ${f},${f} 0 0 1 ${w - f},${h} H ${xl + f} A ${f},${f} 0 0 1 ${xl},${h - f} V ${yt + i} A ${i},${i} 0 0 1 ${xl + i},${yt} Z`
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='none'><path fill-rule='evenodd' fill='#fff' d='${card} ${cut}'/></svg>`
  return {
    maskImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
  }
}

const brShapePlate = (v: BrShape) => ({
  width: `${v.plate}px`,
  height: `${v.plate}px`,
  borderRadius: `${v.tl}px ${v.trbl}px ${v.br}px ${v.trbl}px`,
})

// === Конструктор выреза и плашки (раздел 3e) ===
// Значения по умолчанию = то, что сейчас в карточке товара.
const ctor = reactive({
  plate: 29.1, // размер плашки
  gap: 6, // зазор между плашкой и кромкой выреза
  f: 4, // внешние скругления выреза
  inner: 4, // внутренний угол выреза (дуга)
  tl: 4, // радиус TL плашки
  trbl: 4, // радиусы TR и BL плашки
  br: 8.78, // радиус BR плашки
})

// Производные величины (как в SCSS-константах карточки):
// s = (plate + gap) / 2, r = (plate + gap − s) / 2 — радиус кромки карточки.
const ctorSize = computed(() => ctor.plate + ctor.gap)
const ctorS = computed(() => ctorSize.value / 2)
const ctorCardR = computed(() => (ctorSize.value - ctorS.value) / 2)

const ctorMask = computed(() => {
  const w = 172
  const h = 250
  const xl = w - ctorSize.value
  const yt = h - ctorSize.value
  const f = ctor.f
  const i = ctor.inner
  const r = ctorCardR.value
  const card = `M ${r},0 H ${w - r} A ${r},${r} 0 0 1 ${w},${r} V ${h - r} A ${r},${r} 0 0 1 ${w - r},${h} H ${r} A ${r},${r} 0 0 1 0,${h - r} V ${r} A ${r},${r} 0 0 1 ${r},0 Z`
  const cut = `M ${xl + i},${yt} H ${w - f} A ${f},${f} 0 0 1 ${w},${yt + f} V ${h - f} A ${f},${f} 0 0 1 ${w - f},${h} H ${xl + f} A ${f},${f} 0 0 1 ${xl},${h - f} V ${yt + i} A ${i},${i} 0 0 1 ${xl + i},${yt} Z`
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='none'><path fill-rule='evenodd' fill='#fff' d='${card} ${cut}'/></svg>`
  return {
    maskImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
  }
})

const ctorPlate = computed(() => ({
  width: `${ctor.plate}px`,
  height: `${ctor.plate}px`,
  borderRadius: `${ctor.tl}px ${ctor.trbl}px ${ctor.br}px ${ctor.trbl}px`,
}))

const ctorCode = computed(
  () =>
    `plate ${ctor.plate} · gap ${ctor.gap} · cut ${ctorSize.value.toFixed(2)} · s ${ctorS.value.toFixed(2)} · r ${ctorCardR.value.toFixed(3)} | вырез: внешн ${ctor.f} · внутр ${ctor.inner} | плашка: TL ${ctor.tl} · TR/BL ${ctor.trbl} · BR ${ctor.br}`
)

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
      <h2 class="mask-demo__subtitle">3c. Шов на нижней кромке (bleed)</h2>
      <p class="mask-demo__hint">
        Вырез под кнопку, SVG-маска (как на странице продуктов). Слева — нижний
        контур маски ровно по границе блока, справа — выведен на 1px ниже.
        Смотреть на стык дуги с нижней кромкой (слева от кнопки).
      </p>
      <ul class="mask-demo__params">
        <li v-for="v in brVariants" :key="v.key" class="mask-demo__param">
          <div class="mask-demo__stage mask-demo__stage_tight">
            <div class="mask-demo__tlCard" :style="brMask(v.bleed)">
              <div class="mask-demo__brPlate" />
            </div>
          </div>
          <p class="mask-demo__caption">{{ v.label }}</p>
        </li>
      </ul>
    </section>

    <section class="mask-demo__section">
      <h2 class="mask-demo__subtitle">3d. Форма выреза и кнопки — варианты</h2>
      <p class="mask-demo__hint">
        Один и тот же угол карточки. Меняются: внешние скругления выреза, внутренний
        угол (дуга), размер плашки и её радиусы. Скажите букву — перенесу в карточку.
      </p>
      <ul class="mask-demo__params">
        <li v-for="v in brShapeVariants" :key="v.key" class="mask-demo__param">
          <div class="mask-demo__stage mask-demo__stage_tight">
            <div class="mask-demo__tlCard" :style="brShapeMask(v)">
              <div class="mask-demo__shapePlate" :style="brShapePlate(v)" />
            </div>
          </div>
          <p class="mask-demo__caption">{{ v.label }}</p>
        </li>
      </ul>
    </section>

    <section class="mask-demo__section">
      <h2 class="mask-demo__subtitle">3e. Конструктор выреза и плашки</h2>
      <p class="mask-demo__hint">
        Меняйте значения — карточка сверху обновляется сразу, ползунки — под ней.
        Строка внизу — то, что нужно прислать, чтобы перенести параметры в карточку товара.
      </p>
      <div class="mask-demo__ctor">
        <div class="mask-demo__stage">
          <!-- Плашка ОБЯЗАТЕЛЬНО снаружи маскированного элемента: маска срезает
               всё поддерево, и вложенная плашка попадала в «дырку» и исчезала. -->
          <div class="mask-demo__tlCardWrap">
            <div class="mask-demo__tlCard" :style="ctorMask" />
            <div class="mask-demo__shapePlate" :style="ctorPlate" />
          </div>
        </div>
        <div class="mask-demo__ctorControls">
          <label class="mask-demo__ctorRow">
            <span>Плашка: {{ ctor.plate }}px</span>
            <input v-model.number="ctor.plate" type="range" min="16" max="60" step="0.1">
          </label>
          <label class="mask-demo__ctorRow">
            <span>Зазор: {{ ctor.gap }}px</span>
            <input v-model.number="ctor.gap" type="range" min="0" max="16" step="0.5">
          </label>
          <label class="mask-demo__ctorRow">
            <span>Вырез, внешние: {{ ctor.f }}px</span>
            <input v-model.number="ctor.f" type="range" min="0" max="20" step="0.5">
          </label>
          <label class="mask-demo__ctorRow">
            <span>Вырез, внутренний: {{ ctor.inner }}px</span>
            <input v-model.number="ctor.inner" type="range" min="0" max="30" step="0.5">
          </label>
          <label class="mask-demo__ctorRow">
            <span>Плашка TL: {{ ctor.tl }}px</span>
            <input v-model.number="ctor.tl" type="range" min="0" max="20" step="0.5">
          </label>
          <label class="mask-demo__ctorRow">
            <span>Плашка TR/BL: {{ ctor.trbl }}px</span>
            <input v-model.number="ctor.trbl" type="range" min="0" max="20" step="0.5">
          </label>
          <label class="mask-demo__ctorRow">
            <span>Плашка BR: {{ ctor.br }}px</span>
            <input v-model.number="ctor.br" type="range" min="0" max="20" step="0.5">
          </label>
        </div>
      </div>
      <p class="mask-demo__caption mask-demo__caption_code">{{ ctorCode }}</p>
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
    // Светло-серая «карточка»: белая плашка видна на ней, а вырез — на тёмной сцене
    background-color: #e9e7e2;
  }

  // Обёртка конструктора: плашка лежит рядом с маскированной карточкой, а не внутри.
  &__tlCardWrap {
    position: relative;
    width: toRem(172);
    height: toRem(250);
  }

  // Плашка кнопки в вырезе (низ-справа) для тайлов bleed
  &__brPlate {
    position: absolute;
    inset-block-end: 0;
    inset-inline-end: 0;
    width: 50.5px;
    height: calc(50.5px + 1px);
    border: toRem(1) solid var(--success-color);
    border-radius: 21.25px 14.625px 14.625px 14.625px;
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

  // Плашка кнопки в вариантах 3d (размер и радиусы задаются инлайном)
  &__shapePlate {
    position: absolute;
    inset-block-end: 0;
    inset-inline-end: 0;
    border: toRem(2) solid var(--success-color);
    background-color: var(--light-color);
  }

  // Конструктор: слева инпуты, справа живая карточка
  &__ctor {
    // Карточка сверху, ползунки — сразу под ней (одна колонка на любой ширине).
    display: flex;
    flex-direction: column;
    gap: toRem(16);
    align-items: stretch;
  }

  &__ctorControls {
    display: grid;
    gap: toRem(10);
  }

  &__ctorRow {
    display: grid;
    gap: toRem(4);
    font-size: toRem(13);

    input {
      width: 100%;
      accent-color: var(--success-color);
    }
  }

  &__caption_code {
    padding: toRem(8);
    border-radius: toRem(6);
    background-color: var(--whitesmoke-color);
    color: var(--color);
    font-family: monospace;
    font-size: toRem(12);
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
