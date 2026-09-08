<script setup lang="ts">
type InputType = 'text' | 'textarea' | 'search' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'checkbox' | 'radio' | 'range' | 'range-dual'

interface Props {
  type?: InputType
  label?: string
  placeholder?: string
  rows?: number
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  icon?: string
  autocomplete?: string
  min?: number
  max?: number
  step?: number
  ariaLabel?: string
  // Для radio: значение опции и имя группы
  value?: string
  name?: string
  // checkbox-пилюля (теги): скрытый чекбокс + label-пилюля, модель — массив значений
  pill?: boolean
}

const { type = 'text', label = '', placeholder = '', rows = 3,
  disabled = false, readonly = false, required = false, error = '', icon = '',
  autocomplete = '', min = 0, max = 100, step = 1, ariaLabel = '', value = '', name = '',
  pill = false } = defineProps<Props>()

const model = defineModel<any>()
const inputId = useId()
const showPassword = ref(false)
const { currentLocale } = useLocale()
const passwordLabels = { ru: { show: 'Показать пароль', hide: 'Скрыть пароль' }, be: { show: 'Паказаць пароль', hide: 'Схаваць пароль' } }
const passwordLabel = computed(() => showPassword.value
  ? passwordLabels[currentLocale.value]?.hide || passwordLabels.ru.hide
  : passwordLabels[currentLocale.value]?.show || passwordLabels.ru.show)
const inputType = computed(() => {
  if (type === 'password' && showPassword.value) return 'text'
  return type
})

// Проверка/смена: для пилюли модель — массив выбранных значений, для обычного checkbox — boolean
const onCheckboxChange = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  if (pill) {
    const arr: string[] = Array.isArray(model.value) ? [...model.value] : []
    model.value = checked ? [...arr, value] : arr.filter((v) => v !== value)
  } else {
    model.value = checked
  }
}

// ===== Двойной ползунок (range-dual): модель — кортеж [min, max] =====
const modelTuple = computed<[number, number]>(() => {
  if (Array.isArray(model.value)) {
    return [Number(model.value[0] ?? min), Number(model.value[1] ?? max)]
  }
  return [min, max]
})
const minPct = computed(() => ((modelTuple.value[0] - min) / (max - min)) * 100)
const maxPct = computed(() => 100 - ((modelTuple.value[1] - min) / (max - min)) * 100)
// Ручка (16px + 2px бордер = 20px, радиус 10px) должна помещаться в треке:
// позиционируем её внутри «рабочей» зоны (ширина контейнера минус 2×радиус),
// чтобы 0%/100% совпадали с центрами ручек и не обрезались overflow:hidden
// родителя. Радиус дублируем константой (px) для CSS-вычислений заливки.
const THUMB_R = 10

// Ручки не пересекаются: min не может стать больше max (и наоборот)
const onRangeMinInput = (e: Event) => {
  const v = Number((e.target as HTMLInputElement).value)
  model.value = [v, Math.max(v, modelTuple.value[1])]
}
const onRangeMaxInput = (e: Event) => {
  const v = Number((e.target as HTMLInputElement).value)
  model.value = [Math.min(v, modelTuple.value[0]), v]
}

// Клик по треку — перемещение БЛИЖАЙШЕЙ ручки (как в одинарном range у colorMode).
// Инпуты range-dual имеют pointer-events:none (иначе верхний перехватывал бы оба),
// поэтому клик ловим на самой обёртке-треке: считаем % от offsetX → значение и
// двигаем ту ручку, что ближе, с сохранением min ≤ max.
const rangeDualTrack = useTemplateRef<HTMLElement>("rangeDualTrack")
// Координата pointerdown на треке: если между down и click мышь сдвинулась — это
// НЕ клик, а отпускание после ПЕРЕТАСКИВАНИЯ ручки. Иначе по клику ручка
// пересчитывалась по точке отпускания и «уезжала» от края (напр. min → 60 вместо 0),
// из-за чего после возврата ползунка товары пропадали ($gte=60 → 0).
let rangeDownX = -1
const onRangeDualTrackDown = (e: PointerEvent) => {
  rangeDownX = e.clientX
}
const onRangeDualTrackClick = (e: MouseEvent) => {
  const track = rangeDualTrack.value
  if (!track) return
  // После перетаскивания ручки срабатывает click в точке отпускания — пропускаем.
  if (rangeDownX >= 0 && Math.abs(e.clientX - rangeDownX) > 4) return
  const rect = track.getBoundingClientRect()
  // Ручки ездят по «рабочей» зоне (внутри отступа = радиус ручки), поэтому
  // и клик-позицию считаем от неё — иначе клик у края даёт неверное значение.
  const innerLeft = rect.left + THUMB_R
  const innerWidth = rect.width - THUMB_R * 2
  const ratio = (e.clientX - innerLeft) / innerWidth
  const raw = min + ratio * (max - min)
  const value = Math.min(max, Math.max(min, Math.round(raw / step) * step))
  const curMin = modelTuple.value[0]
  const curMax = modelTuple.value[1]
  if (Math.abs(value - curMin) <= Math.abs(value - curMax)) {
    model.value = [Math.min(value, curMax), curMax]
  } else {
    model.value = [curMin, Math.max(value, curMin)]
  }
}
</script>

<template>
  <div class="u-input" :class="{ 'u-input_error': error }">
    <!-- Общий label: для checkbox/radio не рендерится — у них свой label внутри обёртки -->
    <label v-if="label && type !== 'checkbox' && type !== 'radio'" :for="inputId" class="u-input__label">
      {{ label }}
      <span v-if="required" class="u-input__required">*</span>
    </label>

    <textarea
      v-if="type === 'textarea'"
      :id="inputId"
      v-model="model"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :autocomplete="autocomplete || undefined"
      :aria-label="ariaLabel || undefined"
      class="u-input__field u-input__field_textarea"
    />

    <div v-else-if="type === 'checkbox'" :class="['u-input__checkbox-wrapper', { 'u-input__checkbox-wrapper_pill': pill }]">
      <input
        :id="inputId"
        type="checkbox"
        :checked="pill ? (Array.isArray(model) ? model.includes(value) : !!model) : !!model"
        :value="value"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete || undefined"
        :aria-label="ariaLabel || undefined"
        class="u-input__checkbox"
        @change="onCheckboxChange"
      >
      <label v-if="label" :for="inputId" :class="['u-input__checkbox-label', { 'u-input__checkbox-label_pill': pill }]">
        {{ label }}
        <span v-if="required" class="u-input__required">*</span>
      </label>
    </div>

    <div v-else-if="type === 'radio'" class="u-input__radio-wrapper">
      <input
        :id="inputId"
        type="radio"
        :name="name"
        :value="value"
        :checked="model === value"
        :disabled="disabled"
        :required="required"
        :aria-label="ariaLabel || undefined"
        class="u-input__radio"
        @change="model = value"
      >
      <label v-if="label" :for="inputId" class="u-input__radio-label">
        {{ label }}
        <span v-if="required" class="u-input__required">*</span>
      </label>
    </div>

    <div v-else-if="type === 'range'" class="u-input__range-wrapper">
      <input
        :id="inputId"
        v-model="model"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :aria-label="ariaLabel || undefined"
        class="u-input__range"
      >
    </div>

    <!-- Двойной ползунок (диапазон): модель — кортеж [min, max] -->
    <div v-else-if="type === 'range-dual'" ref="rangeDualTrack" class="u-input__range-dual-track" @pointerdown="onRangeDualTrackDown" @click="onRangeDualTrackClick">
      <div
        class="u-input__range-dual-fill"
        :style="{
          left: `calc(${THUMB_R}px + (100% - ${THUMB_R * 2}px) * ${minPct} / 100)`,
          right: `calc(${THUMB_R}px + (100% - ${THUMB_R * 2}px) * ${maxPct} / 100)`,
        }"
      />
      <input
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="modelTuple[0]"
        :disabled="disabled"
        class="u-input__range-dual-input u-input__range-dual-input_min"
        @input="onRangeMinInput"
      >
      <input
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="modelTuple[1]"
        :disabled="disabled"
        class="u-input__range-dual-input u-input__range-dual-input_max"
        @input="onRangeMaxInput"
      >
    </div>

    <div v-else class="u-input__wrapper">
      <Icon v-if="icon" :name="icon" class="u-input__icon" />
      <input
        :id="inputId"
        v-model="model"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete || undefined"
        :aria-label="ariaLabel || undefined"
        class="u-input__field"
        :class="{ 'u-input__field_password': type === 'password' }"
      >
      <UButton
        v-if="type === 'password'"
        variant="icon"
        class="u-input__toggle-password"
        :aria-label="passwordLabel"
        @click="showPassword = !showPassword"
      >
        <Icon :name="showPassword ? 'mdi:eye-off' : 'mdi:eye'" width="20" height="20" />
      </UButton>
    </div>

    <span v-if="error" class="u-input__error">{{ error }}</span>
  </div>
</template>

<style lang="scss" scoped>
.u-input {
  display: flex;
  flex-direction: column;
  row-gap: toEm(4);

  &_error {
    .u-input__field {
      border-color: var(--danger-color);
    }
  }

  &__label {
    font-weight: 500;
    color: var(--color);
    @include adaptiveValue("font-size", 14, 12);
  }

  &__required { color: var(--danger-color); }

  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__icon {
    position: absolute;
    left: toRem(12);
    font-size: toRem(18);
    color: var(--gray-color);
    pointer-events: none;
  }

  &__field {
    width: 100%;
    padding-inline: toRem(12);
    padding-block: toRem(10);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(4);
    color: var(--color);
    background-color: var(--bg);
    transition: border-color var(--transition-duration);
    @include adaptiveValue("font-size", 14, 13);

    &:focus-visible {
      outline: toRem(2) solid var(--warning-color);
      outline-offset: toRem(2);
    }

    &:disabled {
      background-color: var(--bg);
      opacity: 0.6;
      cursor: not-allowed;
    }

    &_textarea {
      resize: vertical;
      min-height: toRem(80);
    }
  }

  &__checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: toEm(8);
  }

  &__checkbox {
    appearance: none;
    width: toRem(18);
    height: toRem(18);
    border: toRem(2) solid var(--border-color);
    border-radius: toRem(3);
    cursor: pointer;
    flex-shrink: 0;
    transition: all var(--transition-duration);
    position: relative;

    &:checked {
      background-color: var(--success-color);
      border-color: var(--success-color);

      &::after {
        content: '';
        position: absolute;
        top: 45%;
        left: 50%;
        width: toRem(5);
        height: toRem(9);
        border: solid var(--light-color);
        border-width: 0 toRem(2) toRem(2) 0;
        transform: translate(-50%, -50%) rotate(45deg);
      }
    }

    &:focus-visible {
      outline: toRem(2) solid var(--warning-color);
      outline-offset: toRem(2);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__checkbox-label {
    cursor: pointer;
    font-size: toRem(14);
    color: var(--color);
    user-select: none;
  }

  // ===== Checkbox-пилюля (теги) =====
  &__checkbox-wrapper_pill {
    .u-input__checkbox {
      display: none;
    }
  }

  &__checkbox-label_pill {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    padding: toRem(6) toRem(16);
    background: var(--whitesmoke-color);
    border-radius: toRem(20);
    border: toRem(1) solid transparent;
    font-size: toEm(13);
    color: var(--gray-color);
    transition: all var(--transition-duration);
    user-select: none;

    @include hover {
      background: var(--bg-product);
      border-color: var(--success-color);
    }
  }

  // Выбранная пилюля (input скрыт → управляем через :has на обёртке)
  &__checkbox-wrapper_pill:has(.u-input__checkbox:checked) {
    .u-input__checkbox-label_pill {
      background: var(--success-color);
      border-color: var(--success-color);
      color: var(--light-color);
    }
  }

  &__radio-wrapper {
    display: flex;
    align-items: center;
    gap: toEm(8);
  }

  &__radio {
    appearance: none;
    width: toRem(16);
    height: toRem(16);
    border: toRem(2) solid var(--border-color);
    border-radius: 50%;
    cursor: pointer;
    flex-shrink: 0;
    position: relative;
    transition: all var(--transition-duration);

    &:checked {
      border-color: var(--success-color);
      background-color: var(--success-color);

      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: toRem(6);
        height: toRem(6);
        background: var(--light-color);
        border-radius: 50%;
        transform: translate(-50%, -50%);
      }
    }

    @include hover {
      border-color: var(--success-color);
    }

    &:focus-visible {
      outline: toRem(2) solid var(--warning-color);
      outline-offset: toRem(2);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__radio-label {
    cursor: pointer;
    font-size: toRem(15);
    color: var(--gray-color);
    transition: color var(--transition-duration);
    user-select: none;
  }

  &__range {

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: toRem(18);
      height: toRem(18);
      border-radius: 50%;
      background: var(--primary-color);
      border: toRem(2) solid var(--light-color);
      box-shadow: 0 toRem(2) toRem(8) rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: transform var(--transition-duration),
                  background var(--transition-duration);
    }

    &::-moz-range-thumb {
      width: toRem(18);
      height: toRem(18);
      border-radius: 50%;
      background: var(--primary-color);
      border: toRem(2) solid var(--light-color);
      box-shadow: 0 toRem(2) toRem(8) rgba(0, 0, 0, 0.15);
      cursor: pointer;
    }

    &::-moz-range-track {
      height: toRem(6);
      border-radius: toRem(4);
      background: var(--gray-color);
    }
  }

  // ===== Двойной ползунок (range-dual) =====
  &__range-dual-track {
    position: relative;
    // content-box обязателен: глобально box-sizing:border-box, а при height:4 +
    // padding-block 8×2 content схлопнулся бы в 0 и линия (background-clip:
    // content-box) не рисовалась. content-box → content 4px, линия по центру 20px.
    box-sizing: content-box;
    height: toRem(4);
    // Воздух под ручку (20px) ВНУТРИ трека: content 4px + padding 8px×2 = 20px,
    // линия по центру. Так ручка целиком помещается в треке и не режется
    // overflow:hidden у прародителя (details-коллапс), и при закрытии секции
    // трек схлопывается в 0 (нет призрачного паддинга на блоке цены).
    padding-block: toRem(8);
    padding-inline: toRem(10);
    background: var(--border-color);
    background-clip: content-box; // линия только во внутренней «рабочей» зоне
    border-radius: toRem(2);
  }

  &__range-dual-fill {
    position: absolute;
    // Высота = толщина линии (content трека 4px), а не 100% трека: трек имеет
    // padding-block 8px под ручки, поэтому 100% дало бы полосу 20px («слишком
    // широкая»). Центрируем по вертикали.
    height: toRem(4);
    top: 50%;
    transform: translateY(-50%);
    background: var(--success-color);
    border-radius: toRem(2);
    pointer-events: none;
  }

  &__range-dual-input {
    position: absolute;
    top: 50%;
    left: toRem(10); // инпуты = рабочая зона (внутри padding трека)
    right: toRem(10);
    height: toRem(4);
    appearance: none;
    background: transparent;
    pointer-events: none;
    transform: translateY(-50%);

    &_min {
      z-index: 2;
    }

    &_max {
      z-index: 1;
    }

    &::-webkit-slider-thumb {
      appearance: none;
      width: toRem(16);
      height: toRem(16);
      background: var(--light-color);
      border: toRem(2) solid var(--success-color);
      border-radius: 50%;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 toRem(2) toRem(6) rgba(0, 0, 0, 0.15);
      transition: transform var(--transition-duration);

      @include hover {
        transform: scale(1.15);
      }
    }

    &::-moz-range-thumb {
      width: toRem(16);
      height: toRem(16);
      background: var(--light-color);
      border: toRem(2) solid var(--success-color);
      border-radius: 50%;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 toRem(2) toRem(6) rgba(0, 0, 0, 0.15);
    }
  }

  &__field_password {
    padding-inline-end: toRem(36);
  }

  &__toggle-password {
    position: absolute;
    right: toRem(4);
    padding: toRem(2);
    background: none;
    border: none;
    color: var(--text-muted);

    @include hover {
      color: var(--primary-color);
    }
  }

  &__error {
    color: var(--danger-color);
    @include adaptiveValue("font-size", 12, 11);
  }
}
</style>